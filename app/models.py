from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, index=True)
    name_ar = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    career_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    sector = Column(String, nullable=False, index=True)
    location = Column(String, nullable=False, default="Riyadh")


class Suggestion(Base):
    __tablename__ = "suggestions"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    company_name = Column(String, nullable=False)
    career_url = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    notes = Column(String, nullable=True)
