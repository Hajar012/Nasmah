
from pydantic import BaseModel, ConfigDict


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name_ar: str
    name_en: str
    career_url: str | None = None
    linkedin_url: str | None = None
    sector: str
    location: str


class SuggestionCreate(BaseModel):
    company_name: str
    career_url: str
    sector: str
    notes: str | None = None


class SuggestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str
    career_url: str
    sector: str
    notes: str | None = None
