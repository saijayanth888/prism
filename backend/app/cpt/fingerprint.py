from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from functools import lru_cache
from typing import TYPE_CHECKING

import structlog

from app.cpt.models import (
    PerspectiveEdge,
    PerspectiveEntity,
    RelationshipType,
    TopologyFingerprint,
)

if TYPE_CHECKING:
    from app.cpt.models import Perspective

log = structlog.get_logger(__name__)

BUCKET_HIGH_TRAFFIC_PORTS = {80, 443, 8080, 8443, 3000, 5000, 8000}
BUCKET_DB_PORTS = {5432, 3306, 27017, 6379, 9200, 5984}
BUCKET_QUEUE_PORTS = {9092, 5672, 15672, 61616}


@lru_cache(maxsize=1)
def _get_sentence_model():
    """Lazily load sentence-transformers model (cached singleton)."""
    try:
        from sentence_transformers import SentenceTransformer
        return SentenceTransformer("all-MiniLM-L6-v2")
    except ImportError:
        log.warning("sentence_transformers.unavailable", reason="not installed")
        return None


class FingerprintEngine:
    def compute(
        self, entity: PerspectiveEntity, perspective: "Perspective"
    ) -> TopologyFingerprint:
        in_degree, out_degree = self._compute_structural(entity, perspective)
        neighbor_sig = self._compute_neighbor_signature(in_degree, out_degree)
        semantic_vec = self._compute_semantic_vector(entity)
        ports, protocols = self._compute_resource(entity)
        behavioral = self._compute_behavioral(entity)
        temporal = self._compute_temporal(entity)

        return TopologyFingerprint(
            entity_id=entity.entity_id,
            platform=entity.platform,
            in_degree_by_type=in_degree,
            out_degree_by_type=out_degree,
            neighbor_type_signature=neighbor_sig,
            local_clustering_coefficient=self._compute_clustering(entity, perspective),
            exposed_ports=ports,
            protocol_hints=protocols,
            resource_class=self._compute_resource_class(entity, ports),
            semantic_vector=semantic_vec,
            **behavioral,
            **temporal,
        )

    def _compute_structural(
        self, entity: PerspectiveEntity, perspective: "Perspective"
    ) -> tuple[dict[str, int], dict[str, int]]:
        entity_map = {e.entity_id: e for e in perspective.entities}
        in_degree: dict[str, int] = {}
        out_degree: dict[str, int] = {}

        for edge in perspective.relationships:
            if edge.target_id == entity.entity_id:
                src = entity_map.get(edge.source_id)
                if src:
                    key = src.entity_type.value
                    in_degree[key] = in_degree.get(key, 0) + 1

            if edge.source_id == entity.entity_id:
                tgt = entity_map.get(edge.target_id)
                if tgt:
                    key = tgt.entity_type.value
                    out_degree[key] = out_degree.get(key, 0) + 1

        return in_degree, out_degree

    def _compute_clustering(
        self, entity: PerspectiveEntity, perspective: "Perspective"
    ) -> float:
        """Local clustering coefficient of entity in the perspective graph."""
        neighbors = set()
        for edge in perspective.relationships:
            if edge.source_id == entity.entity_id:
                neighbors.add(edge.target_id)
            if edge.target_id == entity.entity_id:
                neighbors.add(edge.source_id)

        if len(neighbors) < 2:
            return 0.0

        neighbor_edges = sum(
            1 for e in perspective.relationships
            if e.source_id in neighbors and e.target_id in neighbors
        )
        possible = len(neighbors) * (len(neighbors) - 1) / 2
        return neighbor_edges / possible if possible > 0 else 0.0

    def _compute_neighbor_signature(
        self, in_degree: dict[str, int], out_degree: dict[str, int]
    ) -> str:
        sig = sorted(
            [(f"in:{k}", v) for k, v in in_degree.items()]
            + [(f"out:{k}", v) for k, v in out_degree.items()]
        )
        return hashlib.md5(str(sig).encode()).hexdigest()[:12]

    def _compute_semantic_vector(self, entity: PerspectiveEntity) -> list[float]:
        model = _get_sentence_model()
        if model is None:
            return []

        text = f"{entity.name} {entity.entity_type.value}"
        if entity.labels:
            text += " " + " ".join(f"{k}:{v}" for k, v in entity.labels.items())

        try:
            vec = model.encode(text, convert_to_numpy=True)
            return vec.tolist()
        except Exception as exc:
            log.warning("semantic_vector.failed", entity_id=entity.entity_id, error=str(exc))
            return []

    def _compute_resource(
        self, entity: PerspectiveEntity
    ) -> tuple[list[int], list[str]]:
        ports: list[int] = []
        protocols: list[str] = []

        raw_ports = entity.properties.get("ports") or entity.properties.get("containerPorts") or []
        if isinstance(raw_ports, list):
            for p in raw_ports:
                try:
                    ports.append(int(p) if isinstance(p, (int, str)) else p.get("containerPort", 0))
                except (TypeError, ValueError):
                    pass

        raw_proto = entity.properties.get("protocols") or entity.properties.get("scheme") or []
        if isinstance(raw_proto, list):
            protocols.extend([str(p).lower() for p in raw_proto])
        elif isinstance(raw_proto, str):
            protocols.append(raw_proto.lower())

        # Infer protocols from well-known ports
        port_set = set(ports)
        if port_set & {80, 8080}:
            protocols.append("http")
        if port_set & {443, 8443}:
            protocols.append("https")
        if port_set & BUCKET_QUEUE_PORTS:
            protocols.append("amqp")

        return sorted(set(ports)), sorted(set(protocols))

    def _compute_resource_class(self, entity: PerspectiveEntity, ports: list[int]) -> str:
        port_set = set(ports)
        if port_set & BUCKET_DB_PORTS:
            return "database"
        if port_set & BUCKET_QUEUE_PORTS:
            return "queue"
        if port_set & BUCKET_HIGH_TRAFFIC_PORTS:
            return "web"

        props = entity.properties
        cpu = props.get("cpu_request") or props.get("resources", {}).get("requests", {}).get("cpu")
        if cpu:
            return "compute"
        return "unknown"

    def _compute_behavioral(self, entity: PerspectiveEntity) -> dict[str, str]:
        props = entity.properties

        def bucket_rate(value, low=10, high=100) -> str:
            try:
                v = float(value)
                if v >= high:
                    return "high"
                if v >= low:
                    return "medium"
                return "low"
            except (TypeError, ValueError):
                return "unknown"

        rps = props.get("requests_per_second") or props.get("throughput")
        error_rate = props.get("error_rate") or props.get("error_percentage")
        deploy_freq = props.get("deployment_frequency") or props.get("releases_per_month")

        return {
            "request_rate_bucket": bucket_rate(rps, 10, 1000),
            "error_rate_bucket": bucket_rate(error_rate, 1, 5),
            "deployment_frequency_bucket": bucket_rate(deploy_freq, 1, 10),
        }

    def _compute_temporal(self, entity: PerspectiveEntity) -> dict[str, str]:
        now = datetime.now(timezone.utc)
        observed = entity.observed_at

        if observed.tzinfo is None:
            observed = observed.replace(tzinfo=timezone.utc)

        age_days = (now - observed).days

        if age_days < 7:
            age_bucket = "new"
        elif age_days < 90:
            age_bucket = "recent"
        elif age_days < 365:
            age_bucket = "established"
        else:
            age_bucket = "mature"

        velocity = entity.properties.get("change_velocity") or entity.properties.get("commit_frequency")
        try:
            v = float(velocity)
            change_velocity = "high" if v >= 10 else "medium" if v >= 3 else "low"
        except (TypeError, ValueError):
            change_velocity = "unknown"

        return {"age_bucket": age_bucket, "change_velocity": change_velocity}
