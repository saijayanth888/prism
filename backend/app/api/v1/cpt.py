"""
CPT Pipeline Demo API — Convergence Platform Topology engine demonstration.

Showcases the patent-pending CPT engine's ability to resolve the same entity
appearing under different names across 13 enterprise platforms into a single
canonical record.  Designed for CIO-level presentations: every response tells
a story backed by real convergence data.
"""
from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, HTTPException

from app.connectors.mock_engine import MockDataEngine
from app.cpt.convergence import ConvergenceEngine
from app.cpt.models import ConvergedEntity, Perspective

router = APIRouter()

# ---------------------------------------------------------------------------
# Module-level cache — run the pipeline once, serve results instantly after.
# ---------------------------------------------------------------------------
_pipeline_cache: dict[str, Any] | None = None


async def _get_pipeline_result() -> dict[str, Any]:
    """Run the full CPT pipeline (or return cached result)."""
    global _pipeline_cache
    if _pipeline_cache is not None:
        return _pipeline_cache

    t0 = time.perf_counter()

    # 1. Generate mock perspectives from all 13 platforms
    engine = MockDataEngine(seed=42)
    perspectives: list[Perspective] = engine.generate_all_perspectives(profile="small")

    raw_entity_count = sum(len(p.entities) for p in perspectives)
    platform_breakdown = {
        p.platform: len(p.entities) for p in perspectives
    }

    # 2. Run the convergence engine
    convergence = ConvergenceEngine(confidence_threshold=0.65)
    converged: list[ConvergedEntity] = await convergence.converge(perspectives)

    elapsed = time.perf_counter() - t0

    # 3. Compute statistics
    multi_platform = [ce for ce in converged if len(ce.perspectives) >= 2]
    single_platform = [ce for ce in converged if len(ce.perspectives) == 1]

    avg_confidence = (
        sum(ce.confidence for ce in converged) / len(converged)
        if converged
        else 0.0
    )
    avg_platforms = (
        sum(len(ce.perspectives) for ce in converged) / len(converged)
        if converged
        else 0.0
    )

    dedup_pct = (
        round((1 - len(converged) / raw_entity_count) * 100, 1)
        if raw_entity_count > 0
        else 0.0
    )

    # 4. Build sample convergence examples (top 5 by platform count)
    examples = _build_convergence_examples(converged)

    _pipeline_cache = {
        "perspectives": perspectives,
        "converged": converged,
        "raw_entity_count": raw_entity_count,
        "converged_count": len(converged),
        "platform_breakdown": platform_breakdown,
        "multi_platform_count": len(multi_platform),
        "single_platform_count": len(single_platform),
        "avg_confidence": round(avg_confidence, 4),
        "avg_platforms_per_entity": round(avg_platforms, 2),
        "dedup_pct": dedup_pct,
        "processing_time_ms": round(elapsed * 1000, 1),
        "examples": examples,
    }
    return _pipeline_cache


def _build_convergence_examples(
    converged: list[ConvergedEntity],
) -> list[dict[str, Any]]:
    """Pick the most impressive convergence examples to showcase."""
    # Sort by number of platforms descending — most cross-platform first
    ranked = sorted(converged, key=lambda ce: len(ce.perspectives), reverse=True)

    examples: list[dict[str, Any]] = []
    for ce in ranked[:8]:
        if len(ce.perspectives) < 2:
            continue
        platform_names: dict[str, str] = {}
        for platform, entity in ce.perspectives.items():
            platform_names[platform] = entity.name

        examples.append({
            "canonical_name": ce.canonical_name,
            "entity_type": ce.entity_type.value,
            "confidence": ce.confidence,
            "platform_count": len(ce.perspectives),
            "names_by_platform": platform_names,
            "insight": _generate_insight(ce),
        })

    return examples[:5]


def _generate_insight(ce: ConvergedEntity) -> str:
    """Generate a human-readable insight for a convergence example."""
    platforms = list(ce.perspectives.keys())
    names = list({e.name for e in ce.perspectives.values()})

    if len(names) == 1:
        return (
            f"Same name \"{names[0]}\" appeared on {len(platforms)} platforms "
            f"-- resolved via exact name match (Pass 1)."
        )

    return (
        f"Appeared as {len(names)} different names across {len(platforms)} platforms "
        f"-- CPT resolved these to \"{ce.canonical_name}\" with "
        f"{ce.confidence:.0%} confidence using multi-pass resolution."
    )


