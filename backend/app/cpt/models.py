from __future__ import annotations

import hashlib
from datetime import datetime
from enum import Enum
from typing import Any
from uuid import uuid4

import numpy as np
from pydantic import BaseModel, Field


class EntityType(str, Enum):
    APPLICATION = "Application"
    SERVICE = "Service"
    API = "API"
    DEPLOYMENT = "Deployment"
    CONTAINER = "Container"
    REPOSITORY = "Repository"
    PIPELINE = "Pipeline"
    IMAGE = "Image"
    NAMESPACE = "Namespace"
    TOPIC = "Topic"
    DATABASE = "Database"
    SECRET = "Secret"
    POLICY = "Policy"
    VULNERABILITY = "Vulnerability"
    ENVIRONMENT = "Environment"
    DOMAIN = "Domain"
    TEAM = "Team"


class RelationshipType(str, Enum):
    DEPENDS_ON = "DEPENDS_ON"
    DEPLOYED_TO = "DEPLOYED_TO"
    EXPOSES = "EXPOSES"
    CONSUMES = "CONSUMES"
    BUILT_FROM = "BUILT_FROM"
    RUNS_IN = "RUNS_IN"
    PUBLISHES_TO = "PUBLISHES_TO"
    SUBSCRIBES_TO = "SUBSCRIBES_TO"
    OWNS = "OWNS"
    BELONGS_TO = "BELONGS_TO"
    SCANNED_BY = "SCANNED_BY"
    HAS_VULNERABILITY = "HAS_VULNERABILITY"
    ENFORCES = "ENFORCES"
    STORED_IN = "STORED_IN"
    USES_SECRET = "USES_SECRET"
    GATEWAY_FOR = "GATEWAY_FOR"


class PerspectiveEntity(BaseModel):
    entity_id: str
    entity_type: EntityType
    name: str
    platform: str
    platform_url: str | None = None
    namespace: str | None = None
    environment: str | None = None
    labels: dict[str, str] = Field(default_factory=dict)
    properties: dict[str, Any] = Field(default_factory=dict)
    observed_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def normalized_name(self) -> str:
        import re
        name = self.name.lower()
        # Strip common env prefixes
        name = re.sub(r"^(prod-|stg-|dev-|staging-|production-)", "", name)
        # Strip common version suffixes
        name = re.sub(r"(-v\d+|-api-v\d+)$", "", name)
        # Strip common suffixes
        name = re.sub(r"(-svc|-service|-api|-app)$", "", name)
        return name.strip("-_")

    def fingerprint_hash(self) -> str:
        """SHA256 hash for idempotent sync."""
        data = {
            "entity_id": self.entity_id,
            "entity_type": self.entity_type.value,
            "name": self.name,
            "platform": self.platform,
            "labels": sorted(self.labels.items()),
        }
        return hashlib.sha256(str(data).encode()).hexdigest()


class PerspectiveEdge(BaseModel):
    source_id: str
    target_id: str
    relationship_type: RelationshipType
    platform: str
    properties: dict[str, Any] = Field(default_factory=dict)


class Perspective(BaseModel):
    platform: str
    observed_at: datetime = Field(default_factory=datetime.utcnow)
    entities: list[PerspectiveEntity] = Field(default_factory=list)
    relationships: list[PerspectiveEdge] = Field(default_factory=list)
    authority_domains: list[str] = Field(default_factory=list)

    def get_entity(self, entity_id: str) -> PerspectiveEntity | None:
        return next((e for e in self.entities if e.entity_id == entity_id), None)

    def edges_for(self, entity_id: str) -> list[PerspectiveEdge]:
        return [
            e for e in self.relationships
            if e.source_id == entity_id or e.target_id == entity_id
        ]


