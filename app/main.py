import mimetypes
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.admin import router as staff_router
from app.auth import AdminNotAuthenticated
from app.routes import api_router, root_router
from app.seed import seed_companies

# Register custom MIME types for fonts
mimetypes.add_type("font/otf", ".otf")
mimetypes.add_type("font/woff2", ".woff2")

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"
FONTS_DIR = BASE_DIR / "fonts"

app = FastAPI(title="Nasmah")

# Mount static directories
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
if FONTS_DIR.is_dir():
    app.mount("/fonts", StaticFiles(directory=FONTS_DIR), name="fonts")

templates = Jinja2Templates(directory=TEMPLATES_DIR)

# Include root, API, and staff routers
app.include_router(root_router)
app.include_router(api_router)
app.include_router(staff_router)


@app.middleware("http")
async def staff_security_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path == "/staff" or request.url.path.startswith("/staff/"):
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "same-origin"
    return response


@app.exception_handler(AdminNotAuthenticated)
async def redirect_unauthenticated_staff(
    request: Request, exc: AdminNotAuthenticated
):
    return RedirectResponse("/staff/login", status_code=303)


@app.on_event("startup")
def on_startup():
    seed_companies()


@app.get("/")
def read_index(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")
