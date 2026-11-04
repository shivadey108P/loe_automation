"""
Thin runner: wires HTTP routes to graphs/tools/services. No LLM, Supabase,
or transcription logic lives here directly - test that stuff via the notebook.
"""

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.graphs.capture_graph import structure
from app.graphs.refine_graph import propose_refinement
from app.services.supabase_service import apply_proposal_fields, latest_proposal
from app.tools import openai_tool, supabase_tool

app = FastAPI(title="Idea Vault API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CaptureTextBody(BaseModel):
    raw_text: str


class RefineBody(BaseModel):
    message: str


@app.post("/capture-text")
async def capture_text(body: CaptureTextBody):
    structured = await structure(body.raw_text)
    idea = supabase_tool.save_idea(body.raw_text, structured.model_dump())
    return idea


@app.post("/capture-audio")
async def capture_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    raw_text = openai_tool.transcribe_audio(audio_bytes, file.filename)
    structured = await structure(raw_text)
    idea = supabase_tool.save_idea(raw_text, structured.model_dump())
    return idea


@app.get("/ideas")
async def list_ideas(q: str | None = None, limit: int = 20):
    return supabase_tool.list_ideas(q, limit)


@app.get("/ideas/{idea_id}")
async def get_idea(idea_id: str):
    idea = supabase_tool.get_idea(idea_id)
    if not idea:
        raise HTTPException(404, "idea not found")
    return idea


@app.get("/ideas/{idea_id}/messages")
async def get_messages(idea_id: str):
    return supabase_tool.get_messages(idea_id)


@app.post("/ideas/{idea_id}/refine")
async def refine(idea_id: str, body: RefineBody):
    idea = supabase_tool.get_idea(idea_id)
    if not idea:
        raise HTTPException(404, "idea not found")

    prior_messages = supabase_tool.get_messages(idea_id)
    supabase_tool.insert_message(idea_id, "user", body.message, None)

    result = await propose_refinement(idea, prior_messages, body.message)

    assistant_msg = supabase_tool.insert_message(
        idea_id,
        "assistant",
        result.reasoning,
        result.proposal.model_dump(exclude_none=True) if result.proposal else None,
    )
    return assistant_msg


@app.post("/ideas/{idea_id}/apply")
async def apply(idea_id: str):
    messages = supabase_tool.get_messages(idea_id)
    proposal = latest_proposal(messages)
    if not proposal:
        raise HTTPException(400, "no pending proposal to apply")

    return supabase_tool.update_idea(idea_id, apply_proposal_fields(proposal))
