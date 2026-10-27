from urllib.parse import urlsplit

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _validate_http_url(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("URL must start with http:// or https://")
    return value


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
    company_name: str = Field(min_length=1, max_length=300)
    career_url: str = Field(min_length=1, max_length=2000)
    sector: str = Field(min_length=1, max_length=200)
    notes: str | None = Field(default=None, max_length=5000)
    name_ar: str | None = Field(default=None, max_length=300)
    linkedin_url: str | None = Field(default=None, max_length=2000)
    location: str | None = Field(default=None, max_length=200)

    @field_validator("company_name", "sector")
    @classmethod
    def _strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Value must not be empty")
        return value

    @field_validator("notes", "name_ar", "location")
    @classmethod
    def _strip_optional(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("career_url", "linkedin_url")
    @classmethod
    def _validate_urls(cls, value: str | None) -> str | None:
        return _validate_http_url(value)


class SuggestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str
    name_ar: str | None = None
    career_url: str
    linkedin_url: str | None = None
    sector: str
    location: str | None = None
    notes: str | None = None
    status: str
