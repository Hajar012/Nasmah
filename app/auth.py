import base64
import getpass
import hashlib
import hmac
import json
import os
import secrets
import threading
import time
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Request

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SESSION_COOKIE = "nasmah_staff_session"
CSRF_COOKIE = "nasmah_staff_csrf"
SESSION_TTL_SECONDS = int(os.getenv("ADMIN_SESSION_TTL_SECONDS", "28800"))
LOGIN_MAX_ATTEMPTS = int(os.getenv("ADMIN_LOGIN_MAX_ATTEMPTS", "5"))
LOGIN_WINDOW_SECONDS = int(os.getenv("ADMIN_LOGIN_WINDOW_SECONDS", "900"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin").strip() or "admin"
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "").strip()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")

_SESSION_SECRET = os.getenv("ADMIN_SESSION_SECRET", "").strip()
if not _SESSION_SECRET:
    _SESSION_SECRET = secrets.token_hex(32)
    print(
        "WARNING: ADMIN_SESSION_SECRET is not set. Using a random per-process "
        "secret; staff sessions will not survive restarts or multiple workers."
    )

_COOKIE_SECURE_OVERRIDE = os.getenv("ADMIN_COOKIE_SECURE", "").strip().lower()
_password_hash_cache: str | None = None
_login_attempts: dict[str, list[float]] = {}
_login_lock = threading.Lock()


class AdminNotAuthenticated(Exception):
    """Raised when a staff-only route is accessed without a valid session."""


@dataclass(frozen=True)
class AdminSession:
    username: str
    csrf: str
    expires_at: int


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def hash_password(password: str) -> str:
    """Create a scrypt password hash suitable for ADMIN_PASSWORD_HASH."""
    if not password:
        raise ValueError("Password must not be empty")
    salt = secrets.token_bytes(16)
    n, r, p = 2**14, 8, 1
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=n,
        r=r,
        p=p,
        dklen=32,
        maxmem=64 * 1024 * 1024,
    )
    return f"scrypt${n}${r}${p}${_b64encode(salt)}${_b64encode(digest)}"


def _verify_password_hash(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, salt, digest = encoded.split("$", 5)
        if algorithm != "scrypt":
            return False
        expected = _b64decode(digest)
        actual = hashlib.scrypt(
            password.encode("utf-8"),
            salt=_b64decode(salt),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(expected),
            maxmem=64 * 1024 * 1024,
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def _effective_password_hash() -> str | None:
    global _password_hash_cache
    if ADMIN_PASSWORD_HASH:
        return ADMIN_PASSWORD_HASH
    if ADMIN_PASSWORD:
        if _password_hash_cache is None:
            _password_hash_cache = hash_password(ADMIN_PASSWORD)
        return _password_hash_cache
    return None


def is_admin_configured() -> bool:
    return bool(_effective_password_hash())


def verify_admin_credentials(username: str, password: str) -> bool:
    encoded = _effective_password_hash()
    if not encoded:
        return False
    username_ok = hmac.compare_digest(username, ADMIN_USERNAME)
    password_ok = _verify_password_hash(password[:1024], encoded)
    return username_ok and password_ok


def _sign(value: str) -> str:
    signature = hmac.new(
        _SESSION_SECRET.encode("utf-8"),
        value.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return _b64encode(signature)


def create_session(username: str) -> str:
    now = int(time.time())
    payload = {
        "sub": username,
        "csrf": new_csrf_token(),
        "iat": now,
        "exp": now + SESSION_TTL_SECONDS,
    }
    body = _b64encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    return f"{body}.{_sign(body)}"


def read_session(request: Request) -> AdminSession | None:
    token = request.cookies.get(SESSION_COOKIE)
    if not token or "." not in token:
        return None
    body, signature = token.rsplit(".", 1)
    if not hmac.compare_digest(_sign(body), signature):
        return None
    try:
        payload = json.loads(_b64decode(body))
        username = str(payload["sub"])
        csrf = str(payload["csrf"])
        expires_at = int(payload["exp"])
    except (KeyError, TypeError, ValueError):
        return None
    if expires_at < int(time.time()):
        return None
    if not hmac.compare_digest(username, ADMIN_USERNAME):
        return None
    return AdminSession(username=username, csrf=csrf, expires_at=expires_at)


def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def tokens_match(expected: str, provided: str) -> bool:
    if not expected or not provided:
        return False
    return hmac.compare_digest(expected, provided)


def cookie_is_secure(request: Request) -> bool:
    if _COOKIE_SECURE_OVERRIDE in {"1", "true", "yes", "on"}:
        return True
    if _COOKIE_SECURE_OVERRIDE in {"0", "false", "no", "off"}:
        return False
    return request.url.scheme == "https"


def set_session_cookie(response, token: str, secure: bool) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_TTL_SECONDS,
        path="/staff",
        httponly=True,
        secure=secure,
        samesite="lax",
    )


def clear_session_cookie(response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/staff")


def set_csrf_cookie(response, token: str, secure: bool) -> None:
    response.set_cookie(
        CSRF_COOKIE,
        token,
        max_age=LOGIN_WINDOW_SECONDS,
        path="/staff",
        httponly=True,
        secure=secure,
        samesite="lax",
    )


def clear_csrf_cookie(response) -> None:
    response.delete_cookie(CSRF_COOKIE, path="/staff")


def client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def is_login_blocked(key: str) -> bool:
    now = time.time()
    with _login_lock:
        attempts = [stamp for stamp in _login_attempts.get(key, []) if now - stamp < LOGIN_WINDOW_SECONDS]
        if attempts:
            _login_attempts[key] = attempts
        else:
            _login_attempts.pop(key, None)
        return len(attempts) >= LOGIN_MAX_ATTEMPTS


def record_login_failure(key: str) -> None:
    now = time.time()
    with _login_lock:
        attempts = [stamp for stamp in _login_attempts.get(key, []) if now - stamp < LOGIN_WINDOW_SECONDS]
        attempts.append(now)
        _login_attempts[key] = attempts


def clear_login_failures(key: str) -> None:
    with _login_lock:
        _login_attempts.pop(key, None)


if __name__ == "__main__":
    password = getpass.getpass("New staff password: ")
    confirmation = getpass.getpass("Confirm password: ")
    if password != confirmation:
        raise SystemExit("Passwords do not match.")
    print(hash_password(password))
