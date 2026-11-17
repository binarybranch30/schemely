from datetime import date
from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class Record(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class CategoryOut(Record):
    id: str
    name: str


class SchemeSummary(Record):
    id: str
    name: str
    category: CategoryOut
    level: str
    state: str | None
    department: str
    description: str
    benefits: str
    featured: bool
    demo: bool


class RuleOut(Record):
    field: str
    operator: str
    value: bool | int | float | str | list[str]


class DocumentOut(Record):
    name: str


class SourceOut(Record):
    url: str
    application_url: str | None
    verification_status: str
    last_verified: date | None


class SchemeDetail(SchemeSummary):
    application_process: str
    rules: list[RuleOut]
    documents: list[DocumentOut]
    sources: list[SourceOut]


class CatalogPage(BaseModel):
    items: list[SchemeSummary]
    total: int
    page: int
    page_size: int


class Status(StrEnum):
    LIKELY = "likely"
    POSSIBLE = "possible"
    INELIGIBLE = "ineligible"


class Check(BaseModel):
    field: str
    outcome: str
    explanation: str


class Match(BaseModel):
    scheme: SchemeSummary
    status: Status
    checks: list[Check]


class EligibilityOut(BaseModel):
    items: list[Match]
    counts: dict[Status, int]
    categories: dict[str, int]
