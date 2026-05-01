from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request

from app.graph.queries import get_topology

router = APIRouter()

MOCK_TOPOLOGY: dict[str, list] = {
    "nodes": [
        {"id": "payments-svc", "label": "payments-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "payments", "environment": "prod", "healthScore": 92, "complianceScore": 78},
        {"id": "payments-api", "label": "payments-api", "entityType": "API", "platform": "apiconnect", "namespace": "payments", "environment": "prod", "healthScore": 88, "complianceScore": 82},
        {"id": "payments-db", "label": "payments-db", "entityType": "Database", "platform": "aws", "namespace": "payments", "environment": "prod", "healthScore": 99, "complianceScore": 91},
        {"id": "orders-svc", "label": "orders-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "orders", "environment": "prod", "healthScore": 75, "complianceScore": 68},
        {"id": "orders-api", "label": "orders-api", "entityType": "API", "platform": "apiconnect", "namespace": "orders", "environment": "prod", "healthScore": 80, "complianceScore": 72},
        {"id": "inventory-svc", "label": "inventory-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "inventory", "environment": "prod", "healthScore": 45, "complianceScore": 55},
        {"id": "user-svc", "label": "user-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "auth", "environment": "prod", "healthScore": 94, "complianceScore": 88},
        {"id": "auth-api", "label": "auth-api", "entityType": "API", "platform": "apiconnect", "namespace": "auth", "environment": "prod", "healthScore": 97, "complianceScore": 95},
        {"id": "notification-svc", "label": "notification-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "notifications", "environment": "prod", "healthScore": 68, "complianceScore": 60},
        {"id": "kafka-payments", "label": "payments.events", "entityType": "Topic", "platform": "confluent", "namespace": "payments", "environment": "prod", "healthScore": 95},
        {"id": "kafka-orders", "label": "orders.events", "entityType": "Topic", "platform": "confluent", "namespace": "orders", "environment": "prod", "healthScore": 93},
        {"id": "payments-repo", "label": "acme/payments-svc", "entityType": "Repository", "platform": "github", "namespace": "payments", "healthScore": 88},
        {"id": "orders-repo", "label": "acme/orders-svc", "entityType": "Repository", "platform": "github", "namespace": "orders", "healthScore": 82},
        {"id": "gateway-prod", "label": "api-gateway-prod", "entityType": "API", "platform": "apiconnect", "namespace": "platform", "environment": "prod", "healthScore": 99},
        {"id": "payments-deploy", "label": "payments-svc@prod", "entityType": "Deployment", "platform": "argocd", "namespace": "payments", "environment": "prod", "healthScore": 92},
        {"id": "orders-deploy", "label": "orders-svc@prod", "entityType": "Deployment", "platform": "argocd", "namespace": "orders", "environment": "prod", "healthScore": 75},
        {"id": "payments-image", "label": "acme/payments-svc:v2.1.3", "entityType": "Image", "platform": "nexus", "namespace": "payments", "healthScore": 85},
        {"id": "cve-2024-001", "label": "CVE-2024-0001", "entityType": "Vulnerability", "platform": "sonarqube", "healthScore": 10},
        {"id": "prod-ns", "label": "prod", "entityType": "Namespace", "platform": "kubernetes", "healthScore": 88},
        {"id": "payments-team", "label": "payments-team", "entityType": "Team", "platform": "jira", "healthScore": 95},
        {"id": "orders-team", "label": "orders-team", "entityType": "Team", "platform": "jira", "healthScore": 90},
        {"id": "vault-secret", "label": "payments/db-credentials", "entityType": "Secret", "platform": "vault", "healthScore": 99},
        {"id": "pci-policy", "label": "PCI-DSS-v3.2", "entityType": "Policy", "platform": "servicenow", "healthScore": 78},
        {"id": "analytics-svc", "label": "analytics-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "analytics", "environment": "prod", "healthScore": 82},
        {"id": "reporting-svc", "label": "reporting-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "analytics", "environment": "prod", "healthScore": 77},
        {"id": "search-svc", "label": "search-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "catalog", "environment": "prod", "healthScore": 89},
        {"id": "catalog-svc", "label": "catalog-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "catalog", "environment": "prod", "healthScore": 91},
        {"id": "catalog-db", "label": "catalog-db", "entityType": "Database", "platform": "aws", "namespace": "catalog", "environment": "prod", "healthScore": 97},
        {"id": "tf-prod-infra", "label": "prod-infra", "entityType": "Environment", "platform": "terraform", "environment": "prod", "healthScore": 88},
        {"id": "pipeline-payments", "label": "payments-ci", "entityType": "Pipeline", "platform": "github", "namespace": "payments", "healthScore": 90},
    ],
    "edges": [
        {"source": "orders-svc", "target": "payments-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 1.0},
        {"source": "orders-svc", "target": "inventory-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.95},
        {"source": "payments-svc", "target": "payments-db", "relationshipType": "STORED_IN", "platform": "kubernetes", "confidence": 1.0},
        {"source": "payments-svc", "target": "vault-secret", "relationshipType": "USES_SECRET", "platform": "vault", "confidence": 0.98},
        {"source": "gateway-prod", "target": "payments-api", "relationshipType": "GATEWAY_FOR", "platform": "apiconnect", "confidence": 1.0},
        {"source": "gateway-prod", "target": "orders-api", "relationshipType": "GATEWAY_FOR", "platform": "apiconnect", "confidence": 1.0},
        {"source": "gateway-prod", "target": "auth-api", "relationshipType": "GATEWAY_FOR", "platform": "apiconnect", "confidence": 1.0},
        {"source": "payments-api", "target": "payments-svc", "relationshipType": "EXPOSES", "platform": "apiconnect", "confidence": 0.95},
        {"source": "orders-api", "target": "orders-svc", "relationshipType": "EXPOSES", "platform": "apiconnect", "confidence": 0.95},
        {"source": "auth-api", "target": "user-svc", "relationshipType": "EXPOSES", "platform": "apiconnect", "confidence": 0.95},
        {"source": "payments-svc", "target": "kafka-payments", "relationshipType": "PUBLISHES_TO", "platform": "confluent", "confidence": 0.92},
        {"source": "orders-svc", "target": "kafka-orders", "relationshipType": "PUBLISHES_TO", "platform": "confluent", "confidence": 0.92},
        {"source": "notification-svc", "target": "kafka-payments", "relationshipType": "SUBSCRIBES_TO", "platform": "confluent", "confidence": 0.88},
        {"source": "notification-svc", "target": "kafka-orders", "relationshipType": "SUBSCRIBES_TO", "platform": "confluent", "confidence": 0.88},
        {"source": "payments-deploy", "target": "payments-svc", "relationshipType": "DEPLOYED_TO", "platform": "argocd", "confidence": 1.0},
        {"source": "orders-deploy", "target": "orders-svc", "relationshipType": "DEPLOYED_TO", "platform": "argocd", "confidence": 1.0},
        {"source": "payments-image", "target": "payments-svc", "relationshipType": "RUNS_IN", "platform": "nexus", "confidence": 0.9},
        {"source": "cve-2024-001", "target": "inventory-svc", "relationshipType": "HAS_VULNERABILITY", "platform": "sonarqube", "confidence": 1.0},
        {"source": "payments-team", "target": "payments-svc", "relationshipType": "OWNS", "platform": "jira", "confidence": 1.0},
        {"source": "orders-team", "target": "orders-svc", "relationshipType": "OWNS", "platform": "jira", "confidence": 1.0},
        {"source": "pci-policy", "target": "payments-svc", "relationshipType": "ENFORCES", "platform": "servicenow", "confidence": 0.95},
        {"source": "payments-repo", "target": "payments-svc", "relationshipType": "BUILT_FROM", "platform": "github", "confidence": 0.98},
        {"source": "orders-repo", "target": "orders-svc", "relationshipType": "BUILT_FROM", "platform": "github", "confidence": 0.98},
        {"source": "analytics-svc", "target": "kafka-orders", "relationshipType": "SUBSCRIBES_TO", "platform": "confluent", "confidence": 0.85},
        {"source": "analytics-svc", "target": "kafka-payments", "relationshipType": "SUBSCRIBES_TO", "platform": "confluent", "confidence": 0.85},
        {"source": "reporting-svc", "target": "analytics-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.9},
        {"source": "search-svc", "target": "catalog-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.95},
        {"source": "catalog-svc", "target": "catalog-db", "relationshipType": "STORED_IN", "platform": "kubernetes", "confidence": 1.0},
        {"source": "orders-svc", "target": "catalog-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.88},
        {"source": "pipeline-payments", "target": "payments-repo", "relationshipType": "BUILT_FROM", "platform": "github", "confidence": 0.95},
        {"source": "payments-svc", "target": "prod-ns", "relationshipType": "BELONGS_TO", "platform": "kubernetes", "confidence": 1.0},
        {"source": "tf-prod-infra", "target": "prod-ns", "relationshipType": "ENFORCES", "platform": "terraform", "confidence": 0.9},
    ],
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
async def topology(request: Request) -> dict[str, Any]:
    client = _get_neo4j_client(request)
    if client is None:
        return MOCK_TOPOLOGY

    try:
        tenant_id = getattr(request.state, "tenant_id", "demo")
        result = await get_topology(client, tenant_id=tenant_id)
        if not result["nodes"]:
            return MOCK_TOPOLOGY
        # Normalize platform field (nodes from DB store platforms as list)
        for node in result["nodes"]:
            if isinstance(node.get("platform"), list):
                node["platform"] = node["platform"][0] if node["platform"] else "unknown"
        # Filter edges to only those with both endpoints in the nodes list
        node_ids = {n["id"] for n in result["nodes"]}
        result["edges"] = [
            e for e in result["edges"]
            if e["source"] in node_ids and e["target"] in node_ids
        ]
        return result
    except Exception:
        return MOCK_TOPOLOGY


@router.get("/subgraph/{entity_id}")
async def subgraph(entity_id: str, request: Request) -> dict[str, Any]:
    from app.graph.queries import get_dependencies

    client = _get_neo4j_client(request)
    if client is None:
        # Return subset of mock data around the given entity
        related_edges = [
            e for e in MOCK_TOPOLOGY["edges"]
            if e["source"] == entity_id or e["target"] == entity_id
        ]
        related_ids = {entity_id}
        for e in related_edges:
            related_ids.add(e["source"])
            related_ids.add(e["target"])
        related_nodes = [n for n in MOCK_TOPOLOGY["nodes"] if n["id"] in related_ids]
        return {"nodes": related_nodes, "edges": related_edges}

    try:
        tenant_id = getattr(request.state, "tenant_id", "demo")
        deps_down = await get_dependencies(client, entity_id, "downstream", 2, tenant_id)
        deps_up = await get_dependencies(client, entity_id, "upstream", 2, tenant_id)
        all_deps = {d["id"]: d for d in deps_down + deps_up}
        return {"nodes": list(all_deps.values()), "entity_id": entity_id}
    except Exception:
        return {"nodes": [], "edges": []}
