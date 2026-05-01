"""Redis-backed conversation memory for Iris."""
from __future__ import annotations

import json
from typing import Any

import structlog

log = structlog.get_logger(__name__)

MAX_HISTORY = 20
TTL_SECONDS = 3600  # 1 hour session TTL


class ConversationMemory:
    def __init__(self, redis_client):
        self._redis = redis_client

    def _key(self, session_id: str) -> str:
        return f"iris:memory:{session_id}"

    async def store_message(
        self, session_id: str, role: str, content: str, **metadata
    ) -> None:
        key = self._key(session_id)
        message = json.dumps({"role": role, "content": content, **metadata})
        await self._redis.rpush(key, message)
        await self._redis.ltrim(key, -MAX_HISTORY, -1)
        await self._redis.expire(key, TTL_SECONDS)

    async def get_history(
        self, session_id: str, limit: int = MAX_HISTORY
    ) -> list[dict[str, Any]]:
        key = self._key(session_id)
        raw = await self._redis.lrange(key, -limit, -1)
        messages = []
        for item in raw:
            try:
                messages.append(json.loads(item))
            except (json.JSONDecodeError, TypeError):
                pass
        return messages

    async def clear_session(self, session_id: str) -> None:
        await self._redis.delete(self._key(session_id))
        log.info("iris.memory.cleared", session_id=session_id)


class InMemoryConversationMemory:
    """Fallback when Redis is unavailable."""

    def __init__(self):
        self._store: dict[str, list[dict]] = {}

    async def store_message(
        self, session_id: str, role: str, content: str, **metadata
    ) -> None:
        history = self._store.setdefault(session_id, [])
        history.append({"role": role, "content": content, **metadata})
        self._store[session_id] = history[-MAX_HISTORY:]

    async def get_history(
        self, session_id: str, limit: int = MAX_HISTORY
    ) -> list[dict[str, Any]]:
        return self._store.get(session_id, [])[-limit:]

    async def clear_session(self, session_id: str) -> None:
        self._store.pop(session_id, None)
