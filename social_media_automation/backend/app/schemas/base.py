"""Shared field definitions - other schemas inherit from these instead of
repeating the same fields, so title/category/tags/etc. are defined once."""

from typing import Literal

from pydantic import BaseModel, Field

Category = Literal["loe-content", "techaegis", "pwc-work", "philosophy", "personal", "other"]


class IdeaFields(BaseModel):
    title: str = Field(description="short punchy title, max 8 words")
    category: Category
    tags: list[str] = Field(description="3-6 short lowercase tags")
    structured_text: str = Field(description="the idea rewritten clearly, 2-5 sentences, first person")
    summary: str = Field(description="one sentence summary")
