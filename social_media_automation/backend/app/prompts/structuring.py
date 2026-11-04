"""Prompt used to turn a raw voice/text note into a structured idea."""

STRUCTURE_SYSTEM_PROMPT = """You turn a raw, rambling spoken idea into a clean, structured record.
Preserve the speaker's actual meaning and any concrete details - do not invent
anything they didn't say. Category must be one of: loe-content, techaegis,
pwc-work, philosophy, personal, other. Tags: 3-6 short lowercase words.
Title: short and punchy, max 8 words. structured_text: 2-5 sentences, first person."""
