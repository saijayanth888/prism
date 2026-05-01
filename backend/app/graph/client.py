from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

import structlog
from neo4j import AsyncGraphDatabase, AsyncDriver

log = structlog.get_logger(__name__)


class Neo4jClient:
    def __init__(
        self,
        uri: str,
        user: str,
        password: str,
        database: str = "neo4j",
        max_connection_pool_size: int = 50,
    ):
        self._uri = uri
        self._database = database
        self._driver: AsyncDriver = AsyncGraphDatabase.driver(
            uri,
            auth=(user, password),
            max_connection_pool_size=max_connection_pool_size,
        )

    async def verify(self) -> None:
        await self._driver.verify_connectivity()
        log.info("neo4j.connected", uri=self._uri)

    async def close(self) -> None:
        await self._driver.close()
        log.info("neo4j.closed")

    async def execute_read(
        self, cypher: str, params: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        async with self._driver.session(database=self._database) as session:
            result = await session.run(cypher, params or {})
            return [dict(record) async for record in result]

    async def execute_write(
        self, cypher: str, params: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        async with self._driver.session(database=self._database) as session:
            result = await session.run(cypher, params or {})
            summary = await result.consume()
            return {
                "nodes_created": summary.counters.nodes_created,
                "relationships_created": summary.counters.relationships_created,
                "properties_set": summary.counters.properties_set,
            }

    @asynccontextmanager
    async def session(self, database: str | None = None):
        async with self._driver.session(database=database or self._database) as s:
            yield s

    async def health(self) -> bool:
        try:
            await self._driver.verify_connectivity()
            return True
        except Exception:
            return False
