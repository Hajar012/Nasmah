from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Company, Suggestion
from app.schemas import CompanyOut, SuggestionCreate, SuggestionOut

# Router for root-level utility endpoints (like /health)
root_router = APIRouter()

# Router for API endpoints (prefixed with /api)
api_router = APIRouter(prefix="/api")

DbSession = Annotated[Session, Depends(get_db)]


# --- Root Level Endpoints ---

# --- Root Level Endpoints ---

@root_router.get("/health", tags=["Health"])
def health_check(db: DbSession):
    """Health check endpoint to verify server and database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except SQLAlchemyError as e:
        return {"status": "unhealthy", "database": str(e)}


# --- API Endpoints (/api/...) ---

@api_router.get("", tags=["API Information"])
@api_router.get("/", tags=["API Information"])
def api_root():
    """Endpoint hit when visiting /api or /api/ directly."""
    return {
        "message": "Nasmah API is active",
        "version": "1.0.0",
        "endpoints": [
            "/api/companies",
            "/api/suggest",
        ]
    }


@api_router.get("/companies", response_model=list[CompanyOut], tags=["Companies"])
def get_companies(db: DbSession):
    return db.query(Company).order_by(Company.id).all()


@api_router.post("/suggest", response_model=SuggestionOut, tags=["Suggestions"])
def create_suggestion(payload: SuggestionCreate, db: DbSession):
    suggestion = Suggestion(**payload.model_dump(), status="pending")
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    return suggestion