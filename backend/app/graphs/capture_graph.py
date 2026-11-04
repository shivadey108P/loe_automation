"""
LangGraph graph for turning a raw note into a structured idea.

Just one node today (structure). Kept as a graph rather than a plain function
because this is exactly the seam we'll extend later - e.g. adding a
"check for duplicate idea" node before structuring, without touching main.py.
"""

from typing import TypedDict

from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph

from app.config import OPENAI_API_KEY, STRUCTURING_MODEL, STRUCTURING_TEMPERATURE
from app.schemas.idea import IdeaStructured
from app.prompts.structuring import STRUCTURE_SYSTEM_PROMPT


class CaptureState(TypedDict):
    raw_text: str
    result: IdeaStructured


def _structure_node(state: CaptureState) -> dict:
    llm = ChatOpenAI(
        model=STRUCTURING_MODEL,
        api_key=OPENAI_API_KEY,
        temperature=STRUCTURING_TEMPERATURE,
    ).with_structured_output(IdeaStructured)

    result = llm.invoke(
        [
            {"role": "system", "content": STRUCTURE_SYSTEM_PROMPT},
            {"role": "user", "content": state["raw_text"]},
        ]
    )
    return {"result": result}


def build_capture_graph():
    graph = StateGraph(CaptureState)
    graph.add_node("structure", _structure_node)
    graph.add_edge(START, "structure")
    graph.add_edge("structure", END)
    return graph.compile()


capture_graph = build_capture_graph()


async def structure(raw_text: str) -> IdeaStructured:
    result = await capture_graph.ainvoke({"raw_text": raw_text})
    return result["result"]
