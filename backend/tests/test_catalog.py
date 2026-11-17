import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.db import get_db
from app.main import app
from app.models.catalog import Base, Document, Rule, Scheme, Source
from app.services.seed import seed


@pytest.fixture
def db_engine():
    result = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
    Base.metadata.create_all(result)
    with Session(result) as db, db.begin():
        seed(db)
    yield result
    result.dispose()


@pytest.fixture
def client(db_engine):
    def override():
        with Session(db_engine) as session:
            yield session
    app.dependency_overrides[get_db] = override
    with TestClient(app) as test:
        yield test
    app.dependency_overrides.clear()


def matches(client, profile):
    response = client.post("/api/eligibility/check", json=profile)
    assert response.status_code == 200, response.text
    assert response.headers["cache-control"] == "no-store"
    data = response.json()
    assert sum(data["counts"].values()) == 34
    return {item["scheme"]["id"]: item for item in data["items"]}


def test_idempotent_seed(db_engine):
    with Session(db_engine) as db, db.begin():
        def snapshot():
            return [db.scalars(select(model.id).order_by(model.id)).all() for model in (Scheme, Rule, Document, Source)]
        before = snapshot()
        seed(db)
        assert snapshot() == before
        assert db.scalar(select(func.count()).select_from(Scheme)) == 34


def test_endpoints(client):
    assert client.get("/api/health").json() == {"status": "ok"}
    assert len(client.get("/api/categories").json()) == 10
    assert len(client.get("/api/states").json()) == 36
    detail = client.get("/api/schemes/pm-kisan").json()
    assert detail["demo"] and detail["rules"] and detail["documents"]
    assert detail["sources"][0]["url"] == "https://pmkisan.gov.in/"
    assert client.get("/api/schemes/missing").status_code == 404
    invalid = client.post("/api/eligibility/check", json={"age": -1, "aadhaar": "sensitive"})
    assert invalid.status_code == 422 and len(invalid.json()["issues"]) == 2
    assert "sensitive" not in invalid.text


def test_search_filters_pagination_and_sort(client):
    params = {"q": "post matric", "category": "education", "state": "Maharashtra", "level": "state"}
    response = client.get("/api/schemes", params=params).json()
    assert [item["id"] for item in response["items"]] == ["mahadbt"]
    assert client.get("/api/schemes", params={"q": "%"}).json()["total"] == 0
    first = client.get("/api/schemes?page_size=2&sort=name_desc").json()
    second = client.get("/api/schemes?page_size=2&page=2&sort=name_desc").json()
    assert first["total"] == 34 and len(first["items"]) == 2
    assert first["items"][-1]["name"] > second["items"][0]["name"]
    assert client.get("/api/schemes?page=0").status_code == 422


@pytest.mark.parametrize(("age", "income", "expected"), [
    (17, 450000, "likely"), (25, 450000, "likely"), (26, 450000, "ineligible"),
    (16, 450000, "ineligible"), (22, 450001, "ineligible"), (22, None, "possible"),
])
def test_boundaries(client, age, income, expected):
    result = matches(client, {"age": age, "income": income, "student": True, "education": "undergraduate"})
    assert result["csss"]["status"] == expected


def test_missing_and_conflicting_conditions(client):
    result = matches(client, {"farmer": True, "age": 17})
    checks = result["pm-kisan"]["checks"]
    assert result["pm-kisan"]["status"] == "ineligible"
    assert {check["outcome"] for check in checks} == {"pass", "fail", "missing"}
    assert matches(client, {})["pm-kisan"]["status"] == "possible"


@pytest.mark.parametrize(("state", "expected"), [("Maharashtra", "likely"), ("Kerala", "ineligible"), (None, "possible")])
def test_state_rules(client, state, expected):
    assert matches(client, {"farmer": True, "state": state})["namo-shetkari"]["status"] == expected


@pytest.mark.parametrize(("profile", "target", "unmatched"), [
    ({"age": 32, "income": 90000, "bpl": True, "farmer": True, "landholding": 1.5, "residence": "rural",
      "state": "Maharashtra", "student": False}, "pm-kisan", "csss"),
    ({"age": 20, "income": 150000, "student": True, "education": "undergraduate",
      "farmer": False, "state": "Karnataka"}, "csss", "ignoaps"),
    ({"age": 67, "income": 75000, "bpl": True, "farmer": False, "student": False,
      "state": "West Bengal", "employment": "retired"}, "ignoaps", "pm-kisan"),
])
def test_citizen_journeys(client, profile, target, unmatched):
    assert client.get(f"/api/schemes/{target}").status_code == 200
    result = matches(client, profile)
    assert result[target]["status"] == "likely"
    assert result[unmatched]["status"] == "ineligible"
    assert all(check["outcome"] == "pass" for check in result[target]["checks"])
