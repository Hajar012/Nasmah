import re
from pathlib import Path
from typing import Annotated
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import case
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.assets import ASSET_VERSION
from app.auth import (
    CSRF_COOKIE,
    AdminNotAuthenticated,
    AdminSession,
    clear_csrf_cookie,
    clear_login_failures,
    clear_session_cookie,
    client_key,
    cookie_is_secure,
    create_session,
    is_admin_configured,
    is_login_blocked,
    new_csrf_token,
    read_session,
    record_login_failure,
    set_csrf_cookie,
    set_session_cookie,
    tokens_match,
    verify_admin_credentials,
)
from app.database import get_db
from app.models import Company, Suggestion

BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=BASE_DIR / "templates")
templates.env.globals["asset_version"] = ASSET_VERSION

router = APIRouter(prefix="/staff", include_in_schema=False)

DbSession = Annotated[Session, Depends(get_db)]

MESSAGES = {
    "company_created": ("success", "Company added successfully."),
    "company_updated": ("success", "Company updated successfully."),
    "company_deleted": ("success", "Company deleted."),
    "suggestion_updated": ("success", "Suggestion updated."),
    "suggestion_approved": (
        "success",
        "Suggestion approved and added to the companies directory.",
    ),
    "suggestion_rejected": ("success", "Suggestion rejected."),
    "suggestion_deleted": ("success", "Suggestion deleted."),
    "suggestion_already_approved": ("info", "That suggestion is already approved."),
    "approval_failed": (
        "error",
        "The suggestion could not be approved. Please review its data and try again.",
    ),
}

LOGIN_MESSAGES = {
    "logged_out": ("success", "You have been signed out."),
}


def require_session(request: Request) -> AdminSession:
    session = read_session(request)
    if session is None:
        raise AdminNotAuthenticated()
    return session


SessionDep = Annotated[AdminSession, Depends(require_session)]


def require_csrf(
    session: SessionDep,
    csrf_token: Annotated[str, Form()],
) -> AdminSession:
    if not tokens_match(session.csrf, csrf_token):
        raise HTTPException(status_code=400, detail="Invalid or expired CSRF token.")
    return session


CsrfSessionDep = Annotated[AdminSession, Depends(require_csrf)]


def _message(request: Request) -> dict[str, str] | None:
    key = request.query_params.get("msg", "")
    value = MESSAGES.get(key)
    if value is None:
        return None
    return {"tone": value[0], "text": value[1]}


def _login_message(request: Request) -> dict[str, str] | None:
    key = request.query_params.get("msg", "")
    value = LOGIN_MESSAGES.get(key)
    if value is None:
        return None
    return {"tone": value[0], "text": value[1]}


def _render(
    request: Request,
    name: str,
    context: dict,
    status_code: int = 200,
):
    base = {
        "message": None,
        "error": None,
        "session": None,
        "csrf_token": "",
    }
    base.update(context)
    return templates.TemplateResponse(
        request=request,
        name=name,
        context=base,
        status_code=status_code,
    )


def _render_login(
    request: Request,
    error: str | None = None,
    status_code: int = 200,
):
    token = new_csrf_token()
    response = _render(
        request,
        "staff_login.html",
        {
            "csrf_token": token,
            "error": error,
            "message": _login_message(request),
        },
        status_code=status_code,
    )
    set_csrf_cookie(response, token, cookie_is_secure(request))
    return response


def _clean(value: str | None, max_length: int = 2000) -> str:
    return (value or "").strip()[:max_length]


def _validate_url(value: str, label: str, errors: list[str]) -> str | None:
    if not value:
        return None
    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        errors.append(f"{label} must start with http:// or https://.")
        return None
    return value


def _company_values(
    company_id: str = "",
    name_ar: str = "",
    name_en: str = "",
    career_url: str = "",
    linkedin_url: str = "",
    sector: str = "",
    location: str = "",
) -> dict[str, str]:
    return {
        "id": company_id,
        "name_ar": name_ar,
        "name_en": name_en,
        "career_url": career_url,
        "linkedin_url": linkedin_url,
        "sector": sector,
        "location": location,
    }


