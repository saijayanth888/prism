from datetime import datetime

import pytest

from app.cpt.models import (
    EntityType,
    Perspective,
    PerspectiveEdge,
    PerspectiveEntity,
    RelationshipType,
    TopologyFingerprint,
)


def make_entity(
    entity_id="svc-001",
    name="payments-svc",
    platform="kubernetes",
    entity_type=EntityType.SERVICE,
    **kwargs,
) -> PerspectiveEntity:
    return PerspectiveEntity(
        entity_id=entity_id,
        name=name,
        platform=platform,
        entity_type=entity_type,
        observed_at=datetime.utcnow(),
        **kwargs,
    )


def test_entity_normalized_name_strips_env_prefix():
    e = make_entity(name="prod-payments")
    assert e.normalized_name == "payments"


def test_entity_normalized_name_strips_version_suffix():
    e = make_entity(name="payments-api-v2")
    assert e.normalized_name == "payments"


def test_entity_normalized_name_strips_svc_suffix():
    e = make_entity(name="payments-svc")
    assert e.normalized_name == "payments"


def test_entity_fingerprint_hash_is_stable():
    e = make_entity()
    assert e.fingerprint_hash() == e.fingerprint_hash()


def test_entity_serializes_to_dict():
    e = make_entity()
    d = e.model_dump()
    assert d["name"] == "payments-svc"
    assert d["entity_type"] == "Service"


def test_perspective_get_entity():
    e = make_entity()
    p = Perspective(platform="kubernetes", entities=[e], relationships=[])
    assert p.get_entity("svc-001") is e
    assert p.get_entity("nonexistent") is None


def test_perspective_edges_for():
    e = make_entity()
    edge = PerspectiveEdge(
        source_id="svc-001",
        target_id="db-001",
        relationship_type=RelationshipType.STORED_IN,
        platform="kubernetes",
    )
    p = Perspective(platform="kubernetes", entities=[e], relationships=[edge])
    edges = p.edges_for("svc-001")
    assert len(edges) == 1
    assert edges[0].target_id == "db-001"


def test_topology_fingerprint_self_similarity():
    fp = TopologyFingerprint(
        entity_id="x",
        platform="k8s",
        semantic_vector=[1.0, 0.0],
        neighbor_type_signature="abc123",
        request_rate_bucket="high",
        error_rate_bucket="low",
        deployment_frequency_bucket="medium",
        age_bucket="recent",
        change_velocity="high",
    )
    assert fp.similarity(fp) == pytest.approx(1.0, abs=0.15)


def test_topology_fingerprint_zero_similarity_different():
    fp_a = TopologyFingerprint(
        entity_id="a",
        platform="k8s",
        semantic_vector=[1.0, 0.0],
        neighbor_type_signature="abc",
    )
    fp_b = TopologyFingerprint(
        entity_id="b",
        platform="dd",
        semantic_vector=[0.0, 1.0],
        neighbor_type_signature="xyz",
    )
    sim = fp_a.similarity(fp_b)
    assert 0.0 <= sim <= 1.0
