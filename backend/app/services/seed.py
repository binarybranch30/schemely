import csv
import json
import os
import re
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.db import engine
from app.models.catalog import Category, Document, Rule, Scheme, Source

CATALOG = {
    "agriculture": ("Agriculture", "Land or cultivation records"),
    "education": ("Education & Scholarships", "Enrolment or academic records"),
    "health": ("Healthcare", "Beneficiary or household records"),
    "women": ("Women & Child Welfare", "Age or household records"),
    "employment": ("Employment", "Education or training records"),
    "business": ("Entrepreneurship", "Enterprise or project records"),
    "housing": ("Housing", "Residence and household records"),
    "senior": ("Senior Citizens", "Age and income records"),
    "disability": ("Disability Assistance", "Disability certificate"),
    "finance": ("Financial Inclusion", "Bank account records"),
}
DEFAULT_SEED = Path(__file__).resolve().parents[3] / "database" / "seed_data" / "catalog.tsv"


def rule_record(expression):
    field, symbol, raw = re.split(r"(>=|<=|=)", expression, maxsplit=1)
    if "," in raw:
        return {"field": field, "operator": "in", "value": raw.split(",")}
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        value = raw
    return {"field": field, "operator": {">=": "gte", "<=": "lte", "=": "eq"}[symbol], "value": value}


def replace_changed(scheme, attr, model, records):
    current = getattr(scheme, attr)
    if len(current) != len(records) or any(
        any(getattr(row, key) != value for key, value in record.items())
        for row, record in zip(current, records)
    ):
        setattr(scheme, attr, [model(**record) for record in records])


def seed(db: Session, path: Path = DEFAULT_SEED):
    for key, (name, _) in CATALOG.items():
        db.merge(Category(id=key, name=name))
    db.flush()
    with path.open(encoding="utf-8", newline="") as stream:
        for row in csv.reader(stream, delimiter="|"):
            scheme_id, name, category, department, description, rules, url, *extras = row
            state, featured = (extras + ["", ""])[:2]
            scheme = db.get(Scheme, scheme_id)
            if scheme is None:
                scheme = Scheme(id=scheme_id)
                db.add(scheme)
            scheme.name = name
            scheme.category_id = category
            scheme.department = department
            scheme.description = description
            scheme.benefits = description
            scheme.state = state or None
            scheme.level = "state" if state else "central"
            scheme.featured = featured == "1"
            scheme.demo = True
            scheme.application_process = (
                "Open the official reference and locate the current scheme guidance. "
                "Confirm the application window, required documents and submission channel with the responsible department."
            )
            expressions = ([f"state={state}"] if state else []) + rules.split(";")
            replace_changed(scheme, "rules", Rule, [rule_record(expression) for expression in expressions])
            replace_changed(scheme, "documents", Document, [{"name": CATALOG[category][1]}])
            replace_changed(scheme, "sources", Source, [{
                "url": url, "application_url": None,
                "verification_status": "Official reference; demo rules unverified", "last_verified": None,
            }])
    db.flush()


if __name__ == "__main__":
    with Session(engine) as session, session.begin():
        seed(session, Path(os.getenv("SCHEME_SEED_PATH", DEFAULT_SEED)))
