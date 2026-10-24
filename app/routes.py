from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Company, Suggestion
from app.schemas import CompanyOut, SuggestionCreate, SuggestionOut

router = APIRouter(prefix="/api")

# Create a reusable type alias for the database session
DbSession = Annotated[Session, Depends(get_db)]

@router.get("/companies", response_model=list[CompanyOut])
def get_companies(db: DbSession):
    return db.query(Company).order_by(Company.id).all()


@router.post("/suggest", response_model=SuggestionOut)
def create_suggestion(payload: SuggestionCreate, db: DbSession):
    suggestion = Suggestion(**payload.model_dump())
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    return suggestion
