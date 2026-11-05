"""
Thin runner: wires HTTP routes to graphs/tools/services. No LLM, Supabase,
or transcription logic lives here directly - test that stuff via the notebook.
"""

import uuid

from fastapi import APIRouter, Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.auth import require_user
from app.config import CORS_ORIGINS
from app.errors import register_error_handlers
from app.graphs.capture_graph import structure
from app.graphs.refine_graph import propose_refinement
from app.services.supabase_service import apply_proposal_fields, latest_proposal
from app.tools import openai_tool, supabase_tool

app = FastAPI(title="Idea Vault API")
register_error_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


MAX_AUDIO_BYTES = 25 * 1024 * 1024  # Whisper's own limit

# Every route except /health requires a valid, allow-listed Supabase session.
protected = APIRouter(dependencies=[Depends(require_user)])


@app.get("/health")
async def health():
    return {"ok": True}


class CaptureTextBody(BaseModel):
    raw_text: str = Field(max_length=20000)


class RefineBody(BaseModel):
    message: str = Field(max_length=4000)


@protected.post("/capture-text")
async def capture_text(body: CaptureTextBody):
    structured = await structure(body.raw_text)
    idea = supabase_tool.save_idea(body.raw_text, structured.model_dump())
    return idea


@protected.post("/capture-audio")
async def capture_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read(MAX_AUDIO_BYTES + 1)
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(413, "audio too large")
    raw_text = openai_tool.transcribe_audio(audio_bytes, file.filename)
    structured = await structure(raw_text)
    idea = supabase_tool.save_idea(raw_text, structured.model_dump())
    return idea


@protected.get("/ideas")
async def list_ideas(q: str | None = Query(None, max_length=200), limit: int = Query(20, ge=1, le=100)):
    return supabase_tool.list_ideas(q, limit)


@protected.get("/ideas/{idea_id}")
async def get_idea(idea_id: uuid.UUID):
    idea = supabase_tool.get_idea(str(idea_id))
    if not idea:
        raise HTTPException(404, "idea not found")
    return idea


@protected.get("/ideas/{idea_id}/messages")
async def get_messages(idea_id: uuid.UUID):
    return supabase_tool.get_messages(str(idea_id))


@protected.post("/ideas/{idea_id}/refine")
async def refine(idea_id: uuid.UUID, body: RefineBody):
    idea = supabase_tool.get_idea(str(idea_id))
    if not idea:
        raise HTTPException(404, "idea not found")

    prior_messages = supabase_tool.get_messages(str(idea_id))
    supabase_tool.insert_message(str(idea_id), "user", body.message, None)

    result = await propose_refinement(idea, prior_messages, body.message)

    assistant_msg = supabase_tool.insert_message(
        str(idea_id),
        "assistant",
        result.reasoning,
        result.proposal.model_dump(exclude_none=True) if result.proposal else None,
    )
    return assistant_msg


@protected.post("/ideas/{idea_id}/apply")
async def apply(idea_id: uuid.UUID):
    messages = supabase_tool.get_messages(str(idea_id))
    proposal = latest_proposal(messages)
    if not proposal:
        raise HTTPException(400, "no pending proposal to apply")

    return supabase_tool.update_idea(str(idea_id), apply_proposal_fields(proposal))


app.include_router(protected)
