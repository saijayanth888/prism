from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query, Request

router = APIRouter()

# ---------------------------------------------------------------------------
# Mock blast-radius data for 5 key entities
# ---------------------------------------------------------------------------

MOCK_BLAST_RADIUS_DB: dict[str, dict[str, Any]] = {
    "payments-svc": {
        "entity_id": "payments-svc",
        "entity_name": "payments-svc",
        "entity_type": "Service",
        "platform": "kubernetes",
        "risk_score": 87.3,
        "affected_count": 12,
        "max_depth": 3,
        "affected": [
            {"id": "payments-api", "name": "payments-api", "entityType": "API", "depth": 1, "impact": "critical", "healthScore": 88, "platform": "apiconnect"},
            {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "depth": 1, "impact": "critical", "healthScore": 99, "platform": "apiconnect"},
            {"id": "kafka-payments", "name": "payments.events", "entityType": "Topic", "depth": 1, "impact": "high", "healthScore": 95, "platform": "confluent"},
            {"id": "payments-db", "name": "payments-db", "entityType": "Database", "depth": 1, "impact": "high", "healthScore": 99, "platform": "aws"},
            {"id": "vault-secret", "name": "payments/db-credentials", "entityType": "Secret", "depth": 1, "impact": "medium", "healthScore": 99, "platform": "vault"},
            {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "depth": 1, "impact": "high", "healthScore": 75, "platform": "kubernetes"},
            {"id": "notification-svc", "name": "notification-svc", "entityType": "Service", "depth": 2, "impact": "medium", "healthScore": 68, "platform": "kubernetes"},
            {"id": "analytics-svc", "name": "analytics-svc", "entityType": "Service", "depth": 2, "impact": "medium", "healthScore": 82, "platform": "kubernetes"},
            {"id": "orders-api", "name": "orders-api", "entityType": "API", "depth": 2, "impact": "high", "healthScore": 80, "platform": "apiconnect"},
            {"id": "kafka-orders", "name": "orders.events", "entityType": "Topic", "depth": 2, "impact": "medium", "healthScore": 93, "platform": "confluent"},
            {"id": "reporting-svc", "name": "reporting-svc", "entityType": "Service", "depth": 3, "impact": "low", "healthScore": 77, "platform": "kubernetes"},
            {"id": "inventory-svc", "name": "inventory-svc", "entityType": "Service", "depth": 3, "impact": "low", "healthScore": 45, "platform": "kubernetes"},
        ],
        "rings": [
            {"depth": 0, "entities": [
                {"id": "payments-svc", "name": "payments-svc", "entityType": "Service", "healthScore": 92, "platform": "kubernetes"},
            ]},
            {"depth": 1, "entities": [
                {"id": "payments-api", "name": "payments-api", "entityType": "API", "impact": "critical", "healthScore": 88, "platform": "apiconnect"},
                {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "impact": "critical", "healthScore": 99, "platform": "apiconnect"},
                {"id": "kafka-payments", "name": "payments.events", "entityType": "Topic", "impact": "high", "healthScore": 95, "platform": "confluent"},
                {"id": "payments-db", "name": "payments-db", "entityType": "Database", "impact": "high", "healthScore": 99, "platform": "aws"},
                {"id": "vault-secret", "name": "payments/db-credentials", "entityType": "Secret", "impact": "medium", "healthScore": 99, "platform": "vault"},
                {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "impact": "high", "healthScore": 75, "platform": "kubernetes"},
            ]},
            {"depth": 2, "entities": [
                {"id": "notification-svc", "name": "notification-svc", "entityType": "Service", "impact": "medium", "healthScore": 68, "platform": "kubernetes"},
                {"id": "analytics-svc", "name": "analytics-svc", "entityType": "Service", "impact": "medium", "healthScore": 82, "platform": "kubernetes"},
                {"id": "orders-api", "name": "orders-api", "entityType": "API", "impact": "high", "healthScore": 80, "platform": "apiconnect"},
                {"id": "kafka-orders", "name": "orders.events", "entityType": "Topic", "impact": "medium", "healthScore": 93, "platform": "confluent"},
            ]},
            {"depth": 3, "entities": [
                {"id": "reporting-svc", "name": "reporting-svc", "entityType": "Service", "impact": "low", "healthScore": 77, "platform": "kubernetes"},
                {"id": "inventory-svc", "name": "inventory-svc", "entityType": "Service", "impact": "low", "healthScore": 45, "platform": "kubernetes"},
            ]},
        ],
    },
    "orders-svc": {
        "entity_id": "orders-svc",
        "entity_name": "orders-svc",
        "entity_type": "Service",
        "platform": "kubernetes",
        "risk_score": 72.1,
        "affected_count": 9,
        "max_depth": 3,
        "affected": [
            {"id": "orders-api", "name": "orders-api", "entityType": "API", "depth": 1, "impact": "critical", "healthScore": 80, "platform": "apiconnect"},
            {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "depth": 1, "impact": "critical", "healthScore": 99, "platform": "apiconnect"},
            {"id": "kafka-orders", "name": "orders.events", "entityType": "Topic", "depth": 1, "impact": "high", "healthScore": 93, "platform": "confluent"},
            {"id": "payments-svc", "name": "payments-svc", "entityType": "Service", "depth": 1, "impact": "high", "healthScore": 92, "platform": "kubernetes"},
            {"id": "inventory-svc", "name": "inventory-svc", "entityType": "Service", "depth": 1, "impact": "high", "healthScore": 45, "platform": "kubernetes"},
            {"id": "catalog-svc", "name": "catalog-svc", "entityType": "Service", "depth": 1, "impact": "medium", "healthScore": 91, "platform": "kubernetes"},
            {"id": "notification-svc", "name": "notification-svc", "entityType": "Service", "depth": 2, "impact": "medium", "healthScore": 68, "platform": "kubernetes"},
            {"id": "analytics-svc", "name": "analytics-svc", "entityType": "Service", "depth": 2, "impact": "low", "healthScore": 82, "platform": "kubernetes"},
            {"id": "reporting-svc", "name": "reporting-svc", "entityType": "Service", "depth": 3, "impact": "low", "healthScore": 77, "platform": "kubernetes"},
        ],
        "rings": [
            {"depth": 0, "entities": [
                {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "healthScore": 75, "platform": "kubernetes"},
            ]},
            {"depth": 1, "entities": [
                {"id": "orders-api", "name": "orders-api", "entityType": "API", "impact": "critical", "healthScore": 80, "platform": "apiconnect"},
                {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "impact": "critical", "healthScore": 99, "platform": "apiconnect"},
                {"id": "kafka-orders", "name": "orders.events", "entityType": "Topic", "impact": "high", "healthScore": 93, "platform": "confluent"},
                {"id": "payments-svc", "name": "payments-svc", "entityType": "Service", "impact": "high", "healthScore": 92, "platform": "kubernetes"},
                {"id": "inventory-svc", "name": "inventory-svc", "entityType": "Service", "impact": "high", "healthScore": 45, "platform": "kubernetes"},
                {"id": "catalog-svc", "name": "catalog-svc", "entityType": "Service", "impact": "medium", "healthScore": 91, "platform": "kubernetes"},
            ]},
            {"depth": 2, "entities": [
                {"id": "notification-svc", "name": "notification-svc", "entityType": "Service", "impact": "medium", "healthScore": 68, "platform": "kubernetes"},
                {"id": "analytics-svc", "name": "analytics-svc", "entityType": "Service", "impact": "low", "healthScore": 82, "platform": "kubernetes"},
            ]},
            {"depth": 3, "entities": [
                {"id": "reporting-svc", "name": "reporting-svc", "entityType": "Service", "impact": "low", "healthScore": 77, "platform": "kubernetes"},
            ]},
        ],
    },
    "inventory-svc": {
        "entity_id": "inventory-svc",
        "entity_name": "inventory-svc",
        "entity_type": "Service",
        "platform": "kubernetes",
        "risk_score": 54.6,
        "affected_count": 5,
        "max_depth": 3,
        "affected": [
            {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "depth": 1, "impact": "high", "healthScore": 75, "platform": "kubernetes"},
            {"id": "catalog-svc", "name": "catalog-svc", "entityType": "Service", "depth": 1, "impact": "medium", "healthScore": 91, "platform": "kubernetes"},
            {"id": "orders-api", "name": "orders-api", "entityType": "API", "depth": 2, "impact": "medium", "healthScore": 80, "platform": "apiconnect"},
            {"id": "search-svc", "name": "search-svc", "entityType": "Service", "depth": 2, "impact": "low", "healthScore": 89, "platform": "kubernetes"},
            {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "depth": 3, "impact": "low", "healthScore": 99, "platform": "apiconnect"},
        ],
        "rings": [
            {"depth": 0, "entities": [
                {"id": "inventory-svc", "name": "inventory-svc", "entityType": "Service", "healthScore": 45, "platform": "kubernetes"},
            ]},
            {"depth": 1, "entities": [
                {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "impact": "high", "healthScore": 75, "platform": "kubernetes"},
                {"id": "catalog-svc", "name": "catalog-svc", "entityType": "Service", "impact": "medium", "healthScore": 91, "platform": "kubernetes"},
            ]},
            {"depth": 2, "entities": [
                {"id": "orders-api", "name": "orders-api", "entityType": "API", "impact": "medium", "healthScore": 80, "platform": "apiconnect"},
                {"id": "search-svc", "name": "search-svc", "entityType": "Service", "impact": "low", "healthScore": 89, "platform": "kubernetes"},
            ]},
            {"depth": 3, "entities": [
                {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "impact": "low", "healthScore": 99, "platform": "apiconnect"},
            ]},
        ],
    },
    "user-svc": {
        "entity_id": "user-svc",
        "entity_name": "user-svc",
        "entity_type": "Service",
        "platform": "kubernetes",
        "risk_score": 91.5,
        "affected_count": 10,
        "max_depth": 3,
        "affected": [
            {"id": "auth-api", "name": "auth-api", "entityType": "API", "depth": 1, "impact": "critical", "healthScore": 97, "platform": "apiconnect"},
            {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "depth": 1, "impact": "critical", "healthScore": 99, "platform": "apiconnect"},
            {"id": "payments-svc", "name": "payments-svc", "entityType": "Service", "depth": 2, "impact": "high", "healthScore": 92, "platform": "kubernetes"},
            {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "depth": 2, "impact": "high", "healthScore": 75, "platform": "kubernetes"},
            {"id": "notification-svc", "name": "notification-svc", "entityType": "Service", "depth": 2, "impact": "medium", "healthScore": 68, "platform": "kubernetes"},
            {"id": "inventory-svc", "name": "inventory-svc", "entityType": "Service", "depth": 2, "impact": "medium", "healthScore": 45, "platform": "kubernetes"},
            {"id": "analytics-svc", "name": "analytics-svc", "entityType": "Service", "depth": 3, "impact": "low", "healthScore": 82, "platform": "kubernetes"},
            {"id": "catalog-svc", "name": "catalog-svc", "entityType": "Service", "depth": 3, "impact": "low", "healthScore": 91, "platform": "kubernetes"},
            {"id": "kafka-payments", "name": "payments.events", "entityType": "Topic", "depth": 3, "impact": "low", "healthScore": 95, "platform": "confluent"},
            {"id": "kafka-orders", "name": "orders.events", "entityType": "Topic", "depth": 3, "impact": "low", "healthScore": 93, "platform": "confluent"},
        ],
        "rings": [
            {"depth": 0, "entities": [
                {"id": "user-svc", "name": "user-svc", "entityType": "Service", "healthScore": 94, "platform": "kubernetes"},
            ]},
            {"depth": 1, "entities": [
                {"id": "auth-api", "name": "auth-api", "entityType": "API", "impact": "critical", "healthScore": 97, "platform": "apiconnect"},
                {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "impact": "critical", "healthScore": 99, "platform": "apiconnect"},
            ]},
            {"depth": 2, "entities": [
                {"id": "payments-svc", "name": "payments-svc", "entityType": "Service", "impact": "high", "healthScore": 92, "platform": "kubernetes"},
                {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "impact": "high", "healthScore": 75, "platform": "kubernetes"},
                {"id": "notification-svc", "name": "notification-svc", "entityType": "Service", "impact": "medium", "healthScore": 68, "platform": "kubernetes"},
                {"id": "inventory-svc", "name": "inventory-svc", "entityType": "Service", "impact": "medium", "healthScore": 45, "platform": "kubernetes"},
            ]},
            {"depth": 3, "entities": [
                {"id": "analytics-svc", "name": "analytics-svc", "entityType": "Service", "impact": "low", "healthScore": 82, "platform": "kubernetes"},
                {"id": "catalog-svc", "name": "catalog-svc", "entityType": "Service", "impact": "low", "healthScore": 91, "platform": "kubernetes"},
                {"id": "kafka-payments", "name": "payments.events", "entityType": "Topic", "impact": "low", "healthScore": 95, "platform": "confluent"},
                {"id": "kafka-orders", "name": "orders.events", "entityType": "Topic", "impact": "low", "healthScore": 93, "platform": "confluent"},
            ]},
        ],
    },
    "gateway-prod": {
        "entity_id": "gateway-prod",
        "entity_name": "api-gateway-prod",
        "entity_type": "API",
        "platform": "apiconnect",
        "risk_score": 95.8,
        "affected_count": 14,
        "max_depth": 3,
        "affected": [
            {"id": "payments-api", "name": "payments-api", "entityType": "API", "depth": 1, "impact": "critical", "healthScore": 88, "platform": "apiconnect"},
            {"id": "orders-api", "name": "orders-api", "entityType": "API", "depth": 1, "impact": "critical", "healthScore": 80, "platform": "apiconnect"},
            {"id": "auth-api", "name": "auth-api", "entityType": "API", "depth": 1, "impact": "critical", "healthScore": 97, "platform": "apiconnect"},
            {"id": "payments-svc", "name": "payments-svc", "entityType": "Service", "depth": 2, "impact": "high", "healthScore": 92, "platform": "kubernetes"},
            {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "depth": 2, "impact": "high", "healthScore": 75, "platform": "kubernetes"},
            {"id": "user-svc", "name": "user-svc", "entityType": "Service", "depth": 2, "impact": "high", "healthScore": 94, "platform": "kubernetes"},
            {"id": "payments-db", "name": "payments-db", "entityType": "Database", "depth": 3, "impact": "medium", "healthScore": 99, "platform": "aws"},
            {"id": "kafka-payments", "name": "payments.events", "entityType": "Topic", "depth": 3, "impact": "medium", "healthScore": 95, "platform": "confluent"},
            {"id": "kafka-orders", "name": "orders.events", "entityType": "Topic", "depth": 3, "impact": "medium", "healthScore": 93, "platform": "confluent"},
            {"id": "inventory-svc", "name": "inventory-svc", "entityType": "Service", "depth": 3, "impact": "medium", "healthScore": 45, "platform": "kubernetes"},
            {"id": "catalog-svc", "name": "catalog-svc", "entityType": "Service", "depth": 3, "impact": "low", "healthScore": 91, "platform": "kubernetes"},
            {"id": "vault-secret", "name": "payments/db-credentials", "entityType": "Secret", "depth": 3, "impact": "low", "healthScore": 99, "platform": "vault"},
            {"id": "notification-svc", "name": "notification-svc", "entityType": "Service", "depth": 3, "impact": "low", "healthScore": 68, "platform": "kubernetes"},
            {"id": "analytics-svc", "name": "analytics-svc", "entityType": "Service", "depth": 3, "impact": "low", "healthScore": 82, "platform": "kubernetes"},
        ],
        "rings": [
            {"depth": 0, "entities": [
                {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "healthScore": 99, "platform": "apiconnect"},
            ]},
            {"depth": 1, "entities": [
                {"id": "payments-api", "name": "payments-api", "entityType": "API", "impact": "critical", "healthScore": 88, "platform": "apiconnect"},
                {"id": "orders-api", "name": "orders-api", "entityType": "API", "impact": "critical", "healthScore": 80, "platform": "apiconnect"},
                {"id": "auth-api", "name": "auth-api", "entityType": "API", "impact": "critical", "healthScore": 97, "platform": "apiconnect"},
            ]},
            {"depth": 2, "entities": [
                {"id": "payments-svc", "name": "payments-svc", "entityType": "Service", "impact": "high", "healthScore": 92, "platform": "kubernetes"},
                {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "impact": "high", "healthScore": 75, "platform": "kubernetes"},
                {"id": "user-svc", "name": "user-svc", "entityType": "Service", "impact": "high", "healthScore": 94, "platform": "kubernetes"},
            ]},
            {"depth": 3, "entities": [
                {"id": "payments-db", "name": "payments-db", "entityType": "Database", "impact": "medium", "healthScore": 99, "platform": "aws"},
                {"id": "kafka-payments", "name": "payments.events", "entityType": "Topic", "impact": "medium", "healthScore": 95, "platform": "confluent"},
                {"id": "kafka-orders", "name": "orders.events", "entityType": "Topic", "impact": "medium", "healthScore": 93, "platform": "confluent"},
                {"id": "inventory-svc", "name": "inventory-svc", "entityType": "Service", "impact": "medium", "healthScore": 45, "platform": "kubernetes"},
                {"id": "catalog-svc", "name": "catalog-svc", "entityType": "Service", "impact": "low", "healthScore": 91, "platform": "kubernetes"},
                {"id": "vault-secret", "name": "payments/db-credentials", "entityType": "Secret", "impact": "low", "healthScore": 99, "platform": "vault"},
                {"id": "notification-svc", "name": "notification-svc", "entityType": "Service", "impact": "low", "healthScore": 68, "platform": "kubernetes"},
                {"id": "analytics-svc", "name": "analytics-svc", "entityType": "Service", "impact": "low", "healthScore": 82, "platform": "kubernetes"},
            ]},
        ],
    },
}