def _validate_company(values: dict[str, str], allow_new_id: bool) -> list[str]:
    errors: list[str] = []
    if allow_new_id and values["id"] and not re.fullmatch(r"[A-Za-z0-9_-]{1,32}", values["id"]):
        errors.append("Company ID may only contain letters, numbers, hyphens, and underscores (max 32).")
    if not values["name_en"]:
        errors.append("English company name is required.")
    if not values["name_ar"]:
        errors.append("Arabic company name is required.")
    if not values["sector"]:
        errors.append("Sector is required.")
    if not values["location"]:
        errors.append("Location is required.")
    _validate_url(values["career_url"], "Career URL", errors)
    _validate_url(values["linkedin_url"], "LinkedIn URL", errors)
    return errors


def _next_company_id(db: Session) -> str:
    existing_ids = {row[0] for row in db.query(Company.id).all()}
    highest = 0
    for company_id in existing_ids:
        match = re.fullmatch(r"[A-Za-z](\d+)", company_id or "")
        if match:
            highest = max(highest, int(match.group(1)))
    number = highest + 1
    while f"S{number:03d}" in existing_ids:
        number += 1
    return f"S{number:03d}"


def _suggestion_values(
    company_name: str = "",
    name_ar: str = "",
    career_url: str = "",
    linkedin_url: str = "",
    sector: str = "",
    location: str = "",
    notes: str = "",
) -> dict[str, str]:
    return {
        "company_name": company_name,
        "name_ar": name_ar,
        "career_url": career_url,
        "linkedin_url": linkedin_url,
        "sector": sector,
        "location": location,
        "notes": notes,
    }


def _validate_suggestion(values: dict[str, str]) -> list[str]:
    errors: list[str] = []
    if not values["company_name"]:
        errors.append("English company name is required.")
    if not values["career_url"]:
        errors.append("Career URL is required.")
    if not values["sector"]:
        errors.append("Sector is required.")
    _validate_url(values["career_url"], "Career URL", errors)
    _validate_url(values["linkedin_url"], "LinkedIn URL", errors)
    return errors


@router.get("/login")
def login_page(request: Request):
    if read_session(request) is not None:
        return RedirectResponse("/staff", status_code=303)
    return _render_login(request)


@router.post("/login")
def login(
    request: Request,
    username: Annotated[str, Form(max_length=200)],
    password: Annotated[str, Form(max_length=1024)],
    csrf_token: Annotated[str, Form()],
):
    cookie_token = request.cookies.get(CSRF_COOKIE, "")
    if not tokens_match(cookie_token, csrf_token):
        return _render_login(
            request,
            "Your login form expired. Please try again.",
            status_code=400,
        )

    key = client_key(request)
    if is_login_blocked(key):
        return _render_login(
            request,
            "Too many failed attempts. Please wait 15 minutes and try again.",
            status_code=429,
        )

    if not is_admin_configured():
        return _render_login(
            request,
            "Staff login is not configured on this server yet.",
            status_code=503,
        )

    if not verify_admin_credentials(username.strip(), password):
        record_login_failure(key)
        return _render_login(
            request,
            "Invalid username or password.",
            status_code=401,
        )

    clear_login_failures(key)
    response = RedirectResponse("/staff", status_code=303)
    set_session_cookie(response, create_session(username.strip()), cookie_is_secure(request))
    clear_csrf_cookie(response)
    return response


@router.post("/logout")
def logout(session: CsrfSessionDep):
    response = RedirectResponse("/staff/login?msg=logged_out", status_code=303)
    clear_session_cookie(response)
    clear_csrf_cookie(response)
    return response


@router.get("")
def dashboard(request: Request, session: SessionDep, db: DbSession):
    companies = db.query(Company).order_by(Company.name_en.asc()).all()
    suggestions = (
        db.query(Suggestion)
        .order_by(
            case(
                (Suggestion.status == "pending", 0),
                (Suggestion.status == "rejected", 1),
                else_=2,
            ),
            Suggestion.id.desc(),
        )
        .all()
    )
    counts = {
        "companies": len(companies),
        "pending": sum(1 for item in suggestions if item.status == "pending"),
        "approved": sum(1 for item in suggestions if item.status == "approved"),
        "rejected": sum(1 for item in suggestions if item.status == "rejected"),
    }
    return _render(
        request,
        "staff_dashboard.html",
        {
            "session": session,
            "csrf_token": session.csrf,
            "companies": companies,
            "suggestions": suggestions,
            "counts": counts,
            "message": _message(request),
            "active": "dashboard",
        },
    )


