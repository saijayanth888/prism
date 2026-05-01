from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query, Request

from app.graph.queries import get_dependencies, get_entity, search_entities

router = APIRouter()

MOCK_ENTITY = {
    "id": "payments-svc",
    "name": "payments-svc",
    "entityType": "Service",
    "platforms": ["kubernetes", "argocd", "datadog", "sonarqube"],
    "namespace": "payments",
    "environment": "prod",
    "healthScore": 92,
    "complianceScore": 78,
    "team": "payments-team",
    "upstream": [
        {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "healthScore": 75},
        {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "healthScore": 99},
    ],
    "downstream": [
        {"id": "payments-db", "name": "payments-db", "entityType": "Database", "healthScore": 99},
        {"id": "kafka-payments", "name": "payments.events", "entityType": "Topic", "healthScore": 95},
        {"id": "vault-secret", "name": "payments/db-credentials", "entityType": "Secret", "healthScore": 99},
    ],
    "vulnerabilities": [],
    "properties": {
        "replica_count": 3,
        "cpu_limit": "500m",
        "memory_limit": "512Mi",
        "image": "acme/payments-svc:v2.1.3",
    },
}

MOCK_BLAST_RADIUS = {
    "entity_id": "payments-svc",
    "affected_count": 8,
    "affected": [
        {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "depth": 1, "impact": "high"},
        {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "depth": 1, "impact": "critical"},
        {"id": "notification-svc", "name": "notification-svc", "entityType": "Service", "depth": 2, "impact": "medium"},
        {"id": "analytics-svc", "name": "analytics-svc", "entityType": "Service", "depth": 2, "impact": "low"},
        {"id": "reporting-svc", "name": "reporting-svc", "entityType": "Service", "depth": 3, "impact": "low"},
        {"id": "orders-api", "name": "orders-api", "entityType": "API", "depth": 2, "impact": "high"},
        {"id": "kafka-payments", "name": "payments.events", "entityType": "Topic", "depth": 1, "impact": "high"},
        {"id": "kafka-orders", "name": "orders.events", "entityType": "Topic", "depth": 2, "impact": "medium"},
    ],
    "risk_score": 87.3,
}


def _get_neo4j_client(request: Request):
    from app.config import get_settings
    from app.graph.client import Neo4jClient

    settings = get_settings()
    neo4j_driver = getattr(request.app.state, "neo4j_driver", None)
    if neo4j_driver is None:
        return None
    client = Neo4jClient(settings.neo4j_uri, settings.neo4j_user, settings.neo4j_password)
    client._driver = neo4j_driver
    return client


@router.get("")
async def list_entities(
    request: Request,
    q: str | None = Query(None),
    entity_type: str | None = Query(None),
    platform: str | None = Query(None),
    limit: int = Query(50, le=500),
) -> dict[str, Any]:
    client = _get_neo4j_client(request)
    if client is None:
        from app.api.v1.topology import MOCK_TOPOLOGY
        nodes = MOCK_TOPOLOGY["nodes"]
        if q:
            nodes = [n for n in nodes if q.lower() in n["label"].lower()]
        if entity_type:
            nodes = [n for n in nodes if n["entityType"] == entity_type]
        return {"entities": nodes[:limit], "total": len(nodes)}

    try:
        tenant_id = getattr(request.state, "tenant_id", "demo")
        results = await search_entities(client, q or "", entity_type, platform, tenant_id, limit)
        return {"entities": [r.get("e", r) for r in results], "total": len(results)}
    except Exception:
        from app.api.v1.topology import MOCK_TOPOLOGY
        return {"entities": MOCK_TOPOLOGY["nodes"][:limit], "total": len(MOCK_TOPOLOGY["nodes"])}


@router.get("/{entity_id}")
async def get_entity_detail(entity_id: str, request: Request) -> dict[str, Any]:
    client = _get_neo4j_client(request)
    if client is None:
        mock = dict(MOCK_ENTITY)
        mock["id"] = entity_id
        mock["name"] = entity_id
        return mock

    try:
        tenant_id = getattr(request.state, "tenant_id", "demo")
        result = await get_entity(client, entity_id, tenant_id)
        if not result:
            mock = dict(MOCK_ENTITY)
            mock["id"] = entity_id
            mock["name"] = entity_id
            return mock

        entity = result.get("e", {})
        upstream = await get_dependencies(client, entity_id, "upstream", 1, tenant_id)
        downstream = await get_dependencies(client, entity_id, "downstream", 1, tenant_id)
        return {
            "id": entity_id,
            "name": entity.get("name", entity_id),
            "entityType": entity.get("entity_type", "Service"),
            "platforms": entity.get("platforms", []),
            "namespace": entity.get("namespace"),
            "environment": entity.get("environment"),
            "healthScore": entity.get("health_score"),
            "complianceScore": entity.get("compliance_score"),
            "upstream": upstream,
            "downstream": downstream,
            "properties": entity.get("properties", {}),
            "vulnerabilities": [],
        }
    except Exception:
        mock = dict(MOCK_ENTITY)
        mock["id"] = entity_id
        mock["name"] = entity_id
        return mock


@router.get("/{entity_id}/dependencies")
async def entity_dependencies(
    entity_id: str,
    request: Request,
    direction: str = Query("downstream"),
    depth: int = Query(2, le=5),
) -> dict[str, Any]:
    client = _get_neo4j_client(request)
    if client is None:
        entity = MOCK_ENTITY
        deps = entity.get(direction, [])
        return {"entity_id": entity_id, "direction": direction, "dependencies": deps}

    try:
        tenant_id = getattr(request.state, "tenant_id", "demo")
        deps = await get_dependencies(client, entity_id, direction, depth, tenant_id)
        return {"entity_id": entity_id, "direction": direction, "dependencies": deps}
    except Exception:
        return {"entity_id": entity_id, "direction": direction, "dependencies": []}


@router.get("/{entity_id}/blast-radius")
async def entity_blast_radius(entity_id: str, request: Request) -> dict[str, Any]:
    client = _get_neo4j_client(request)
    if client is None:
        result = dict(MOCK_BLAST_RADIUS)
        result["entity_id"] = entity_id
        return result

    try:
        from app.graph.algorithms import blast_radius

        tenant_id = getattr(request.state, "tenant_id", "demo")
        result = await blast_radius(client, entity_id, tenant_id=tenant_id)
        return result
    except Exception:
        result = dict(MOCK_BLAST_RADIUS)
        result["entity_id"] = entity_id
        return result


@router.get("/{entity_id}/compliance")
async def entity_compliance(entity_id: str, request: Request) -> dict[str, Any]:
    return {
        "entity_id": entity_id,
        "overall_score": 78,
        "policies": [
            {"name": "PCI-DSS-3.2", "status": "partial", "gaps": 2},
            {"name": "SOC2-CC6", "status": "pass", "gaps": 0},
            {"name": "HIPAA-164.312", "status": "fail", "gaps": 3},
        ],
    }
