import csv
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.database import Base, SessionLocal, engine
from app.models import Company

CSV_PATH = BASE_DIR / "data" / "companies.csv"


def seed_companies():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        db.query(Company).delete()

        with CSV_PATH.open(newline="", encoding="utf-8-sig") as csv_file:
            reader = csv.DictReader(csv_file)
            count = 0
            for row in reader:
                company = Company(
                    id=row["id"].strip(),
                    name_ar=row["name_ar"].strip(),
                    name_en=row["name_en"].strip(),
                    career_url=row["career_url"].strip() or None,
                    linkedin_url=row["linkedin_url"].strip() or None,
                    sector=row["sector"].strip(),
                    location=row["location"].strip() or "Riyadh",
                )
                db.add(company)
                count += 1

        db.commit()
        print(f"Seeded {count} companies from {CSV_PATH}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_companies()
