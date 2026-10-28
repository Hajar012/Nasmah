import hashlib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
ASSET_FILES = ("style.css", "app.js", "admin.css", "admin.js")


def _asset_version() -> str:
    digest = hashlib.sha256()
    for name in ASSET_FILES:
        path = STATIC_DIR / name
        if path.is_file():
            digest.update(path.read_bytes())
        else:
            digest.update(name.encode("utf-8"))
    return digest.hexdigest()[:12]


ASSET_VERSION = _asset_version()
