from sqlalchemy import inspect, text

from app.database import engine
from app.models import Base

# Additive-only migrations. Existing columns and rows are never modified.
SUGGESTION_COLUMNS = {
    "name_ar": "VARCHAR",
    "linkedin_url": "VARCHAR",
    "location": "VARCHAR",
    "status": "VARCHAR NOT NULL DEFAULT 'pending'",
}


def ensure_schema() -> None:
    """Create missing tables and add new nullable/defaulted columns safely."""
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    if "suggestions" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("suggestions")}
    missing = [
        (name, definition)
        for name, definition in SUGGESTION_COLUMNS.items()
        if name not in existing
    ]

    if missing:
        with engine.begin() as connection:
            for name, definition in missing:
                if engine.dialect.name == "postgresql":
                    statement = (
                        f"ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS {name} {definition}"
                    )
                else:
                    statement = f"ALTER TABLE suggestions ADD COLUMN {name} {definition}"
                connection.execute(text(statement))

    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_suggestions_status "
                "ON suggestions (status)"
            )
        )