@router.get("/companies/new")
def new_company_page(request: Request, session: SessionDep):
    return _render(
        request,
        "staff_company_form.html",
        {
            "session": session,
            "csrf_token": session.csrf,
            "company": None,
            "values": _company_values(location="Riyadh"),
            "errors": [],
            "active": "companies",
        },
    )


@router.get("/companies/{company_id}/edit")
def edit_company_page(
    request: Request,
    company_id: str,
    session: SessionDep,
    db: DbSession,
):
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found.")
    values = _company_values(
        company.id,
        company.name_ar,
        company.name_en,
        company.career_url or "",
        company.linkedin_url or "",
        company.sector,
        company.location,
    )
    return _render(
        request,
        "staff_company_form.html",
        {
            "session": session,
            "csrf_token": session.csrf,
            "company": company,
            "values": values,
            "errors": [],
            "active": "companies",
        },
    )


@router.post("/companies/new")
def create_company(
    request: Request,
    session: CsrfSessionDep,
    db: DbSession,
    company_id: Annotated[str, Form()] = "",
    name_ar: Annotated[str, Form()] = "",
    name_en: Annotated[str, Form()] = "",
    career_url: Annotated[str, Form()] = "",
    linkedin_url: Annotated[str, Form()] = "",
    sector: Annotated[str, Form()] = "",
    location: Annotated[str, Form()] = "",
):
    values = _company_values(
        _clean(company_id, 32),
        _clean(name_ar, 300),
        _clean(name_en, 300),
        _clean(career_url),
        _clean(linkedin_url),
        _clean(sector, 200),
        _clean(location, 200),
    )
    errors = _validate_company(values, allow_new_id=True)
    if not errors:
        if not values["id"]:
            values["id"] = _next_company_id(db)
        company = Company(
            id=values["id"],
            name_ar=values["name_ar"],
            name_en=values["name_en"],
            career_url=values["career_url"] or None,
            linkedin_url=values["linkedin_url"] or None,
            sector=values["sector"],
            location=values["location"],
        )
        db.add(company)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            errors.append("That company ID is already in use.")
        else:
            return RedirectResponse(
                "/staff?msg=company_created#companies", status_code=303
            )

    return _render(
        request,
        "staff_company_form.html",
        {
            "session": session,
            "csrf_token": session.csrf,
            "company": None,
            "values": values,
            "errors": errors,
            "active": "companies",
        },
        status_code=400,
    )


@router.post("/companies/{company_id}/edit")
def update_company(
    request: Request,
    company_id: str,
    session: CsrfSessionDep,
    db: DbSession,
    name_ar: Annotated[str, Form()] = "",
    name_en: Annotated[str, Form()] = "",
    career_url: Annotated[str, Form()] = "",
    linkedin_url: Annotated[str, Form()] = "",
    sector: Annotated[str, Form()] = "",
    location: Annotated[str, Form()] = "",
):
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found.")

    values = _company_values(
        company.id,
        _clean(name_ar, 300),
        _clean(name_en, 300),
        _clean(career_url),
        _clean(linkedin_url),
        _clean(sector, 200),
        _clean(location, 200),
    )
    errors = _validate_company(values, allow_new_id=False)
    if not errors:
        company.name_ar = values["name_ar"]
        company.name_en = values["name_en"]
        company.career_url = values["career_url"] or None
        company.linkedin_url = values["linkedin_url"] or None
        company.sector = values["sector"]
        company.location = values["location"]
        db.commit()
        return RedirectResponse(
            "/staff?msg=company_updated#companies", status_code=303
        )

    return _render(
        request,
        "staff_company_form.html",
        {
            "session": session,
            "csrf_token": session.csrf,
            "company": company,
            "values": values,
            "errors": errors,
            "active": "companies",
        },
        status_code=400,
    )


@router.post("/companies/{company_id}/delete")
def delete_company(
    company_id: str,
    session: CsrfSessionDep,
    db: DbSession,
):
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found.")
    db.delete(company)
    db.commit()
    return RedirectResponse("/staff?msg=company_deleted#companies", status_code=303)