# Pre-computed mock shortest paths between key entities
MOCK_PATHS: dict[str, dict[str, list[dict[str, Any]]]] = {
    "payments-svc": {
        "reporting-svc": [
            {"id": "payments-svc", "name": "payments-svc", "entityType": "Service", "platform": "kubernetes"},
            {"id": "kafka-payments", "name": "payments.events", "entityType": "Topic", "platform": "confluent"},
            {"id": "analytics-svc", "name": "analytics-svc", "entityType": "Service", "platform": "kubernetes"},
            {"id": "reporting-svc", "name": "reporting-svc", "entityType": "Service", "platform": "kubernetes"},
        ],
        "gateway-prod": [
            {"id": "payments-svc", "name": "payments-svc", "entityType": "Service", "platform": "kubernetes"},
            {"id": "payments-api", "name": "payments-api", "entityType": "API", "platform": "apiconnect"},
            {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "platform": "apiconnect"},
        ],
        "inventory-svc": [
            {"id": "payments-svc", "name": "payments-svc", "entityType": "Service", "platform": "kubernetes"},
            {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "platform": "kubernetes"},
            {"id": "inventory-svc", "name": "inventory-svc", "entityType": "Service", "platform": "kubernetes"},
        ],
    },
    "gateway-prod": {
        "payments-db": [
            {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "platform": "apiconnect"},
            {"id": "payments-api", "name": "payments-api", "entityType": "API", "platform": "apiconnect"},
            {"id": "payments-svc", "name": "payments-svc", "entityType": "Service", "platform": "kubernetes"},
            {"id": "payments-db", "name": "payments-db", "entityType": "Database", "platform": "aws"},
        ],
        "inventory-svc": [
            {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "platform": "apiconnect"},
            {"id": "orders-api", "name": "orders-api", "entityType": "API", "platform": "apiconnect"},
            {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "platform": "kubernetes"},
            {"id": "inventory-svc", "name": "inventory-svc", "entityType": "Service", "platform": "kubernetes"},
        ],
    },
    "user-svc": {
        "payments-svc": [
            {"id": "user-svc", "name": "user-svc", "entityType": "Service", "platform": "kubernetes"},
            {"id": "auth-api", "name": "auth-api", "entityType": "API", "platform": "apiconnect"},
            {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "platform": "apiconnect"},
            {"id": "payments-api", "name": "payments-api", "entityType": "API", "platform": "apiconnect"},
            {"id": "payments-svc", "name": "payments-svc", "entityType": "Service", "platform": "kubernetes"},
        ],
    },
    "orders-svc": {
        "analytics-svc": [
            {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "platform": "kubernetes"},
            {"id": "kafka-orders", "name": "orders.events", "entityType": "Topic", "platform": "confluent"},
            {"id": "analytics-svc", "name": "analytics-svc", "entityType": "Service", "platform": "kubernetes"},
        ],
    },
}

