# Nasmah — Development & Task Execution Plan

## Overview
Nasmah is a lightweight web directory built using **FastAPI**, **SQLite**, **Tailwind CSS**, and **Vanilla JavaScript**. It lists verified Saudi employers, provides direct links to careers and LinkedIn pages, and allows users to track their application progress locally in their browser.

---

## File & Directory Structure
Nasmah
├── app
│   ├── init.py
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── routes.py
│   └── seed.py
├── templates
│   └── index.html
├── static
│   └── style.css
├── data
│   └── companies.csv
├── requirements.txt
└── README.md

---

## CSV Headers Standard
The `data/companies.csv` file must follow this strict header layout:
`id,name_ar,name_en,career_url,linkedin_url,sector,location`

---

## Execution Phases & Tasks

### Phase 1: Environment, Schema & Database Core

* **Task 1: Environment Configuration (`requirements.txt`)**
  * Define explicit versions for `fastapi`, `uvicorn`, `sqlalchemy`, and `pydantic`.
  * Ensure no extra bloat dependencies are included.

* **Task 2: CSV Data Preparation (`data/companies.csv`)**
  * Ensure `data/companies.csv` exists and contains valid test data adhering strictly to the columns: `id,name_ar,name_en,career_url,linkedin_url,sector,location`.
  * Verify that unique string slugs are used for the `id` column (e.g., `elm`, `mis`).

* **Task 3: Database Models & Pydantic Schemas (`app/models.py`, `app/schemas.py`)**
  * Implement SQLAlchemy ORM `Company` model in `app/models.py` corresponding to all CSV fields.
  * Implement Pydantic `CompanyOut` schema in `app/schemas.py` for API response serialization (`from_attributes = True`).

* **Task 4: Database Session setup (`app/database.py`)**
  * Configure SQLite connection using `sqlite:///./nasmah.db`.
  * Set up `SessionLocal` and declarative `Base`.
  * Create `get_db` dependency generator for routes.

---

### Phase 2: Seeding Script & API Integration

* **Task 5: CSV Seeding Engine (`app/seed.py`)**
  * Write a idempotent script that reads `data/companies.csv` using Python's standard `csv` module.
  * Clear existing table records and reseed the SQLite database with updated CSV content on execution.
  * Print status confirmation upon execution.

* **Task 6: Read & Suggestion Routes (`app/routes.py`)**
  * Define `GET /api/companies` endpoint to fetch all companies ordered by `name_en`.
  * Define `POST /api/suggest` endpoint to receive user community suggestions (company name, career link, sector, optional notes) and append them to a local review log or database table.

* **Task 7: FastAPI App Assembly (`app/main.py`)**
  * Instantiate FastAPI application instance.
  * Mount `/static` directory (`StaticFiles`).
  * Initialize Jinja2 templates for `/templates`.
  * Bind standard router and trigger database initialization/seeding on startup.
  * Serve `index.html` at `GET /`.

---

### Phase 3: Single Page UI, Local State & Suggestion Panel

* **Task 8: HTML Structure & UI (`templates/index.html`)**
  * Build responsive layout using CDN-hosted Tailwind CSS.
  * Include a Header with progress indicator (e.g., "15 / 95 Applied").
  * Include control bar with Search bar (searching `name_ar` and `name_en`), Sector filter dropdown, and Status filter dropdown (All / Applied / Not Applied).
  * Build directory list container with privacy disclaimer note.
  * Build **Suggestion Panel** at the bottom allowing job seekers to submit missing companies.

* **Task 9: Styles & Custom Polish (`static/style.css`)**
  * Add custom font imports, custom scrollbar styling, and subtle UI animations.

* **Task 10: Client-Side Logic & Local Storage (`static/app.js`)**
  * Fetch company list asynchronously from `GET /api/companies`.
  * Implement checkmark state saved exclusively inside browser `localStorage` keyed by `id`.
  * Implement live client-side filtering (search string, sector dropdown, status filter).
  * Implement local state **Export / Import** helper functions (saving and restoring checkmarks as a tiny `.json` backup file).
  * Handle suggestion submission to `POST /api/suggest` with instant UI feedback.