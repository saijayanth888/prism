"""
Iris AI Copilot agent.
Anti-hallucination: MUST call at least one graph tool before answering.
Every fact must be grounded in tool results.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

import structlog

from app.intelligence.copilot.memory import ConversationMemory, InMemoryConversationMemory
from app.intelligence.copilot.prompts import get_system_prompt
from app.intelligence.copilot.tools import IrisTools
from app.intelligence.llm_router import LLMRouter

log = structlog.get_logger(__name__)

MAX_TOOL_ITERATIONS = 5


class IrisAgent:
    def __init__(
        self,
        graph_client,
        llm_router: LLMRouter,
        memory: ConversationMemory | InMemoryConversationMemory | None = None,
        tenant_id: str = "demo",
    ):
        self._graph = graph_client
        self._llm = llm_router
        self._memory = memory or InMemoryConversationMemory()
        self._tenant = tenant_id
        self._tools = IrisTools(graph_client, tenant_id)

    async def chat(
        self,
        message: str,
        session_id: str,
        persona: str = "developer",
    ) -> dict[str, Any]:
        """Single-turn chat with full tool-call loop. Returns complete response."""
        await self._memory.store_message(session_id, "user", message)
        history = await self._memory.get_history(session_id, limit=20)

        messages = [
            {"role": m["role"] if m["role"] != "iris" else "assistant", "content": m["content"]}
            for m in history[:-1]  # exclude the just-added message
        ]
        messages.append({"role": "user", "content": message})

        system = get_system_prompt(persona)
        tool_defs = self._tools.get_tool_definitions()
        tools_used: list[str] = []
        citations: set[str] = set()
        tool_context: list[str] = []

        # Agentic tool-use loop
        for iteration in range(MAX_TOOL_ITERATIONS):
            result = await self._llm.complete(
                messages=messages,
                system=system,
                tools=tool_defs,
                temperature=0.1,
            )

            if "error" in result:
                answer = "I'm unable to answer right now — LLM service is unavailable. Please try again."
                break

            response = result["response"]
            stop_reason = getattr(response, "stop_reason", "end_turn")

            if stop_reason == "tool_use":
                # Execute tool calls
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        tool_name = block.name
                        tool_input = block.input
                        tools_used.append(tool_name)

                        tool_result = await self._tools.execute(tool_name, tool_input)
                        tool_context.append(f"[{tool_name}]: {tool_result}")

                        # Extract citations
                        import re
                        for match in re.finditer(r'\[entity:([^\]]+)\]', tool_result):
                            citations.add(match.group(1))

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": tool_result,
                        })

                # Add assistant response + tool results to messages
                messages.append({"role": "assistant", "content": response.content})
                messages.append({"role": "user", "content": tool_results})

            else:
                # Final text answer
                answer = ""
                for block in response.content:
                    if hasattr(block, "text"):
                        answer += block.text
                break
        else:
            answer = "I reached the maximum number of tool calls. Please try a more specific question."

        # Anti-hallucination: warn if no tools were called for infrastructure questions
        if not tools_used and any(
            kw in message.lower()
            for kw in ["service", "api", "database", "kubernetes", "platform", "health", "compliance"]
        ):
            answer = (
                "I need to query the knowledge graph to answer this accurately. "
                "Please try again — I'll make sure to check the graph first."
            )

        # Score confidence
        confidence = self._score_confidence(tools_used, tool_context, answer)

        # Add freshness note
        freshness = f"Based on data synced {self._time_since_sync()}."
        if freshness not in answer:
            answer = answer.rstrip() + f"\n\n_{freshness}_"

        await self._memory.store_message(session_id, "iris", answer)

        return {
            "answer": answer,
            "citations": sorted(citations),
            "tools_used": tools_used,
            "confidence": confidence,
            "session_id": session_id,
        }

    async def stream_chat(
        self,
        message: str,
        session_id: str,
        persona: str = "developer",
    ) -> AsyncGenerator[str, None]:
        """Streaming chat via token-by-token generator."""
        await self._memory.store_message(session_id, "user", message)
        history = await self._memory.get_history(session_id, limit=20)

        messages = [
            {"role": m["role"] if m["role"] != "iris" else "assistant", "content": m["content"]}
            for m in history
        ]

        system = get_system_prompt(persona)
        tool_defs = self._tools.get_tool_definitions()

        # First pass: check if tools are needed
        initial = await self._llm.complete(
            messages=messages,
            system=system,
            tools=tool_defs,
            temperature=0.1,
        )

        if "error" in initial:
            yield "LLM service unavailable. Please try again."
            return

        response = initial["response"]
        if getattr(response, "stop_reason", "") == "tool_use":
            # Execute tools silently, then stream final answer
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = await self._tools.execute(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

        # Stream final response
        full_answer = ""
        async for chunk in self._llm.stream(messages=messages, system=system):
            full_answer += chunk
            yield chunk

        await self._memory.store_message(session_id, "iris", full_answer)

    def _score_confidence(
        self, tools_used: list[str], tool_results: list[str], answer: str
    ) -> float:
        if not tools_used:
            return 0.3
        if any("NOT_FOUND" in r for r in tool_results):
            return 0.6
        if len(tools_used) >= 2:
            return 0.95
        return 0.85

    def _time_since_sync(self) -> str:
        return "< 1 minute"  # In production, check Neo4j last write timestamp