# ═══════════════════════════════════════════════════════════════════════════
# Endpoint 1: Full pipeline demonstration
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/pipeline")
async def cpt_pipeline_demo() -> dict[str, Any]:
    """
    Run the complete CPT pipeline on mock data and return a presentation-ready
    summary of how cross-platform entity resolution works.
    """
    result = await _get_pipeline_result()

    return {
        "title": "CPT Engine -- Full Pipeline Demonstration",
        "subtitle": (
            "Cross-Platform Topology convergence across 13 enterprise platforms"
        ),
        "pipeline_summary": {
            "raw_entities": result["raw_entity_count"],
            "converged_entities": result["converged_count"],
            "deduplication_ratio": f"{result['dedup_pct']}%",
            "narrative": (
                f"{result['raw_entity_count']} raw entities from "
                f"{len(result['platform_breakdown'])} platforms "
                f"-> {result['converged_count']} converged entities "
                f"= {result['dedup_pct']}% deduplication"
            ),
        },
        "platform_breakdown": {
            platform: {
                "raw_entities": count,
                "platform": platform,
            }
            for platform, count in sorted(
                result["platform_breakdown"].items(),
                key=lambda x: x[1],
                reverse=True,
            )
        },
        "convergence_stats": {
            "cross_platform_entities": result["multi_platform_count"],
            "single_platform_entities": result["single_platform_count"],
            "avg_confidence": result["avg_confidence"],
            "avg_platforms_per_entity": result["avg_platforms_per_entity"],
        },
        "sample_convergence_examples": result["examples"],
        "processing_time_ms": result["processing_time_ms"],
        "engine_details": {
            "resolution_passes": [
                "Pass 1: Exact name + namespace match",
                "Pass 2: Normalized name match (strip prefixes/suffixes)",
                "Pass 3: Label-based match (3+ shared labels)",
                "Pass 4: Fuzzy name match (Levenshtein distance < 3)",
                "Pass 5: Topological fingerprint (Hungarian algorithm)",
            ],
            "confidence_threshold": 0.65,
            "fingerprint_dimensions": 5,
            "platforms_connected": len(result["platform_breakdown"]),
        },
    }


