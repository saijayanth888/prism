"""Vector similarity search using Neo4j's native vector index."""
from __future__ import annotations

from typing import Any

from app.graph.client import Neo4jClient


async def store_embedding(
    client: Neo4jClient,
    entity_id: str,
    embedding: list[float],
    tenant_id: str = "demo",
) -> None:
    await client.execute_write(
        """
        MATCH (e:Entity {converged_id: $id, tenant_id: $tenant_id})
        SET e.embedding = $embedding
        """,
        {"id": entity_id, "embedding": embedding, "tenant_id": tenant_id},
    )


async def semantic_search(
    client: Neo4jClient,
    query_embedding: list[float],
    top_k: int = 10,
    tenant_id: str = "demo",
) -> list[dict[str, Any]]:
    """Vector similarity search using Neo4j vector index."""
    return await client.execute_read(
        """
        CALL db.index.vector.queryNodes('entity_embeddings', $top_k, $embedding)
        YIELD node, score
        WHERE node.tenant_id = $tenant_id
        RETURN node.converged_id AS id,
               node.name AS name,
               node.entity_type AS entityType,
               node.platforms AS platforms,
               score
        ORDER BY score DESC
        """,
        {"top_k": top_k, "embedding": query_embedding, "tenant_id": tenant_id},
    )
