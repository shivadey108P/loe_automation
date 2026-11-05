"""
Turn upstream failures (OpenAI, Supabase) into clean JSON errors.

Why this exists: an unhandled exception becomes a bare 500 that is produced
OUTSIDE the CORS middleware, so it carries no CORS headers and the browser
reports a useless "Failed to fetch". Handlers registered for specific
exception types run inside the CORS layer, so the frontend can read `detail`.
"""

import logging

import openai
import requests
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

log = logging.getLogger("idea_vault")

AI_NO_CREDITS = "The AI service is out of credits. Add credits to the OpenAI account, then retry."
AI_BUSY = "The AI service is busy right now. Wait a moment and retry."
AI_DOWN = "The AI service is unavailable right now. Retry in a bit."
DB_DOWN = "The database request failed. Retry in a bit."


def _json(status: int, detail: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"detail": detail})


def _quota_exhausted(body) -> bool:
    err = body.get("error") if isinstance(body, dict) else None
    if not isinstance(err, dict):
        return False
    text = f"{err.get('code', '')} {err.get('message', '')}".lower()
    return "insufficient_quota" in text or "no credits" in text or "billing" in text


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(openai.RateLimitError)
    async def _rate_limit(_: Request, exc: openai.RateLimitError):
        log.error("OpenAI rate limit / quota: %s", exc)
        return _json(503, AI_NO_CREDITS) if _quota_exhausted(exc.body) else _json(429, AI_BUSY)

    @app.exception_handler(openai.APIError)
    async def _openai_error(_: Request, exc: openai.APIError):
        log.error("OpenAI error: %s", exc)
        return _json(503, AI_DOWN)

    @app.exception_handler(requests.RequestException)
    async def _requests_error(_: Request, exc: requests.RequestException):
        # supabase_tool and the Whisper call both use `requests`; tell them apart by host.
        url = getattr(getattr(exc, "response", None), "url", "") or ""
        status = getattr(getattr(exc, "response", None), "status_code", None)
        log.error("Upstream request failed (%s %s): %s", status, url, exc)
        if "openai.com" in url:
            return _json(503, AI_NO_CREDITS) if status == 429 else _json(503, AI_DOWN)
        return _json(502, DB_DOWN)
