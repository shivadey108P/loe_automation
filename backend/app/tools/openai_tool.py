"""Actual network calls to OpenAI that aren't via LangChain (Whisper has no
LangGraph node - it's a plain one-shot HTTP call)."""

import requests

from app.config import OPENAI_API_KEY, OPENAI_TRANSCRIPTIONS_URL, WHISPER_MODEL


def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    res = requests.post(
        OPENAI_TRANSCRIPTIONS_URL,
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
        files={"file": (filename, audio_bytes)},
        data={"model": WHISPER_MODEL},
        timeout=60,
    )
    res.raise_for_status()
    return res.json()["text"]