# ═══════════════════════════════════════════════════════════════════════════
# Endpoint 2: Entity resolution detail
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/entity/{entity_name}/resolution")
async def entity_resolution_detail(entity_name: str) -> dict[str, Any]:
    """
    Show how a specific entity was resolved across platforms.
    Accepts partial/fuzzy entity names (e.g. "payments-api", "fraud", "loans").
    """
    result = await _get_pipeline_result()
    converged: list[ConvergedEntity] = result["converged"]

    # Find matching converged entity (case-insensitive, partial match)
    search = entity_name.lower()
    matches: list[ConvergedEntity] = []
    for ce in converged:
        if search in ce.canonical_name.lower():
            matches.append(ce)
            continue
        # Also search across all platform-specific names
        for entity in ce.perspectives.values():
            if search in entity.name.lower():
                matches.append(ce)
                break

    if not matches:
        raise HTTPException(
            status_code=404,
            detail={
                "error": f"No converged entity matching \"{entity_name}\" found.",
                "suggestion": "Try a partial name like 'payments', 'fraud', or 'loans'.",
                "available_examples": [
                    ce.canonical_name for ce in converged[:20]
                ],
            },
        )

    # Use the best match (most platforms)
    entity = max(matches, key=lambda ce: len(ce.perspectives))

    # Build platform appearance map
    appearances: dict[str, dict[str, Any]] = {}
    for platform, pe in entity.perspectives.items():
        appearances[platform] = {
            "name_on_platform": pe.name,
            "entity_type": pe.entity_type.value,
            "namespace": pe.namespace,
            "environment": pe.environment,
            "labels": pe.labels,
            "entity_id": pe.entity_id,
        }

    # Determine why canonical name was chosen
    name_authority = {
        "apiconnect": 0.9,
        "kubernetes": 0.8,
        "confluent": 0.8,
        "github": 0.75,
        "servicenow": 0.7,
        "argocd": 0.6,
        "jira": 0.6,
        "datadog": 0.5,
    }

    name_candidates = []
    for platform, pe in entity.perspectives.items():
        authority = name_authority.get(platform, 0.5)
        name_candidates.append({
            "platform": platform,
            "name": pe.name,
            "authority_score": authority,
            "is_canonical": pe.name == entity.canonical_name
                or platform == max(
                    entity.perspectives.keys(),
                    key=lambda p: name_authority.get(p, 0.5),
                ),
        })

    name_candidates.sort(key=lambda x: x["authority_score"], reverse=True)

    return {
        "title": f"Entity Resolution: {entity.canonical_name}",
        "canonical_name": entity.canonical_name,
        "entity_type": entity.entity_type.value,
        "confidence": entity.confidence,
        "converged_id": entity.converged_id,
        "platform_count": len(entity.perspectives),
        "appearances_by_platform": appearances,
        "name_resolution": {
            "canonical_name": entity.canonical_name,
            "explanation": (
                f"The canonical name \"{entity.canonical_name}\" was chosen based on "
                f"platform authority rankings. The platform with the highest name "
                f"authority score among those that observe this entity determines "
                f"the canonical name."
            ),
            "candidates": name_candidates,
            "authority_ranking_reference": name_authority,
        },
        "resolution_narrative": (
            f"This entity appears on {len(entity.perspectives)} platforms, each "
            f"using a different naming convention. The CPT engine resolved all "
            f"{len(entity.perspectives)} names to \"{entity.canonical_name}\" "
            f"with {entity.confidence:.0%} confidence through multi-pass "
            f"entity resolution."
        ),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Endpoint 3: Fingerprint dimension explainer
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/fingerprint-demo")
async def fingerprint_demo() -> dict[str, Any]:
    """
    Explain and demonstrate the 5D topological fingerprinting system.
    Includes a worked example comparing two entities from different platforms.
    """
    result = await _get_pipeline_result()
    converged: list[ConvergedEntity] = result["converged"]
    perspectives: list[Perspective] = result["perspectives"]

    # Find a good example: a multi-platform entity to demonstrate fingerprinting
    multi = [ce for ce in converged if len(ce.perspectives) >= 2]
    example_entity = max(multi, key=lambda ce: len(ce.perspectives)) if multi else None

    worked_example: dict[str, Any] | None = None

    if example_entity and len(example_entity.perspectives) >= 2:
        # Pick two platforms to compare
        platform_list = list(example_entity.perspectives.keys())
        plat_a, plat_b = platform_list[0], platform_list[1]
        entity_a = example_entity.perspectives[plat_a]
        entity_b = example_entity.perspectives[plat_b]

        # Compute fingerprints
        from app.cpt.fingerprint import FingerprintEngine
        fp_engine = FingerprintEngine()
        perspective_a = next(
            (p for p in perspectives if p.platform == plat_a), None
        )
        perspective_b = next(
            (p for p in perspectives if p.platform == plat_b), None
        )

        if perspective_a and perspective_b:
            fp_a = fp_engine.compute(entity_a, perspective_a)
            fp_b = fp_engine.compute(entity_b, perspective_b)

            sim_score = fp_a.similarity(fp_b)
            dim_scores = fp_a.dimension_scores(fp_b)

            worked_example = {
                "title": (
                    f"Comparing \"{entity_a.name}\" ({plat_a}) vs "
                    f"\"{entity_b.name}\" ({plat_b})"
                ),
                "entity_a": {
                    "name": entity_a.name,
                    "platform": plat_a,
                    "entity_type": entity_a.entity_type.value,
                    "fingerprint": {
                        "in_degree_by_type": fp_a.in_degree_by_type,
                        "out_degree_by_type": fp_a.out_degree_by_type,
                        "neighbor_type_signature": fp_a.neighbor_type_signature[:16] + "...",
                        "local_clustering_coefficient": fp_a.local_clustering_coefficient,
                        "resource_class": fp_a.resource_class,
                        "exposed_ports": fp_a.exposed_ports,
                        "protocol_hints": fp_a.protocol_hints,
                        "request_rate_bucket": fp_a.request_rate_bucket,
                        "error_rate_bucket": fp_a.error_rate_bucket,
                        "deployment_frequency_bucket": fp_a.deployment_frequency_bucket,
                        "age_bucket": fp_a.age_bucket,
                        "change_velocity": fp_a.change_velocity,
                    },
                },
                "entity_b": {
                    "name": entity_b.name,
                    "platform": plat_b,
                    "entity_type": entity_b.entity_type.value,
                    "fingerprint": {
                        "in_degree_by_type": fp_b.in_degree_by_type,
                        "out_degree_by_type": fp_b.out_degree_by_type,
                        "neighbor_type_signature": fp_b.neighbor_type_signature[:16] + "...",
                        "local_clustering_coefficient": fp_b.local_clustering_coefficient,
                        "resource_class": fp_b.resource_class,
                        "exposed_ports": fp_b.exposed_ports,
                        "protocol_hints": fp_b.protocol_hints,
                        "request_rate_bucket": fp_b.request_rate_bucket,
                        "error_rate_bucket": fp_b.error_rate_bucket,
                        "deployment_frequency_bucket": fp_b.deployment_frequency_bucket,
                        "age_bucket": fp_b.age_bucket,
                        "change_velocity": fp_b.change_velocity,
                    },
                },
                "similarity_result": {
                    "overall_score": sim_score,
                    "dimension_scores": {
                        dim: round(score, 4) for dim, score in dim_scores.items()
                    },
                    "verdict": (
                        "SAME ENTITY" if sim_score >= 0.65
                        else "DIFFERENT ENTITIES"
                    ),
                    "threshold": 0.65,
                },
            }

    return {
        "title": "5D Topological Fingerprinting -- How CPT Identifies Entities",
        "description": (
            "Each entity observed on any platform is assigned a 5-dimensional "
            "topological fingerprint. When two entities from different platforms "
            "have a fingerprint similarity above the confidence threshold, CPT "
            "concludes they are the same entity."
        ),
        "dimensions": [
            {
                "name": "Structural",
                "weight": 0.35,
                "weight_pct": "35%",
                "description": (
                    "Graph topology: in-degree, out-degree by relationship type, "
                    "neighbor type signature (MD5 of sorted degree vectors), and "
                    "local clustering coefficient. Captures the entity's role in "
                    "the dependency graph."
                ),
                "example": (
                    "A payments-api with 5 inbound dependencies and 3 outbound "
                    "dependencies has a distinct structural fingerprint from a "
                    "batch processor with 1 inbound and 8 outbound."
                ),
            },
            {
                "name": "Resource",
                "weight": 0.25,
                "weight_pct": "25%",
                "description": (
                    "Infrastructure characteristics: exposed ports (Jaccard "
                    "similarity), protocol hints (HTTP, gRPC, AMQP), and "
                    "resource classification (database, queue, web, compute)."
                ),
                "example": (
                    "A service exposing port 8080 (HTTP) and 8443 (HTTPS) on "
                    "Kubernetes will match its Datadog counterpart that reports "
                    "the same ports in APM traces."
                ),
            },
            {
                "name": "Semantic",
                "weight": 0.20,
                "weight_pct": "20%",
                "description": (
                    "Name and label embedding using sentence-transformers "
                    "(all-MiniLM-L6-v2). Computes cosine similarity between "
                    "vector embeddings of '{name} {type} {labels}' strings."
                ),
                "example": (
                    "'payments-api Service team:payments' and "
                    "'prod-payments-payments Deployment app:payments' produce "
                    "similar embeddings despite different names."
                ),
            },
            {
                "name": "Behavioral",
                "weight": 0.10,
                "weight_pct": "10%",
                "description": (
                    "Runtime behavior: request rate bucket (low/medium/high), "
                    "error rate bucket, and deployment frequency bucket. "
                    "Entities that behave similarly are more likely the same."
                ),
                "example": (
                    "A high-throughput, low-error-rate service on both K8s "
                    "and Datadog suggests the same entity."
                ),
            },
            {
                "name": "Temporal",
                "weight": 0.10,
                "weight_pct": "10%",
                "description": (
                    "Lifecycle stage: age bucket (new/recent/established/mature) "
                    "and change velocity (low/medium/high). Entities created "
                    "around the same time with similar change patterns are "
                    "more likely the same."
                ),
                "example": (
                    "An 'established' service with 'medium' change velocity "
                    "on ArgoCD matches the same profile on Terraform."
                ),
            },
        ],
        "scoring": {
            "formula": (
                "similarity = 0.35*structural + 0.25*resource + 0.20*semantic "
                "+ 0.10*behavioral + 0.10*temporal"
            ),
            "threshold": 0.65,
            "threshold_explanation": (
                "Entities with a similarity score >= 0.65 are considered the "
                "same entity. This threshold was tuned to minimize false "
                "positives while catching naming variations like 'payments-api' "
                "(K8s) vs 'payments.payments_api' (Datadog) vs "
                "'prod-payments-payments' (ArgoCD)."
            ),
        },
        "worked_example": worked_example,
    }


# ═══════════════════════════════════════════════════════════════════════════
# Endpoint 4: Convergence statistics
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/convergence-stats")
async def convergence_stats() -> dict[str, Any]:
    """
    Return detailed convergence statistics: entity counts before/after,
    cross-platform breakdown, confidence distribution, and per-entity-type
    analysis.
    """
    result = await _get_pipeline_result()
    converged: list[ConvergedEntity] = result["converged"]

    # Per-entity-type breakdown
    type_breakdown: dict[str, dict[str, Any]] = {}
    for ce in converged:
        etype = ce.entity_type.value
        if etype not in type_breakdown:
            type_breakdown[etype] = {
                "converged_count": 0,
                "multi_platform_count": 0,
                "total_confidence": 0.0,
                "max_platforms": 0,
            }
        entry = type_breakdown[etype]
        entry["converged_count"] += 1
        if len(ce.perspectives) >= 2:
            entry["multi_platform_count"] += 1
        entry["total_confidence"] += ce.confidence
        entry["max_platforms"] = max(entry["max_platforms"], len(ce.perspectives))

    for etype, entry in type_breakdown.items():
        entry["avg_confidence"] = round(
            entry["total_confidence"] / entry["converged_count"], 4
        )
        del entry["total_confidence"]

    # Confidence distribution buckets
    confidence_buckets = {"0.90-1.00": 0, "0.80-0.89": 0, "0.70-0.79": 0, "below_0.70": 0}
    for ce in converged:
        if ce.confidence >= 0.90:
            confidence_buckets["0.90-1.00"] += 1
        elif ce.confidence >= 0.80:
            confidence_buckets["0.80-0.89"] += 1
        elif ce.confidence >= 0.70:
            confidence_buckets["0.70-0.79"] += 1
        else:
            confidence_buckets["below_0.70"] += 1

    # Platform participation: how many converged entities does each platform appear in
    platform_participation: dict[str, int] = {}
    for ce in converged:
        for platform in ce.perspectives:
            platform_participation[platform] = platform_participation.get(platform, 0) + 1

    platform_participation_sorted = dict(
        sorted(platform_participation.items(), key=lambda x: x[1], reverse=True)
    )

    # Cross-platform distribution: how many entities appear on N platforms
    platform_count_distribution: dict[str, int] = {}
    for ce in converged:
        key = f"{len(ce.perspectives)}_platforms"
        platform_count_distribution[key] = (
            platform_count_distribution.get(key, 0) + 1
        )

    platform_count_distribution = dict(
        sorted(platform_count_distribution.items())
    )

    return {
        "title": "CPT Convergence Statistics",
        "summary": {
            "total_raw_entities": result["raw_entity_count"],
            "total_converged_entities": result["converged_count"],
            "deduplication_ratio": f"{result['dedup_pct']}%",
            "cross_platform_entities": result["multi_platform_count"],
            "single_platform_entities": result["single_platform_count"],
            "avg_confidence": result["avg_confidence"],
            "avg_platforms_per_converged_entity": result["avg_platforms_per_entity"],
        },
        "before_convergence": {
            "total_entities": result["raw_entity_count"],
            "per_platform": result["platform_breakdown"],
        },
        "after_convergence": {
            "total_entities": result["converged_count"],
            "cross_platform": result["multi_platform_count"],
            "single_platform": result["single_platform_count"],
        },
        "by_entity_type": type_breakdown,
        "confidence_distribution": confidence_buckets,
        "platform_participation": platform_participation_sorted,
        "platform_count_distribution": platform_count_distribution,
        "processing_time_ms": result["processing_time_ms"],
    }
