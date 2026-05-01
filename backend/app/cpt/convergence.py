from __future__ import annotations

import re
from itertools import product
from typing import TYPE_CHECKING

import structlog

from app.cpt.fingerprint import FingerprintEngine
from app.cpt.models import (
    ConvergenceCandidate,
    ConvergedEntity,
    Perspective,
    PerspectiveEntity,
    TopologyFingerprint,
)

if TYPE_CHECKING:
    pass

log = structlog.get_logger(__name__)


def _normalize_name(name: str) -> str:
    name = name.lower()
    name = re.sub(r"^(prod-|stg-|dev-|staging-|production-)", "", name)
    name = re.sub(r"(-v\d+|-api-v\d+)$", "", name)
    name = re.sub(r"(-svc|-service|-api|-app)$", "", name)
    return name.strip("-_")


class ConvergenceEngine:
    def __init__(
        self,
        fingerprint_engine: FingerprintEngine | None = None,
        confidence_threshold: float = 0.7,
    ):
        self.fp = fingerprint_engine or FingerprintEngine()
        self.confidence_threshold = confidence_threshold

    async def converge(self, perspectives: list[Perspective]) -> list[ConvergedEntity]:
        """Full convergence across all perspectives using multi-pass resolution."""
        if not perspectives:
            return []

        all_entities: list[PerspectiveEntity] = []
        for p in perspectives:
            all_entities.extend(p.entities)

        if not all_entities:
            return []

        # Multi-pass entity resolution
        clusters = self._resolve_entities(all_entities, perspectives)

        converged: list[ConvergedEntity] = []
        from app.cpt.truth_resolver import TruthResolver
        resolver = TruthResolver()

        for cluster in clusters:
            if not cluster:
                continue

            perspectives_map = {e.platform: e for e in cluster}
            primary = max(cluster, key=lambda e: len(e.labels))

            entity = ConvergedEntity(
                canonical_name=resolver.choose_canonical_name(perspectives_map),
                entity_type=primary.entity_type,
                perspectives=perspectives_map,
                confidence=self._cluster_confidence(cluster),
                properties=resolver.resolve_properties(perspectives_map),
            )
            converged.append(entity)

        log.info(
            "cpt.convergence.complete",
            perspectives=len(perspectives),
            input_entities=len(all_entities),
            converged_entities=len(converged),
        )
        return converged

    async def incremental_converge(
        self,
        existing: list[ConvergedEntity],
        new_perspective: Perspective,
    ) -> list[ConvergedEntity]:
        """Re-converge when a single platform syncs. Adds/updates affected entities."""
        # Remove entities from the updated platform from existing converged set
        platform = new_perspective.platform
        preserved = []
        for ce in existing:
            if platform in ce.perspectives:
                del ce.perspectives[platform]
                if ce.perspectives:
                    preserved.append(ce)
                # Drop empty converged entities
            else:
                preserved.append(ce)

        # Create synthetic perspective list: preserved perspectives + new one
        synthetic_perspectives = [new_perspective]
        for ce in preserved:
            for plat, entity in ce.perspectives.items():
                found = next(
                    (p for p in synthetic_perspectives if p.platform == plat), None
                )
                if found:
                    if entity not in found.entities:
                        found.entities.append(entity)
                else:
                    synthetic_perspectives.append(
                        Perspective(platform=plat, entities=[entity], relationships=[])
                    )

        return await self.converge(synthetic_perspectives)

    def _resolve_entities(
        self,
        entities: list[PerspectiveEntity],
        perspectives: list[Perspective],
    ) -> list[list[PerspectiveEntity]]:
        """5-pass entity resolution. Returns clusters of matched entities."""
        # Start: each entity in its own cluster
        clusters: list[list[PerspectiveEntity]] = [[e] for e in entities]
        entity_to_cluster: dict[str, int] = {e.entity_id: i for i, e in enumerate(entities)}

        def merge(id_a: str, id_b: str) -> None:
            ca = entity_to_cluster.get(id_a)
            cb = entity_to_cluster.get(id_b)
            if ca is None or cb is None or ca == cb:
                return
            # Merge smaller into larger
            if len(clusters[ca]) < len(clusters[cb]):
                ca, cb = cb, ca
            clusters[ca].extend(clusters[cb])
            for e in clusters[cb]:
                entity_to_cluster[e.entity_id] = ca
            clusters[cb] = []

        # PASS 1: Exact name + namespace match (cross-platform only)
        for ea, eb in product(entities, entities):
            if ea.platform == eb.platform or ea.entity_type != eb.entity_type:
                continue
            if ea.name.lower() == eb.name.lower() and ea.namespace == eb.namespace:
                merge(ea.entity_id, eb.entity_id)

        # PASS 2: Normalized name match
        for ea, eb in product(entities, entities):
            if ea.platform == eb.platform or ea.entity_type != eb.entity_type:
                continue
            if (
                _normalize_name(ea.name) == _normalize_name(eb.name)
                and ea.namespace == eb.namespace
            ):
                merge(ea.entity_id, eb.entity_id)

        # PASS 3: Label-based match (3+ shared labels)
        for ea, eb in product(entities, entities):
            if ea.platform == eb.platform or ea.entity_type != eb.entity_type:
                continue
            shared = set(ea.labels.items()) & set(eb.labels.items())
            if len(shared) >= 3:
                merge(ea.entity_id, eb.entity_id)

        # PASS 4: Fuzzy name match (Levenshtein < 3, same namespace)
        for ea, eb in product(entities, entities):
            if ea.platform == eb.platform or ea.entity_type != eb.entity_type:
                continue
            if ea.namespace != eb.namespace:
                continue
            na, nb = _normalize_name(ea.name), _normalize_name(eb.name)
            if na and nb and abs(len(na) - len(nb)) <= 2:
                if self._levenshtein(na, nb) < 3:
                    merge(ea.entity_id, eb.entity_id)

        # PASS 5: Fingerprint similarity (Hungarian algorithm)
        try:
            self._fingerprint_pass(entities, perspectives, entity_to_cluster, clusters, merge)
        except Exception as exc:
            log.warning("cpt.fingerprint_pass.failed", error=str(exc))

        return [c for c in clusters if c]

    def _fingerprint_pass(
        self,
        entities: list[PerspectiveEntity],
        perspectives: list[Perspective],
        entity_to_cluster: dict[str, int],
        clusters: list[list[PerspectiveEntity]],
        merge,
    ) -> None:
        """Fingerprint similarity pass using scipy Hungarian algorithm."""
        try:
            from scipy.optimize import linear_sum_assignment
        except ImportError:
            return

        perspective_map = {p.platform: p for p in perspectives}

        # Compute fingerprints for unmerged entities (still in singleton clusters)
        singletons = [
            e for e in entities
            if len(clusters[entity_to_cluster[e.entity_id]]) == 1
        ]
        if len(singletons) < 2:
            return

        fps: dict[str, TopologyFingerprint] = {}
        for e in singletons:
            p = perspective_map.get(e.platform)
            if p:
                fps[e.entity_id] = self.fp.compute(e, p)

        # Build cross-platform pairs
        groups_by_type: dict[str, list[PerspectiveEntity]] = {}
        for e in singletons:
            if e.entity_id in fps:
                groups_by_type.setdefault(e.entity_type.value, []).append(e)

        for entity_type, group in groups_by_type.items():
            platforms = list({e.platform for e in group})
            if len(platforms) < 2:
                continue

            for i, plat_a in enumerate(platforms):
                for plat_b in platforms[i + 1:]:
                    group_a = [e for e in group if e.platform == plat_a]
                    group_b = [e for e in group if e.platform == plat_b]

                    if not group_a or not group_b:
                        continue

                    # Cost matrix (higher similarity = lower cost)
                    n, m = len(group_a), len(group_b)
                    cost = [[0.0] * m for _ in range(n)]
                    for r, ea in enumerate(group_a):
                        for c, eb in enumerate(group_b):
                            if ea.entity_id in fps and eb.entity_id in fps:
                                sim = fps[ea.entity_id].similarity(fps[eb.entity_id])
                                cost[r][c] = 1.0 - sim

                    row_ind, col_ind = linear_sum_assignment(cost)
                    for r, c in zip(row_ind, col_ind):
                        if (1.0 - cost[r][c]) >= self.confidence_threshold:
                            merge(group_a[r].entity_id, group_b[c].entity_id)

    def _cluster_confidence(self, cluster: list[PerspectiveEntity]) -> float:
        if len(cluster) == 1:
            return 1.0
        platform_count = len({e.platform for e in cluster})
        return min(0.95, 0.7 + 0.05 * platform_count)

    @staticmethod
    def _levenshtein(a: str, b: str) -> int:
        if len(a) < len(b):
            a, b = b, a
        if not b:
            return len(a)
        prev = list(range(len(b) + 1))
        for i, ca in enumerate(a):
            curr = [i + 1]
            for j, cb in enumerate(b):
                curr.append(min(prev[j + 1] + 1, curr[j] + 1, prev[j] + (ca != cb)))
            prev = curr
        return prev[-1]
