"""
Graph algorithms: blast radius (BFS/APOC), PageRank, Louvain, shortest path.
"""
from __future__ import annotations

from typing import Any

from app.graph.client import Neo4jClient


async def blast_radius(
    client: Neo4jClient,
    entity_id: str,
    max_depth: int = 3,
    tenant_id: str = "demo",
) -> list[dict[str, Any]]:
    """
    BFS blast radius analysis using APOC path expansion.
    Returns affected entities with their hop distance from the source.
    Falls back to pure Cypher if APOC is unavailable.
    """
    try:
        return await client.execute_read(
            """
            MATCH (start:Entity {converged_id: $id, tenant_id: $tenant_id})
            CALL apoc.path.subgraphNodes(start, {
                maxLevel: $depth,
                relationshipFilter: "DEPENDS_ON>|CONSUMES>|GATEWAY_FOR>"
            })
            YIELD node
            WHERE node.converged_id <> $id AND node.tenant_id = $tenant_id
            RETURN node.converged_id AS id,
                   node.name AS name,
                   node.entity_type AS entityType,
                   node.health_score AS healthScore,
                   node.platforms AS platforms
            """,
            {"id": entity_id, "tenant_id": tenant_id, "depth": max_depth},
        )
    except Exception:
        # Fallback: variable-length path without APOC
        return await client.execute_read(
            """
            MATCH (start:Entity {converged_id: $id, tenant_id: $tenant_id})
            MATCH (start)-[:DEPENDS_ON|CONSUMES|GATEWAY_FOR*1..$depth]->(affected:Entity)
            WHERE affected.tenant_id = $tenant_id
            RETURN DISTINCT
                   affected.converged_id AS id,
                   affected.name AS name,
                   affected.entity_type AS entityType,
                   affected.health_score AS healthScore,
                   affected.platforms AS platforms
            """,
            {"id": entity_id, "tenant_id": tenant_id, "depth": max_depth},
        )


async def critical_nodes(
    client: Neo4jClient,
    tenant_id: str = "demo",
    limit: int = 20,
) -> list[dict[str, Any]]:
    """
    Top entities by PageRank (most connected / most influential).
    Falls back to degree centrality if GDS is unavailable.
    """
    try:
        return await client.execute_read(
            """
            CALL gds.pageRank.stream({
                nodeQuery: 'MATCH (n:Entity) WHERE n.tenant_id = $tenant_id RETURN id(n) AS id',
                relationshipQuery: 'MATCH (a:Entity)-[r]->(b:Entity) WHERE a.tenant_id = $tenant_id RETURN id(a) AS source, id(b) AS target'
            })
            YIELD nodeId, score
            MATCH (e:Entity) WHERE id(e) = nodeId
            RETURN e.converged_id AS id, e.name AS name,
                   e.entity_type AS entityType, score
            ORDER BY score DESC
            LIMIT $limit
            """,
            {"tenant_id": tenant_id, "limit": limit},
        )
    except Exception:
        # Fallback: degree centrality
        return await client.execute_read(
            """
            MATCH (e:Entity {tenant_id: $tenant_id})
            OPTIONAL MATCH (e)-[r]-()
            WITH e, count(r) AS degree
            ORDER BY degree DESC
            LIMIT $limit
            RETURN e.converged_id AS id, e.name AS name,
                   e.entity_type AS entityType, toFloat(degree) AS score
            """,
            {"tenant_id": tenant_id, "limit": limit},
        )


async def domain_clusters(
    client: Neo4jClient,
    tenant_id: str = "demo",
) -> list[dict[str, Any]]:
    """
    Louvain community detection for domain clustering.
    Falls back to namespace-based grouping if GDS unavailable.
    """
    try:
        return await client.execute_read(
            """
            CALL gds.louvain.stream({
                nodeQuery: 'MATCH (n:Entity) WHERE n.tenant_id = $tenant_id RETURN id(n) AS id',
                relationshipQuery: 'MATCH (a:Entity)-[r]->(b:Entity) WHERE a.tenant_id = $tenant_id RETURN id(a) AS source, id(b) AS target'
            })
            YIELD nodeId, communityId
            MATCH (e:Entity) WHERE id(e) = nodeId
            RETURN e.converged_id AS id, e.name AS name,
                   e.namespace AS namespace, communityId AS community
            ORDER BY communityId
            """,
            {"tenant_id": tenant_id},
        )
    except Exception:
        return await client.execute_read(
            """
            MATCH (e:Entity {tenant_id: $tenant_id})
            RETURN e.converged_id AS id, e.name AS name,
                   e.namespace AS namespace, e.namespace AS community
            ORDER BY e.namespace
            """,
            {"tenant_id": tenant_id},
        )


async def shortest_path(
    client: Neo4jClient,
    from_id: str,
    to_id: str,
    tenant_id: str = "demo",
) -> list[dict[str, Any]]:
    """Find the shortest dependency path between two entities."""
    return await client.execute_read(
        """
        MATCH (a:Entity {converged_id: $from_id, tenant_id: $tenant_id}),
              (b:Entity {converged_id: $to_id, tenant_id: $tenant_id})
        MATCH path = shortestPath((a)-[*..10]->(b))
        UNWIND nodes(path) AS node
        RETURN node.converged_id AS id,
               node.name AS name,
               node.entity_type AS entityType
        """,
        {"from_id": from_id, "to_id": to_id, "tenant_id": tenant_id},
    )
