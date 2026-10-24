import mimetypes
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.routes import router
from app.seed import seed_companies

mimetypes.add_type("font/otf", ".otf")
mimetypes.add_type("font/woff2", ".woff2")

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"
FONTS_DIR = BASE_DIR / "fonts"

app = FastAPI(title="Nasmah")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
if FONTS_DIR.is_dir():
    app.mount("/fonts", StaticFiles(directory=FONTS_DIR), name="fonts")

templates = Jinja2Templates(directory=TEMPLATES_DIR)

app.include_router(router)


@app.on_event("startup")
def on_startup():
    seed_companies()


@app.get("/")
def read_index(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")
