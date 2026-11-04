from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.idea import IdeaUpdate


class RefineResult(BaseModel):
    reasoning: str = Field(description="1-3 sentences on what changed and why, or why you're asking")
    question: Optional[str] = Field(default=None, description="a clarifying question, if the instruction was too vague to act on")
    proposal: Optional[IdeaUpdate] = Field(default=None, description="only the fields that should change, if you have enough to propose an edit")
