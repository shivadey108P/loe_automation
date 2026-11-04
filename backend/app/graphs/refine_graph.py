"""
LangGraph graph for the refine/approve conversation on an existing idea.

One node today (propose). This is the seam meant for the "future" agentic
work you mentioned - e.g. a real `interrupt()`-based human-approval node,
or a router node that decides whether to ask a question vs. propose an edit,
without changing how main.py calls this graph.
"""

import json
from typing import TypedDict

from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph

from app.config import OPENAI_API_KEY, STRUCTURING_MODEL, STRUCTURING_TEMPERATURE
from app.schemas.refine import RefineResult
from app.prompts.refine import REFINE_SYSTEM_PROMPT


class RefineState(TypedDict):
    idea: dict
    prior_messages: list
    user_message: str
    result: RefineResult


def _propose_node(state: RefineState) -> dict:
    idea = state["idea"]
    idea_context = "Current idea:\n" + json.dumps(
        {
            "title": idea.get("title"),
            "category": idea.get("category"),
            "tags": idea.get("tags"),
            "structured_text": idea.get("structured_text"),
            "summary": idea.get("summary"),
        },
        indent=2,
    )

    history = []
    for m in state["prior_messages"]:
        role = "assistant" if m["role"] == "assistant" else "user"
        content = m.get("content") or ""
        if m["role"] == "assistant" and m.get("proposal"):
            content += f"\nProposed: {json.dumps(m['proposal'])}"
        history.append({"role": role, "content": content})

    llm = ChatOpenAI(
        model=STRUCTURING_MODEL,
        api_key=OPENAI_API_KEY,
        temperature=STRUCTURING_TEMPERATURE,
    ).with_structured_output(RefineResult)

    result = llm.invoke(
        [
            {"role": "system", "content": REFINE_SYSTEM_PROMPT},
            {"role": "user", "content": idea_context},
            *history,
            {"role": "user", "content": state["user_message"]},
        ]
    )
    return {"result": result}


def build_refine_graph():
    graph = StateGraph(RefineState)
    graph.add_node("propose", _propose_node)
    graph.add_edge(START, "propose")
    graph.add_edge("propose", END)
    return graph.compile()


refine_graph = build_refine_graph()


async def propose_refinement(idea: dict, prior_messages: list, user_message: str) -> RefineResult:
    result = await refine_graph.ainvoke(
        {"idea": idea, "prior_messages": prior_messages, "user_message": user_message}
    )
    return result["result"]