@router.get("/suggestions/{suggestion_id}/edit")
def edit_suggestion_page(
    request: Request,
    suggestion_id: int,
    session: SessionDep,
    db: DbSession,
):
    suggestion = db.get(Suggestion, suggestion_id)
    if suggestion is None:
        raise HTTPException(status_code=404, detail="Suggestion not found.")
    values = _suggestion_values(
        suggestion.company_name,
        suggestion.name_ar or "",
        suggestion.career_url,
        suggestion.linkedin_url or "",
        suggestion.sector,
        suggestion.location or "",
        suggestion.notes or "",
    )
    return _render(
        request,
        "staff_suggestion_form.html",
        {
            "session": session,
            "csrf_token": session.csrf,
            "suggestion": suggestion,
            "values": values,
            "errors": [],
            "active": "suggestions",
        },
    )


@router.post("/suggestions/{suggestion_id}/edit")
def update_suggestion(
    request: Request,
    suggestion_id: int,
    session: CsrfSessionDep,
    db: DbSession,
    company_name: Annotated[str, Form()] = "",
    name_ar: Annotated[str, Form()] = "",
    career_url: Annotated[str, Form()] = "",
    linkedin_url: Annotated[str, Form()] = "",
    sector: Annotated[str, Form()] = "",
    location: Annotated[str, Form()] = "",
    notes: Annotated[str, Form()] = "",
):
    suggestion = db.get(Suggestion, suggestion_id)
    if suggestion is None:
        raise HTTPException(status_code=404, detail="Suggestion not found.")

    values = _suggestion_values(
        _clean(company_name, 300),
        _clean(name_ar, 300),
        _clean(career_url),
        _clean(linkedin_url),
        _clean(sector, 200),
        _clean(location, 200),
        _clean(notes, 5000),
    )
    errors = _validate_suggestion(values)
    if not errors:
        suggestion.company_name = values["company_name"]
        suggestion.name_ar = values["name_ar"] or None
        suggestion.career_url = values["career_url"]
        suggestion.linkedin_url = values["linkedin_url"] or None
        suggestion.sector = values["sector"]
        suggestion.location = values["location"] or None
        suggestion.notes = values["notes"] or None
        db.commit()
        return RedirectResponse(
            "/staff?msg=suggestion_updated#suggestions", status_code=303
        )

    return _render(
        request,
        "staff_suggestion_form.html",
        {
            "session": session,
            "csrf_token": session.csrf,
            "suggestion": suggestion,
            "values": values,
            "errors": errors,
            "active": "suggestions",
        },
        status_code=400,
    )


@router.post("/suggestions/{suggestion_id}/approve")
def approve_suggestion(
    suggestion_id: int,
    session: CsrfSessionDep,
    db: DbSession,
):
    suggestion = db.get(Suggestion, suggestion_id)
    if suggestion is None:
        raise HTTPException(status_code=404, detail="Suggestion not found.")
    if suggestion.status == "approved":
        return RedirectResponse(
            "/staff?msg=suggestion_already_approved#suggestions", status_code=303
        )

    company = Company(
        id=_next_company_id(db),
        name_ar=(suggestion.name_ar or suggestion.company_name).strip(),
        name_en=suggestion.company_name.strip(),
        career_url=suggestion.career_url.strip() or None,
        linkedin_url=(suggestion.linkedin_url or "").strip() or None,
        sector=suggestion.sector.strip(),
        location=(suggestion.location or "Riyadh").strip() or "Riyadh",
    )
    db.add(company)
    suggestion.status = "approved"
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return RedirectResponse("/staff?msg=approval_failed#suggestions", status_code=303)

    return RedirectResponse("/staff?msg=suggestion_approved#suggestions", status_code=303)


@router.post("/suggestions/{suggestion_id}/reject")
def reject_suggestion(
    suggestion_id: int,
    session: CsrfSessionDep,
    db: DbSession,
):
    suggestion = db.get(Suggestion, suggestion_id)
    if suggestion is None:
        raise HTTPException(status_code=404, detail="Suggestion not found.")
    suggestion.status = "rejected"
    db.commit()
    return RedirectResponse("/staff?msg=suggestion_rejected#suggestions", status_code=303)


@router.post("/suggestions/{suggestion_id}/delete")
def delete_suggestion(
    suggestion_id: int,
    session: CsrfSessionDep,
    db: DbSession,
):
    suggestion = db.get(Suggestion, suggestion_id)
    if suggestion is None:
        raise HTTPException(status_code=404, detail="Suggestion not found.")
    db.delete(suggestion)
    db.commit()
    return RedirectResponse("/staff?msg=suggestion_deleted#suggestions", status_code=303)
