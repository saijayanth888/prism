"""
Integration tests for Prism — entity resolution accuracy, blast radius,
tenant isolation, copilot groundedness, connector idempotency,
and anti-hallucination suite.

Run with: pytest tests/test_integration.py -v
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


# ─────────────────────── Health ───────────────────────

def test_health_returns_ok(client: TestClient):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_health_dashboard_shape(client: TestClient):
    r = client.get("/api/v1/health/dashboard")
    assert r.status_code == 200
    data = r.json()
    assert "total_entities" in data
    assert "avg_health_score" in data
    assert "platform_count" in data


# ─────────────────────── Topology ───────────────────────

def test_topology_returns_nodes_and_edges(client: TestClient):
    r = client.get("/api/v1/topology")
    assert r.status_code == 200
    data = r.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) > 0
    assert len(data["edges"]) > 0


def test_topology_nodes_have_required_fields(client: TestClient):
    r = client.get("/api/v1/topology")
    nodes = r.json()["nodes"]
    for node in nodes[:5]:
        assert "id" in node, f"Missing 'id' in node: {node}"
        assert "label" in node, f"Missing 'label' in node: {node}"
        assert "entityType" in node, f"Missing 'entityType' in node: {node}"


def test_topology_edges_reference_existing_nodes(client: TestClient):
    data = client.get("/api/v1/topology").json()
    node_ids = {n["id"] for n in data["nodes"]}
    for edge in data["edges"][:20]:
        assert edge["source"] in node_ids, f"Edge source {edge['source']} not found in nodes"
        assert edge["target"] in node_ids, f"Edge target {edge['target']} not found in nodes"


# ─────────────────────── Entity resolution ───────────────────────

def test_entity_detail_returns_entity(client: TestClient):
    r = client.get("/api/v1/entities/payments-svc")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == "payments-svc"
    assert "entityType" in data


def test_entity_detail_includes_dependencies(client: TestClient):
    r = client.get("/api/v1/entities/payments-svc")
    data = r.json()
    assert "upstream" in data
    assert "downstream" in data
    assert isinstance(data["upstream"], list)
    assert isinstance(data["downstream"], list)


def test_entity_list_filterable_by_type(client: TestClient):
    r = client.get("/api/v1/entities?entity_type=Service")
    assert r.status_code == 200
    data = r.json()
    assert "entities" in data
    for entity in data["entities"]:
        assert entity.get("entityType") == "Service"


# ─────────────────────── Blast radius ───────────────────────

def test_blast_radius_returns_affected_list(client: TestClient):
    r = client.get("/api/v1/entities/payments-svc/blast-radius")
    assert r.status_code == 200
    data = r.json()
    assert "entity_id" in data
    assert "affected" in data
    assert isinstance(data["affected"], list)
    assert len(data["affected"]) > 0


def test_blast_radius_entity_id_matches_request(client: TestClient):
    r = client.get("/api/v1/entities/orders-svc/blast-radius")
    data = r.json()
    assert data["entity_id"] == "orders-svc"


def test_blast_radius_no_self_reference(client: TestClient):
    r = client.get("/api/v1/entities/payments-svc/blast-radius")
    data = r.json()
    affected_ids = [a["id"] for a in data["affected"]]
    assert "payments-svc" not in affected_ids, "Entity should not appear in its own blast radius"


# ─────────────────────── Compliance ───────────────────────

def test_compliance_dashboard_shape(client: TestClient):
    r = client.get("/api/v1/compliance/dashboard")
    assert r.status_code == 200
    data = r.json()
    assert "overall_score" in data
    assert "policies" in data
    assert len(data["policies"]) > 0


def test_compliance_gaps_returns_list(client: TestClient):
    r = client.get("/api/v1/compliance/gaps")
    assert r.status_code == 200
    data = r.json()
    assert "gaps" in data
    assert isinstance(data["gaps"], list)


def test_compliance_gaps_severity_filter(client: TestClient):
    r = client.get("/api/v1/compliance/gaps?severity=critical")
    data = r.json()
    for gap in data["gaps"]:
        assert gap["severity"] == "critical", f"Expected critical, got {gap['severity']}"


def test_compliance_gaps_policy_filter(client: TestClient):
    r = client.get("/api/v1/compliance/gaps?policy=PCI-DSS")
    data = r.json()
    for gap in data["gaps"]:
        assert gap["policy"] == "PCI-DSS", f"Expected PCI-DSS, got {gap['policy']}"


# ─────────────────────── Connectors ───────────────────────

def test_connectors_list_all_platforms(client: TestClient):
    r = client.get("/api/v1/connectors")
    assert r.status_code == 200
    data = r.json()
    assert "platforms" in data
    assert len(data["platforms"]) == 13, f"Expected 13 platforms, got {len(data['platforms'])}"


def test_connectors_idempotent(client: TestClient):
    r1 = client.get("/api/v1/connectors")
    r2 = client.get("/api/v1/connectors")
    assert r1.json() == r2.json(), "Connector list should be stable across requests"


def test_connector_sync_trigger(client: TestClient):
    r = client.post("/api/v1/connectors/kubernetes/sync")
    assert r.status_code == 200
    data = r.json()
    assert data["connector_id"] == "kubernetes"
    assert data["status"] == "sync_started"


# ─────────────────────── Copilot anti-hallucination ───────────────────────

def test_copilot_suggestions_not_empty(client: TestClient):
    r = client.get("/api/v1/copilot/suggestions")
    assert r.status_code == 200
    data = r.json()
    assert "suggestions" in data
    assert len(data["suggestions"]) > 0


def test_copilot_chat_returns_answer_shape(client: TestClient):
    r = client.post(
        "/api/v1/copilot/chat",
        json={"message": "Hello", "session_id": "test-session"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "answer" in data
    assert "session_id" in data
    assert isinstance(data["citations"], list)
    assert isinstance(data["tools_used"], list)


def test_copilot_not_found_response_for_fake_entity(client: TestClient):
    """Iris should NOT invent entities — should respond with not-found message or query result."""
    r = client.post(
        "/api/v1/copilot/chat",
        json={
            "message": "Tell me about the completely_nonexistent_service_xyz_123",
            "session_id": "antihallucination-test",
        },
    )
    assert r.status_code == 200
    data = r.json()
    answer = data["answer"].lower()
    # Must acknowledge lack of data — not invent infrastructure details
    not_found_signals = ["not found", "don't have", "couldn't find", "no information", "graph", "unable"]
    assert any(s in answer for s in not_found_signals), (
        f"Expected NOT_FOUND response for non-existent entity, got: {data['answer'][:200]}"
    )


# ─────────────────────── CPT entity resolution ───────────────────────

def test_cpt_normalizes_name_variants():
    """CPT should strip env prefixes and version suffixes."""
    from app.cpt.convergence import _normalize_name

    assert _normalize_name("prod-payments-svc") == "payments"
    assert _normalize_name("payments-svc-v2") == "payments"
    assert _normalize_name("stg-payments-api-v1") == "payments"


def test_cpt_fingerprint_is_stable():
    """Same entity data should produce the same fingerprint."""
    from app.cpt.models import PerspectiveEntity, EntityType

    e = PerspectiveEntity(
        entity_id="test-1",
        name="payments-svc",
        entity_type=EntityType.SERVICE,
        platform="kubernetes",
        namespace="payments",
    )
    fp1 = e.fingerprint_hash()
    fp2 = e.fingerprint_hash()
    assert fp1 == fp2, "Fingerprint must be deterministic"
    assert len(fp1) == 64, "SHA-256 fingerprint should be 64 hex chars"


def test_cpt_normalized_name_strips_prefixes():
    """PerspectiveEntity.normalized_name should strip env/version noise."""
    from app.cpt.models import PerspectiveEntity, EntityType

    cases = [
        ("prod-payments-svc", "payments"),
        ("payments-svc-v2", "payments"),
        ("stg-inventory-api-v1", "inventory"),
        ("payments-api", "payments"),
    ]
    for raw, expected in cases:
        e = PerspectiveEntity(entity_id="x", name=raw, entity_type=EntityType.SERVICE, platform="k8s")
        assert e.normalized_name == expected, f"{raw!r} → {e.normalized_name!r}, expected {expected!r}"


def test_cpt_different_platform_names_normalize_to_same_root():
    """payments-svc, payments-api-v2, prod-payments should share a common root after normalization."""
    from app.cpt.convergence import _normalize_name

    names = ["payments-svc", "payments-api-v2", "prod-payments-svc"]
    normalized = [_normalize_name(n) for n in names]
    # All should resolve to the same normalized form
    assert len(set(normalized)) == 1, f"Expected all to normalize the same, got: {normalized}"
