from __future__ import annotations

from fastapi import APIRouter, Request

router = APIRouter()

MOCK_DASHBOARD = {
    "total_entities": 247,
    "total_edges": 312,
    "avg_health_score": 81.4,
    "critical_entities": 3,
    "platform_count": 13,
    "vulnerability_count": 7,
    "compliance_score": 74.2,
    "synced_platforms": 11,
}

MOCK_APPLICATIONS = [
    {"id": "payments-svc", "name": "payments-svc", "health_score": 92, "compliance_score": 78, "environment": "prod"},
    {"id": "orders-svc", "name": "orders-svc", "health_score": 75, "compliance_score": 68, "environment": "prod"},
    {"id": "inventory-svc", "name": "inventory-svc", "health_score": 45, "compliance_score": 55, "environment": "prod"},
    {"id": "user-svc", "name": "user-svc", "health_score": 94, "compliance_score": 88, "environment": "prod"},
    {"id": "notification-svc", "name": "notification-svc", "health_score": 68, "compliance_score": 60, "environment": "prod"},
]


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


@router.get("/health")
async def health(request: Request):
    app_state = request.app.state
    neo4j_status = "connected" if getattr(app_state, "neo4j_connected", False) else "disconnected"
    redis_status = "connected" if getattr(app_state, "redis_connected", False) else "disconnected"
    return {
        "status": "ok",
        "version": "0.1.0",
        "neo4j": neo4j_status,
        "redis": redis_status,
    }


@router.get("/health/dashboard")
async def health_dashboard(request: Request):
    client = _get_neo4j_client(request)
    if client is None:
        return MOCK_DASHBOARD

    try:
        tenant_id = getattr(request.state, "tenant_id", "demo")
        rows = await client.execute_read(
            """
            MATCH (e:Entity {tenant_id: $tenant_id})
            RETURN
                count(e) AS total_entities,
                avg(e.health_score) AS avg_health_score,
                count(CASE WHEN e.health_score < 50 THEN 1 END) AS critical_entities,
                count(CASE WHEN e.entity_type = 'Vulnerability' THEN 1 END) AS vulnerability_count
            """,
            {"tenant_id": tenant_id},
        )
        edge_rows = await client.execute_read(
            """
            MATCH (a:Entity {tenant_id: $tenant_id})-[r]->(b:Entity {tenant_id: $tenant_id})
            RETURN count(r) AS total_edges
            """,
            {"tenant_id": tenant_id},
        )
        platform_rows = await client.execute_read(
            """
            MATCH (e:Entity {tenant_id: $tenant_id})
            UNWIND e.platforms AS p
            RETURN count(DISTINCT p) AS platform_count
            """,
            {"tenant_id": tenant_id},
        )
        data = rows[0] if rows else {}
        if not data.get("total_entities"):
            return MOCK_DASHBOARD
        return {
            "total_entities": data.get("total_entities", 0),
            "total_edges": edge_rows[0].get("total_edges", 0) if edge_rows else 0,
            "avg_health_score": round(data.get("avg_health_score") or 0, 1),
            "critical_entities": data.get("critical_entities", 0),
            "platform_count": platform_rows[0].get("platform_count", 0) if platform_rows else 0,
            "vulnerability_count": data.get("vulnerability_count", 0),
            "compliance_score": MOCK_DASHBOARD["compliance_score"],
            "synced_platforms": MOCK_DASHBOARD["synced_platforms"],
        }
    except Exception:
        return MOCK_DASHBOARD


@router.get("/health/applications")
async def health_applications(request: Request):
    client = _get_neo4j_client(request)
    if client is None:
        return {"applications": MOCK_APPLICATIONS}

    try:
        tenant_id = getattr(request.state, "tenant_id", "demo")
        rows = await client.execute_read(
            """
            MATCH (e:Entity {tenant_id: $tenant_id})
            WHERE e.entity_type IN ['Service', 'Application', 'API']
            RETURN e.converged_id AS id, e.name AS name,
                   e.health_score AS health_score,
                   e.compliance_score AS compliance_score,
                   e.environment AS environment
            ORDER BY e.health_score ASC
            LIMIT 20
            """,
            {"tenant_id": tenant_id},
        )
        if not rows:
            return {"applications": MOCK_APPLICATIONS}
        return {"applications": rows}
    except Exception:
        return {"applications": MOCK_APPLICATIONS}
