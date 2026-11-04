"""
Single-user auth: caller must send a Supabase session JWT, and the account's
email must be on the ALLOWED_EMAILS allowlist. Supabase itself validates the
token (any signing scheme, revocation-aware) via /auth/v1/user.
"""

import requests
from fastapi import Header, HTTPException

from app.config import ALLOWED_EMAILS, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL


def require_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "missing bearer token")
    token = authorization[7:].strip()
    if token.count(".") != 2 or len(token) > 4096:
        raise HTTPException(401, "invalid or expired token")

    try:
        res = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"apikey": SUPABASE_PUBLISHABLE_KEY, "Authorization": f"Bearer {token}"},
            timeout=10,
        )
    except requests.RequestException:
        raise HTTPException(503, "auth provider unreachable")
    if res.status_code != 200:
        raise HTTPException(401, "invalid or expired token")

    user = res.json()
    email = (user.get("email") or "").lower()
    if not user.get("email_confirmed_at") and not user.get("confirmed_at"):
        raise HTTPException(403, "email not confirmed")
    if email not in ALLOWED_EMAILS:
        raise HTTPException(403, "not allowed")
    return user