# Pre-computed critical entities (sorted by risk_score descending)
MOCK_CRITICAL: list[dict[str, Any]] = [
    {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "platform": "apiconnect", "risk_score": 95.8, "affected_count": 14, "healthScore": 99},
    {"id": "user-svc", "name": "user-svc", "entityType": "Service", "platform": "kubernetes", "risk_score": 91.5, "affected_count": 10, "healthScore": 94},
    {"id": "payments-svc", "name": "payments-svc", "entityType": "Service", "platform": "kubernetes", "risk_score": 87.3, "affected_count": 12, "healthScore": 92},
    {"id": "orders-svc", "name": "orders-svc", "entityType": "Service", "platform": "kubernetes", "risk_score": 72.1, "affected_count": 9, "healthScore": 75},
    {"id": "catalog-svc", "name": "catalog-svc", "entityType": "Service", "platform": "kubernetes", "risk_score": 61.2, "affected_count": 4, "healthScore": 91},
    {"id": "inventory-svc", "name": "inventory-svc", "entityType": "Service", "platform": "kubernetes", "risk_score": 54.6, "affected_count": 5, "healthScore": 45},
    {"id": "auth-api", "name": "auth-api", "entityType": "API", "platform": "apiconnect", "risk_score": 48.9, "affected_count": 3, "healthScore": 97},
    {"id": "notification-svc", "name": "notification-svc", "entityType": "Service", "platform": "kubernetes", "risk_score": 35.4, "affected_count": 2, "healthScore": 68},
    {"id": "analytics-svc", "name": "analytics-svc", "entityType": "Service", "platform": "kubernetes", "risk_score": 28.7, "affected_count": 1, "healthScore": 82},
    {"id": "search-svc", "name": "search-svc", "entityType": "Service", "platform": "kubernetes", "risk_score": 22.3, "affected_count": 1, "healthScore": 89},
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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


def _compute_risk_score(affected: list[dict[str, Any]]) -> float:
    """Compute a risk score from affected entities list.
    Weights: critical=25, high=15, medium=8, low=3.
    Capped at 100.
    """
    weights = {"critical": 25, "high": 15, "medium": 8, "low": 3}
    score = sum(weights.get(a.get("impact", "low"), 3) for a in affected)
    return min(round(score * 100 / (len(affected) * 25) if affected else 0, 1), 100.0)


def _build_mock_fallback(entity_id: str) -> dict[str, Any]:
    """Return mock blast radius for a known entity, or a generic one."""
    if entity_id in MOCK_BLAST_RADIUS_DB:
        return MOCK_BLAST_RADIUS_DB[entity_id]

    # Generate a lightweight generic response for unknown entities
    return {
        "entity_id": entity_id,
        "entity_name": entity_id,
        "entity_type": "Service",
        "platform": "kubernetes",
        "risk_score": 32.0,
        "affected_count": 2,
        "max_depth": 2,
        "affected": [
            {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "depth": 1, "impact": "medium", "healthScore": 99, "platform": "apiconnect"},
            {"id": "notification-svc", "name": "notification-svc", "entityType": "Service", "depth": 2, "impact": "low", "healthScore": 68, "platform": "kubernetes"},
        ],
        "rings": [
            {"depth": 0, "entities": [
                {"id": entity_id, "name": entity_id, "entityType": "Service", "healthScore": 80, "platform": "kubernetes"},
            ]},
            {"depth": 1, "entities": [
                {"id": "gateway-prod", "name": "api-gateway-prod", "entityType": "API", "impact": "medium", "healthScore": 99, "platform": "apiconnect"},
            ]},
            {"depth": 2, "entities": [
                {"id": "notification-svc", "name": "notification-svc", "entityType": "Service", "impact": "low", "healthScore": 68, "platform": "kubernetes"},
            ]},
        ],
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/critical")
async def critical_blast_radius(
    request: Request,
    limit: int = Query(10, le=50),
) -> dict[str, Any]:
    """Top N entities with highest blast radius / risk score."""
    client = _get_neo4j_client(request)
    if client is None:
        return {"entities": MOCK_CRITICAL[:limit], "total": len(MOCK_CRITICAL[:limit])}

    try:
        from app.graph.algorithms import critical_nodes

        tenant_id = getattr(request.state, "tenant_id", "demo")
        nodes = await critical_nodes(client, tenant_id=tenant_id, limit=limit)
        return {"entities": nodes, "total": len(nodes)}
    except Exception:
        return {"entities": MOCK_CRITICAL[:limit], "total": len(MOCK_CRITICAL[:limit])}


@router.get("/{entity_id}")
async def get_blast_radius(
    entity_id: str,
    request: Request,
    max_depth: int = Query(3, ge=1, le=5),
) -> dict[str, Any]:
    """Full blast radius analysis for an entity with ring data for visualization."""
    client = _get_neo4j_client(request)
    if client is None:
        return _build_mock_fallback(entity_id)

    try:
        from app.graph.algorithms import blast_radius

        tenant_id = getattr(request.state, "tenant_id", "demo")
        affected = await blast_radius(client, entity_id, max_depth=max_depth, tenant_id=tenant_id)

        # Build ring structure from BFS depth info
        rings: dict[int, list[dict[str, Any]]] = {0: [{"id": entity_id, "name": entity_id, "entityType": "Service"}]}
        for ent in affected:
            depth = ent.get("depth", 1)
            rings.setdefault(depth, []).append(ent)

        ring_list = [{"depth": d, "entities": ents} for d, ents in sorted(rings.items())]

        risk = _compute_risk_score(affected)

        return {
            "entity_id": entity_id,
            "entity_name": entity_id,
            "risk_score": risk,
            "affected_count": len(affected),
            "max_depth": max_depth,
            "affected": affected,
            "rings": ring_list,
        }
    except Exception:
        return _build_mock_fallback(entity_id)


@router.get("/{entity_id}/path/{target_id}")
async def impact_path(
    entity_id: str,
    target_id: str,
    request: Request,
) -> dict[str, Any]:
    """Shortest impact path between two entities."""
    client = _get_neo4j_client(request)
    if client is None:
        # Look up pre-computed mock path
        path = (
            MOCK_PATHS.get(entity_id, {}).get(target_id)
            or MOCK_PATHS.get(target_id, {}).get(entity_id, [])
        )
        return {
            "source": entity_id,
            "target": target_id,
            "path": path,
            "hop_count": max(len(path) - 1, 0),
        }

    try:
        from app.graph.algorithms import shortest_path

        tenant_id = getattr(request.state, "tenant_id", "demo")
        path = await shortest_path(client, entity_id, target_id, tenant_id=tenant_id)
        return {
            "source": entity_id,
            "target": target_id,
            "path": path,
            "hop_count": max(len(path) - 1, 0),
        }
    except Exception:
        return {
            "source": entity_id,
            "target": target_id,
            "path": [],
            "hop_count": 0,
        }
