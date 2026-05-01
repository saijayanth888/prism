import asyncio
from datetime import datetime

import pytest

from app.cpt.convergence import ConvergenceEngine
from app.cpt.models import (
    EntityType,
    Perspective,
    PerspectiveEdge,
    PerspectiveEntity,
    RelationshipType,
)


def make_entity(entity_id, name, platform, entity_type=EntityType.SERVICE, **kwargs):
    return PerspectiveEntity(
        entity_id=entity_id,
        name=name,
        platform=platform,
        entity_type=entity_type,
        observed_at=datetime.utcnow(),
        **kwargs,
    )


@pytest.mark.asyncio
async def test_exact_name_match_converges():
    """Two entities with same name on different platforms → 1 converged entity."""
    engine = ConvergenceEngine(confidence_threshold=0.6)

    p1 = Perspective(
        platform="kubernetes",
        entities=[make_entity("k-001", "payments-svc", "kubernetes")],
        relationships=[],
    )
    p2 = Perspective(
        platform="datadog",
        entities=[make_entity("d-001", "payments-svc", "datadog")],
        relationships=[],
    )

    converged = await engine.converge([p1, p2])
    assert len(converged) == 1
    assert "kubernetes" in converged[0].perspectives
    assert "datadog" in converged[0].perspectives


@pytest.mark.asyncio
async def test_normalized_name_match_converges():
    """Entities with naming variants converge to one."""
    engine = ConvergenceEngine(confidence_threshold=0.6)

    p1 = Perspective(
        platform="kubernetes",
        entities=[make_entity("k-001", "payments-svc", "kubernetes")],
        relationships=[],
    )
    p2 = Perspective(
        platform="apiconnect",
        entities=[make_entity("a-001", "payments-api-v2", "apiconnect")],
        relationships=[],
    )
    p3 = Perspective(
        platform="argocd",
        entities=[make_entity("r-001", "prod-payments", "argocd")],
        relationships=[],
    )

    converged = await engine.converge([p1, p2, p3])
    assert len(converged) == 1
    assert len(converged[0].perspectives) == 3


@pytest.mark.asyncio
async def test_different_services_stay_separate():
    """Two unrelated services should not be merged."""
    engine = ConvergenceEngine(confidence_threshold=0.6)

    p1 = Perspective(
        platform="kubernetes",
        entities=[
            make_entity("k-001", "payments-svc", "kubernetes"),
            make_entity("k-002", "fraud-detector", "kubernetes"),
        ],
        relationships=[],
    )
    p2 = Perspective(
        platform="datadog",
        entities=[
            make_entity("d-001", "payments-svc", "datadog"),
            make_entity("d-002", "fraud-detector", "datadog"),
        ],
        relationships=[],
    )

    converged = await engine.converge([p1, p2])
    assert len(converged) == 2


@pytest.mark.asyncio
async def test_label_based_match():
    """Entities with 3+ shared labels converge."""
    engine = ConvergenceEngine(confidence_threshold=0.6)
    shared_labels = {"app": "orders", "team": "backend", "domain": "commerce"}

    p1 = Perspective(
        platform="kubernetes",
        entities=[make_entity("k-001", "orders-svc", "kubernetes", labels=shared_labels)],
        relationships=[],
    )
    p2 = Perspective(
        platform="servicenow",
        entities=[make_entity("s-001", "OrderService", "servicenow", labels=shared_labels)],
        relationships=[],
    )

    converged = await engine.converge([p1, p2])
    assert len(converged) == 1


@pytest.mark.asyncio
async def test_single_perspective_produces_converged_entities():
    """Single perspective entities each become a converged entity."""
    engine = ConvergenceEngine()
    p = Perspective(
        platform="kubernetes",
        entities=[
            make_entity("k-001", "svc-a", "kubernetes"),
            make_entity("k-002", "svc-b", "kubernetes"),
        ],
        relationships=[],
    )
    converged = await engine.converge([p])
    assert len(converged) == 2
