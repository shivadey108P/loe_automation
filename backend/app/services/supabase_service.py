"""
Pure request-building for Supabase (PostgREST) calls - no HTTP here, so this
is trivially unit-testable. `app/db.py` is what actually sends these.
"""

from urllib.parse import quote


def headers(service_key, extra=None):
    h = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    if extra:
        h.update(extra)
    return h


def save_idea_request(base_url, raw_text, structured: dict):
    return f"{base_url}/rest/v1/ideas", [{"raw_text": raw_text, **structured, "status": "captured"}]


def list_ideas_url(base_url, q=None, limit=20):
    url = f"{base_url}/rest/v1/ideas?select=*&order=created_at.desc&limit={limit}"
    if q:
        url += f"&or=(title.ilike.*{quote(q)}*,structured_text.ilike.*{quote(q)}*,raw_text.ilike.*{quote(q)}*)"
    return url


def get_idea_url(base_url, idea_id):
    return f"{base_url}/rest/v1/ideas?id=eq.{idea_id}&select=*"


def get_messages_url(base_url, idea_id):
    return f"{base_url}/rest/v1/idea_messages?idea_id=eq.{idea_id}&select=*&order=created_at.asc"


def insert_message_request(base_url, idea_id, role, content, proposal):
    return f"{base_url}/rest/v1/idea_messages", [
        {"idea_id": idea_id, "role": role, "content": content, "proposal": proposal}
    ]


def update_idea_request(base_url, idea_id, fields):
    return f"{base_url}/rest/v1/ideas?id=eq.{idea_id}", fields


def apply_proposal_fields(proposal: dict):
    return {**{k: v for k, v in proposal.items() if v is not None}, "status": "refined"}


def latest_proposal(messages):
    return next(
        (m["proposal"] for m in reversed(messages) if m["role"] == "assistant" and m.get("proposal")), None
    )
