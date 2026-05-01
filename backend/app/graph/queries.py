"""
Parameterized Cypher query library. Never use string interpolation in queries.
"""
from __future__ import annotations

from typing import Any

from app.cpt.models import ConvergedEntity
from app.graph.client import Neo4jClient


async def upsert_converged_entity(
    client: Neo4jClient,
    entity: ConvergedEntity,
    tenant_id: str,
) -> None:
    await client.execute_write(
        """
        MERGE (e:Entity {converged_id: $converged_id})
        SET e.name = $name,
            e.entity_type = $entity_type,
            e.confidence = $confidence,
            e.tenant_id = $tenant_id,
            e.platforms = $platforms,
            e.health_score = $health_score,
            e.compliance_score = $compliance_score,
            e.namespace = $namespace,
            e.environment = $environment,
            e.properties = $properties
        """,
        {
            "converged_id": entity.converged_id,
            "name": entity.canonical_name,
            "entity_type": entity.entity_type.value,
            "confidence": entity.confidence,
            "tenant_id": tenant_id,
            "platforms": list(entity.perspectives.keys()),
            "health_score": entity.properties.get("health_score"),
            "compliance_score": entity.properties.get("compliance_score"),
            "namespace": next(
                (e.namespace for e in entity.perspectives.values() if e.namespace),
                None,
            ),
            "environment": next(
                (e.environment for e in entity.perspectives.values() if e.environment),
                None,
            ),
            "properties": str(entity.properties)[:2000],
        },
    )


async def upsert_relationship(
    client: Neo4jClient,
    source_id: str,
    target_id: str,
    rel_type: str,
    platform: str,
    tenant_id: str,
    properties: dict[str, Any] | None = None,
) -> None:
    # rel_type is validated against known types before calling — never user input
    cypher = f"""
        MATCH (a:Entity {{converged_id: $source_id, tenant_id: $tenant_id}})
        MATCH (b:Entity {{converged_id: $target_id, tenant_id: $tenant_id}})
        MERGE (a)-[r:{rel_type}]->(b)
        SET r.platform = $platform,
            r.tenant_id = $tenant_id
    """
    await client.execute_write(
        cypher,
        {
            "source_id": source_id,
            "target_id": target_id,
            "platform": platform,
            "tenant_id": tenant_id,
        },
    )


async def search_entities(
    client: Neo4jClient,
    query: str,
    entity_type: str | None = None,
    platform: str | None = None,
    tenant_id: str = "demo",
    limit: int = 20,
) -> list[dict[str, Any]]:
    where_clauses = ["e.tenant_id = $tenant_id", "toLower(e.name) CONTAINS toLower($query)"]
    params: dict[str, Any] = {"query": query, "tenant_id": tenant_id, "limit": limit}

    if entity_type:
        where_clauses.append("e.entity_type = $entity_type")
        params["entity_type"] = entity_type

    where = " AND ".join(where_clauses)
    return await client.execute_read(
        f"MATCH (e:Entity) WHERE {where} RETURN e LIMIT $limit",
        params,
    )


async def get_entity(
    client: Neo4jClient,
    converged_id: str,
    tenant_id: str = "demo",
) -> dict[str, Any] | None:
    rows = await client.execute_read(
        """
        MATCH (e:Entity {converged_id: $id, tenant_id: $tenant_id})
        OPTIONAL MATCH (e)-[r]-(n:Entity)
        RETURN e, collect({rel: type(r), node: n}) AS connections
        """,
        {"id": converged_id, "tenant_id": tenant_id},
    )
    return rows[0] if rows else None


async def get_topology(
    client: Neo4jClient,
    tenant_id: str = "demo",
    limit: int = 80,
) -> dict[str, list]:
    nodes = await client.execute_read(
        """
        MATCH (e:Entity {tenant_id: $tenant_id})
        RETURN e.converged_id AS id, e.name AS label,
               e.entity_type AS entityType, e.platforms AS platforms,
               e.health_score AS healthScore, e.compliance_score AS complianceScore,
               e.namespace AS namespace, e.environment AS environment
        LIMIT $limit
        """,
        {"tenant_id": tenant_id, "limit": limit},
    )
    edges = await client.execute_read(
        """
        MATCH (a:Entity {tenant_id: $tenant_id})-[r]->(b:Entity {tenant_id: $tenant_id})
        RETURN a.converged_id AS source, b.converged_id AS target,
               type(r) AS relationshipType, r.platform AS platform
        LIMIT $limit
        """,
        {"tenant_id": tenant_id, "limit": limit * 3},
    )
    return {"nodes": nodes, "edges": edges}


async def get_dependencies(
    client: Neo4jClient,
    entity_id: str,
    direction: str = "downstream",
    depth: int = 2,
    tenant_id: str = "demo",
) -> list[dict[str, Any]]:
    if direction == "downstream":
        pattern = "(start)-[r:DEPENDS_ON|CONSUMES|GATEWAY_FOR*1..$depth]->(dep)"
    else:
        pattern = "(dep)-[r:DEPENDS_ON|CONSUMES|GATEWAY_FOR*1..$depth]->(start)"

    return await client.execute_read(
        f"""
        MATCH (start:Entity {{converged_id: $id, tenant_id: $tenant_id}})
        MATCH {pattern}
        WHERE dep.tenant_id = $tenant_id
        RETURN DISTINCT dep.converged_id AS id, dep.name AS name,
               dep.entity_type AS entityType, dep.platforms AS platforms,
               dep.health_score AS healthScore
        """,
        {"id": entity_id, "tenant_id": tenant_id, "depth": depth},
    )


async def get_application_view(
    client: Neo4jClient,
    app_name: str,
    tenant_id: str = "demo",
) -> dict[str, Any]:
    entities = await client.execute_read(
        """
        MATCH (e:Entity {tenant_id: $tenant_id})
        WHERE toLower(e.name) CONTAINS toLower($app_name)
           OR toLower(e.namespace) CONTAINS toLower($app_name)
        RETURN e
        LIMIT 50
        """,
        {"app_name": app_name, "tenant_id": tenant_id},
    )
    return {"entities": entities, "app_name": app_name}


async def delete_stale(
    client: Neo4jClient,
    platform: str,
    current_ids: list[str],
    tenant_id: str = "demo",
) -> int:
    """Remove entities from a platform that are no longer present in the latest sync."""
    result = await client.execute_write(
        """
        MATCH (e:Entity {tenant_id: $tenant_id})
        WHERE $platform IN e.platforms AND NOT e.converged_id IN $current_ids
        DETACH DELETE e
        """,
        {"platform": platform, "current_ids": current_ids, "tenant_id": tenant_id},
    )
    return result.get("nodes_created", 0)
