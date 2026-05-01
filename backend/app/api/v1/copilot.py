from __future__ import annotations

from typing import Any

import structlog
from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

log = structlog.get_logger(__name__)

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    persona: str = "developer"
    session_id: str = "default"


class ChatResponse(BaseModel):
    answer: str
    citations: list[str] = []
    tools_used: list[str] = []
    confidence: float = 0.0
    session_id: str = "default"


def _get_iris_agent(request: Request):
    from app.config import get_settings
    from app.graph.client import Neo4jClient
    from app.intelligence.copilot.agent import IrisAgent
    from app.intelligence.copilot.memory import ConversationMemory, InMemoryConversationMemory
    from app.intelligence.llm_router import LLMRouter

    settings = get_settings()
    tenant_id = getattr(request.state, "tenant_id", settings.default_tenant)

    neo4j_driver = getattr(request.app.state, "neo4j_driver", None)
    redis = getattr(request.app.state, "redis", None)

    if neo4j_driver is None:
        return None, tenant_id

    graph_client = Neo4jClient(
        settings.neo4j_uri,
        settings.neo4j_user,
        settings.neo4j_password,
    )
    graph_client._driver = neo4j_driver

    llm = LLMRouter(
        provider=settings.llm_provider,
        api_key=settings.llm_api_key,
        model=settings.llm_model,
    )
    memory = ConversationMemory(redis) if redis else InMemoryConversationMemory()

    return IrisAgent(
        graph_client=graph_client,
        llm_router=llm,
        memory=memory,
        tenant_id=tenant_id,
    ), tenant_id


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, request: Request) -> ChatResponse:
    agent, _ = _get_iris_agent(request)
    if agent is None:
        return ChatResponse(
            answer="Graph database is not connected. Run `make dev` to start all services.",
            session_id=body.session_id,
        )
    result = await agent.chat(
        message=body.message,
        session_id=body.session_id,
        persona=body.persona,
    )
    return ChatResponse(**result)


@router.websocket("/stream")
async def stream_chat(websocket: WebSocket) -> None:
    await websocket.accept()
    from app.config import get_settings
    from app.intelligence.llm_router import LLMRouter

    settings = get_settings()
    llm = LLMRouter(
        provider=settings.llm_provider,
        api_key=settings.llm_api_key,
        model=settings.llm_model,
    )

    try:
        while True:
            data = await websocket.receive_json()
            message = data.get("message", "")
            persona = data.get("persona", "developer")

            answer_parts: list[str] = []
            async for chunk in llm.stream(
                messages=[{"role": "user", "content": message}],
                system=f"You are Iris, the Prism AI assistant. Persona: {persona}. "
                       "Always call graph tools before answering infrastructure questions.",
            ):
                answer_parts.append(chunk)
                await websocket.send_json({"type": "token", "content": chunk})

            await websocket.send_json({"type": "done", "content": "".join(answer_parts)})

    except WebSocketDisconnect:
        log.info("iris.websocket.disconnected")


@router.get("/suggestions")
async def get_suggestions() -> dict[str, Any]:
    return {
        "suggestions": [
            "Which services have critical vulnerabilities?",
            "What would break if payments-api went down?",
            "Show me all PCI-DSS compliance gaps",
            "Which teams own the most services?",
            "What are the top 5 most connected services?",
        ]
    }
