from app.schemas.base import Category, IdeaFields


class IdeaStructured(IdeaFields):
    """Output of the capture graph - always fills every field."""


class IdeaUpdate(IdeaFields):
    """A proposed edit - every field is optional so the LLM only states
    what's actually changing instead of restating the whole idea."""

    title: str | None = None
    category: Category | None = None
    tags: list[str] | None = None
    structured_text: str | None = None
    summary: str | None = None
