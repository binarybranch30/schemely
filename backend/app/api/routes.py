from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.states import STATES
from app.models.catalog import Category, Scheme
from app.schemas.catalog import CatalogPage, CategoryOut, EligibilityOut, SchemeDetail
from app.schemas.profile import Profile
from app.services.eligibility import rank

router = APIRouter(prefix="/api")
DB = Annotated[Session, Depends(get_db)]


@router.get("/health")
def health(db: DB):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@router.get("/categories", response_model=list[CategoryOut])
def categories(db: DB):
    return db.scalars(select(Category).order_by(Category.name)).all()


@router.get("/states", response_model=list[str])
def states():
    return STATES


@router.get("/schemes", response_model=CatalogPage)
def schemes(
    db: DB,
    q: Annotated[str, Query(max_length=150)] = "",
    category: Annotated[str | None, Query(max_length=40)] = None,
    state: Annotated[str | None, Query(max_length=80)] = None,
    level: Literal["central", "state"] | None = None,
    featured: bool | None = None,
    sort: Literal["name", "name_desc", "featured"] = "name",
    page: Annotated[int, Query(ge=1, le=10000)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 12,
):
    filters = []
    if q.strip():
        for word in q.lower().split():
            filters.append(or_(*(func.lower(column).contains(word, autoescape=True) for column in (
                Scheme.name, Scheme.description, Scheme.benefits, Scheme.department, Scheme.category_id,
            ))))
    if category:
        filters.append(Scheme.category_id == category)
    if state:
        if state not in STATES:
            raise HTTPException(422, "Choose a valid Indian state or union territory")
        filters.append(or_(Scheme.state == state, Scheme.state.is_(None)))
    if level:
        filters.append(Scheme.level == level)
    if featured is not None:
        filters.append(Scheme.featured == featured)
    order = [Scheme.name.desc() if sort == "name_desc" else Scheme.name, Scheme.id]
    if sort == "featured":
        order.insert(0, Scheme.featured.desc())
    total = db.scalar(select(func.count()).select_from(Scheme).where(*filters))
    query = select(Scheme).where(*filters).order_by(*order).offset((page - 1) * page_size).limit(page_size)
    return {"items": db.scalars(query).all(), "total": total, "page": page, "page_size": page_size}


@router.get("/schemes/{scheme_id}", response_model=SchemeDetail)
def scheme(scheme_id: str, db: DB):
    record = db.get(Scheme, scheme_id)
    if record is None:
        raise HTTPException(404, "Scheme not found")
    return record


@router.post("/eligibility/check", response_model=EligibilityOut)
def eligibility(profile: Profile, db: DB):
    return rank(db.scalars(select(Scheme)).all(), profile)
