from __future__ import annotations

import structlog

from app.graph.client import Neo4jClient

log = structlog.get_logger(__name__)

CONSTRAINTS = [
    "CREATE CONSTRAINT entity_unique IF NOT EXISTS FOR (e:Entity) REQUIRE (e.converged_id) IS UNIQUE",
]

INDEXES = [
    "CREATE INDEX idx_entity_name IF NOT EXISTS FOR (e:Entity) ON (e.name)",
    "CREATE INDEX idx_entity_type IF NOT EXISTS FOR (e:Entity) ON (e.entity_type)",
    "CREATE INDEX idx_entity_tenant IF NOT EXISTS FOR (e:Entity) ON (e.tenant_id)",
    "CREATE INDEX idx_entity_platform IF NOT EXISTS FOR (e:Entity) ON (e.platforms)",
]

VECTOR_INDEX = """
CREATE VECTOR INDEX entity_embeddings IF NOT EXISTS
FOR (e:Entity) ON (e.embedding)
OPTIONS {indexConfig: {`vector.dimensions`: 384, `vector.similarity_function`: 'cosine'}}
"""


async def apply_schema(client: Neo4jClient) -> None:
    """Apply all constraints and indexes. All operations are idempotent."""
    for stmt in CONSTRAINTS:
        try:
            await client.execute_write(stmt)
            log.debug("schema.constraint_applied", stmt=stmt[:60])
        except Exception as exc:
            log.warning("schema.constraint_failed", stmt=stmt[:60], error=str(exc))

    for stmt in INDEXES:
        try:
            await client.execute_write(stmt)
            log.debug("schema.index_applied", stmt=stmt[:60])
        except Exception as exc:
            log.warning("schema.index_failed", stmt=stmt[:60], error=str(exc))

    try:
        await client.execute_write(VECTOR_INDEX)
        log.debug("schema.vector_index_applied")
    except Exception as exc:
        log.warning("schema.vector_index_failed", error=str(exc))

    log.info("schema.applied")
