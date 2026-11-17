from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.states import STATES


class Profile(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    age: Annotated[int, Field(ge=0, le=120)] | None = None
    gender: Literal["female", "male", "non_binary", "other"] | None = None
    state: str | None = None
    district: Annotated[str, Field(max_length=100)] | None = None
    residence: Literal["rural", "urban"] | None = None
    occupation: Literal["farmer", "student", "business", "worker", "homemaker", "retired", "other"] | None = None
    income: Annotated[int, Field(ge=0, le=1_000_000_000)] | None = None
    employment: Literal["employed", "self_employed", "unemployed", "retired", "not_seeking"] | None = None
    bpl: bool | None = None
    farmer: bool | None = None
    landholding: Annotated[float, Field(ge=0, le=100_000, allow_inf_nan=False)] | None = None
    education: Literal["none", "primary", "secondary", "higher_secondary", "diploma", "undergraduate", "postgraduate"] | None = None
    student: bool | None = None
    disability: bool | None = None
    social_category: Literal["general", "sc", "st", "obc", "ews", "other"] | None = None
    minority: bool | None = None
    marital_status: Literal["single", "married", "separated", "widowed"] | None = None

    street_vendor: bool | None = None
    pregnancy_or_recent_birth: bool | None = None
    daughter_under_ten: bool | None = None

    @field_validator("state")
    @classmethod
    def valid_state(cls, value):
        if value is not None and value not in STATES:
            raise ValueError("Choose a valid Indian state or union territory")
        return value