class TopologyFingerprint(BaseModel):
    entity_id: str
    platform: str
    in_degree_by_type: dict[str, int] = Field(default_factory=dict)
    out_degree_by_type: dict[str, int] = Field(default_factory=dict)
    neighbor_type_signature: str = ""
    local_clustering_coefficient: float = 0.0
    request_rate_bucket: str = "unknown"
    error_rate_bucket: str = "unknown"
    deployment_frequency_bucket: str = "unknown"
    age_bucket: str = "unknown"
    change_velocity: str = "unknown"
    semantic_vector: list[float] = Field(default_factory=list)
    exposed_ports: list[int] = Field(default_factory=list)
    protocol_hints: list[str] = Field(default_factory=list)
    resource_class: str = "unknown"

    def similarity(self, other: "TopologyFingerprint") -> float:
        """Weighted multi-dimensional similarity score in [0, 1]."""
        WEIGHTS = {
            "structural": 0.35,
            "resource": 0.25,
            "semantic": 0.20,
            "behavioral": 0.10,
            "temporal": 0.10,
        }

        structural = self._structural_similarity(other)
        resource = self._resource_similarity(other)
        semantic = self._semantic_similarity(other)
        behavioral = self._behavioral_similarity(other)
        temporal = self._temporal_similarity(other)

        score = (
            WEIGHTS["structural"] * structural
            + WEIGHTS["resource"] * resource
            + WEIGHTS["semantic"] * semantic
            + WEIGHTS["behavioral"] * behavioral
            + WEIGHTS["temporal"] * temporal
        )
        return round(float(score), 4)

    def dimension_scores(self, other: "TopologyFingerprint") -> dict[str, float]:
        return {
            "structural": self._structural_similarity(other),
            "resource": self._resource_similarity(other),
            "semantic": self._semantic_similarity(other),
            "behavioral": self._behavioral_similarity(other),
            "temporal": self._temporal_similarity(other),
        }

    def _structural_similarity(self, other: "TopologyFingerprint") -> float:
        # Jaccard similarity on neighbor type signature strings
        a = set(self.neighbor_type_signature)
        b = set(other.neighbor_type_signature)
        if not a and not b:
            return 1.0
        if not a or not b:
            return 0.0
        return len(a & b) / len(a | b)

    def _resource_similarity(self, other: "TopologyFingerprint") -> float:
        ports_a = set(self.exposed_ports)
        ports_b = set(other.exposed_ports)
        protocols_a = set(self.protocol_hints)
        protocols_b = set(other.protocol_hints)

        port_sim = len(ports_a & ports_b) / len(ports_a | ports_b) if (ports_a | ports_b) else 1.0
        proto_sim = len(protocols_a & protocols_b) / len(protocols_a | protocols_b) if (protocols_a | protocols_b) else 1.0
        return (port_sim + proto_sim) / 2

    def _semantic_similarity(self, other: "TopologyFingerprint") -> float:
        if not self.semantic_vector or not other.semantic_vector:
            return 0.5  # neutral when not available
        a = np.array(self.semantic_vector, dtype=float)
        b = np.array(other.semantic_vector, dtype=float)
        norm_a, norm_b = np.linalg.norm(a), np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.5
        return float(np.dot(a, b) / (norm_a * norm_b))

    def _behavioral_similarity(self, other: "TopologyFingerprint") -> float:
        buckets = [
            (self.request_rate_bucket, other.request_rate_bucket),
            (self.error_rate_bucket, other.error_rate_bucket),
            (self.deployment_frequency_bucket, other.deployment_frequency_bucket),
        ]
        scores = []
        bucket_order = ["unknown", "low", "medium", "high"]
        for a, b in buckets:
            if a == "unknown" or b == "unknown":
                scores.append(0.5)
            elif a == b:
                scores.append(1.0)
            else:
                try:
                    diff = abs(bucket_order.index(a) - bucket_order.index(b))
                    scores.append(1.0 if diff == 0 else 0.5 if diff == 1 else 0.0)
                except ValueError:
                    scores.append(0.5)
        return sum(scores) / len(scores)

    def _temporal_similarity(self, other: "TopologyFingerprint") -> float:
        age_match = 1.0 if self.age_bucket == other.age_bucket else 0.5
        velocity_match = 1.0 if self.change_velocity == other.change_velocity else 0.5
        return (age_match + velocity_match) / 2


class ConvergenceCandidate(BaseModel):
    entity_a: PerspectiveEntity
    entity_b: PerspectiveEntity
    fingerprint_a: TopologyFingerprint
    fingerprint_b: TopologyFingerprint
    similarity_score: float
    dimension_scores: dict[str, float]


class ConvergedEntity(BaseModel):
    converged_id: str = Field(default_factory=lambda: str(uuid4()))
    canonical_name: str
    entity_type: EntityType
    perspectives: dict[str, PerspectiveEntity] = Field(default_factory=dict)
    confidence: float = 1.0
    properties: dict[str, Any] = Field(default_factory=dict)
    fingerprint: TopologyFingerprint | None = None

    def platform_ids(self) -> dict[str, str]:
        return {platform: e.entity_id for platform, e in self.perspectives.items()}
