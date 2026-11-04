"""
The only place in backend/ that actually makes an HTTP call (via `requests` -
a real Python host, so none of the Cloudflare/Pyodide transport gymnastics
from the old worker/ version are needed here).
"""

import requests

from app.config import SUPABASE_SERVICE_KEY, SUPABASE_URL
from app.services import supabase_service


def _request(method, url, headers=None, json_body=None):
    res = requests.request(method, url, headers=headers, json=json_body, timeout=30)
    res.raise_for_status()
    return res.json() if res.content else None


def save_idea(raw_text: str, structured: dict) -> dict:
    url, body = supabase_service.save_idea_request(SUPABASE_URL, raw_text, structured)
    headers = supabase_service.headers(SUPABASE_SERVICE_KEY, {"Prefer": "return=representation"})
    return _request("POST", url, headers, body)[0]


def list_ideas(q: str | None, limit: int) -> list[dict]:
    url = supabase_service.list_ideas_url(SUPABASE_URL, q, limit)
    return _request("GET", url, supabase_service.headers(SUPABASE_SERVICE_KEY))


def get_idea(idea_id: str) -> dict | None:
    url = supabase_service.get_idea_url(SUPABASE_URL, idea_id)
    rows = _request("GET", url, supabase_service.headers(SUPABASE_SERVICE_KEY))
    return rows[0] if rows else None


def get_messages(idea_id: str) -> list[dict]:
    url = supabase_service.get_messages_url(SUPABASE_URL, idea_id)
    return _request("GET", url, supabase_service.headers(SUPABASE_SERVICE_KEY))


def insert_message(idea_id: str, role: str, content: str | None, proposal: dict | None) -> dict:
    url, body = supabase_service.insert_message_request(SUPABASE_URL, idea_id, role, content, proposal)
    headers = supabase_service.headers(SUPABASE_SERVICE_KEY, {"Prefer": "return=representation"})
    return _request("POST", url, headers, body)[0]


def update_idea(idea_id: str, fields: dict) -> dict:
    url, body = supabase_service.update_idea_request(SUPABASE_URL, idea_id, fields)
    headers = supabase_service.headers(SUPABASE_SERVICE_KEY, {"Prefer": "return=representation"})
    return _request("PATCH", url, headers, body)[0]
