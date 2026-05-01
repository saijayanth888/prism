from datetime import datetime

from app.cpt.models import EntityType, PerspectiveEntity
from app.cpt.truth_resolver import TruthResolver


def make_entity(entity_id, name, platform, properties=None, labels=None) -> PerspectiveEntity:
    return PerspectiveEntity(
        entity_id=entity_id,
        name=name,
        platform=platform,
        entity_type=EntityType.SERVICE,
        observed_at=datetime.utcnow(),
        properties=properties or {},
        labels=labels or {},
    )


def test_canonical_name_picks_highest_authority():
    resolver = TruthResolver()
    perspectives = {
        "kubernetes": make_entity("k-001", "payments-svc", "kubernetes"),
        "datadog": make_entity("d-001", "payments_service", "datadog"),
        "apiconnect": make_entity("a-001", "Payments API", "apiconnect"),
    }
    name = resolver.choose_canonical_name(perspectives)
    # apiconnect has highest name authority (0.9)
    assert name == "Payments API"


def test_resolve_properties_uses_authority():
    resolver = TruthResolver()
    perspectives = {
        "kubernetes": make_entity(
            "k-001", "payments-svc", "kubernetes",
            properties={"replica_count": 3, "error_rate": 0.5},
        ),
        "datadog": make_entity(
            "d-001", "payments-svc", "datadog",
            properties={"error_rate": 1.2, "p99_latency": 45.0},
        ),
    }
    props = resolver.resolve_properties(perspectives)
    # Datadog has authority=1.0 for error_rate; Kubernetes has authority=0.0 (not in matrix)
    assert props["p99_latency"] == 45.0
    assert props["replica_count"] == 3


def test_resolve_labels_merged_from_all_platforms():
    resolver = TruthResolver()
    perspectives = {
        "kubernetes": make_entity("k-001", "svc", "kubernetes", labels={"app": "payments", "env": "prod"}),
        "github": make_entity("g-001", "svc", "github", labels={"team": "payments-team"}),
    }
    props = resolver.resolve_properties(perspectives)
    labels = props.get("labels", {})
    assert labels.get("app") == "payments"
    assert labels.get("team") == "payments-team"


def test_choose_canonical_name_single_platform():
    resolver = TruthResolver()
    perspectives = {
        "unknown_platform": make_entity("u-001", "my-service", "unknown_platform"),
    }
    assert resolver.choose_canonical_name(perspectives) == "my-service"
