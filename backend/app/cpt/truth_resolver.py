from __future__ import annotations

from typing import Any

from app.cpt.models import PerspectiveEntity

# Authority weights: platform → property → authority_score (0.0–1.0)
AUTHORITY_MATRIX: dict[str, dict[str, float]] = {
    "kubernetes": {
        "replica_count": 1.0,
        "namespace": 1.0,
        "container_image": 1.0,
        "resource_limits": 1.0,
        "service_name": 0.6,
        "labels": 0.8,
    },
    "datadog": {
        "p99_latency": 1.0,
        "error_rate": 1.0,
        "throughput": 1.0,
        "service_name": 0.5,
        "apm_service_id": 1.0,
    },
    "apiconnect": {
        "api_contract": 1.0,
        "subscription_count": 1.0,
        "oauth_policy": 1.0,
        "api_name": 0.9,
        "gateway_url": 1.0,
    },
    "github": {
        "source_code_url": 1.0,
        "branch_count": 1.0,
        "sast_findings": 1.0,
        "repo_name": 0.7,
        "default_branch": 1.0,
        "language": 0.9,
    },
    "argocd": {
        "sync_status": 1.0,
        "deployment_strategy": 1.0,
        "app_name": 0.6,
        "health_status": 1.0,
    },
    "confluent": {
        "topic_partitions": 1.0,
        "consumer_lag": 1.0,
        "schema_registry": 1.0,
        "topic_name": 0.8,
        "retention_ms": 1.0,
    },
    "sonarqube": {
        "code_coverage": 1.0,
        "quality_gate": 1.0,
        "vulnerabilities_count": 1.0,
        "bugs_count": 1.0,
    },
    "vault": {
        "secret_path": 1.0,
        "policy": 1.0,
        "engine_type": 1.0,
    },
    "aws": {
        "instance_class": 1.0,
        "multi_az": 1.0,
        "storage_gb": 1.0,
        "engine": 0.9,
        "version": 0.8,
        "availability_zone": 1.0,
    },
    "terraform": {
        "workspace": 1.0,
        "resource_count": 1.0,
        "state_backend": 1.0,
        "last_apply": 1.0,
        "drift_detected": 1.0,
    },
    "servicenow": {
        "business_criticality": 1.0,
        "support_group": 1.0,
        "cmdb_class": 1.0,
        "open_incidents": 1.0,
        "change_requests": 1.0,
    },
    "jira": {
        "project_key": 1.0,
        "velocity": 1.0,
        "sprint_goal": 1.0,
        "team": 0.9,
        "open_issues": 1.0,
    },
    "nexus": {
        "image_tag": 1.0,
        "digest": 1.0,
        "size_mb": 1.0,
        "base_image": 0.9,
        "vulnerabilities_critical": 1.0,
        "vulnerabilities_high": 1.0,
        "scan_passed": 1.0,
    },
    "sharepoint": {
        "document_url": 1.0,
        "site_collection": 1.0,
        "content_type": 1.0,
        "last_modified_by": 1.0,
        "classification": 1.0,
    },
    "jfrog": {
        "artifact_path": 1.0,
        "build_name": 1.0,
        "build_number": 1.0,
        "package_type": 1.0,
        "xray_violations": 1.0,
    },
    "openshift": {
        "route_url": 1.0,
        "build_config": 1.0,
        "deployment_config": 1.0,
        "project_name": 0.8,
        "scc_policy": 1.0,
    },
}

# Default authority weight for any platform not in matrix
DEFAULT_AUTHORITY = 0.5

# Name resolution priority: higher = more authoritative for canonical name
NAME_AUTHORITY: dict[str, float] = {
    "apiconnect": 0.9,
    "kubernetes": 0.8,
    "openshift": 0.8,
    "github": 0.75,
    "confluent": 0.8,
    "servicenow": 0.7,
    "aws": 0.6,
    "argocd": 0.6,
    "jira": 0.6,
    "datadog": 0.5,
    "terraform": 0.5,
    "nexus": 0.5,
    "jfrog": 0.5,
    "sharepoint": 0.4,
}


class TruthResolver:
    def resolve_properties(
        self, perspectives: dict[str, PerspectiveEntity]
    ) -> dict[str, Any]:
        """
        For each property, pick the value from the platform with
        the highest authority score for that property.
        """
        all_props: dict[str, list[tuple[float, Any]]] = {}

        for platform, entity in perspectives.items():
            platform_matrix = AUTHORITY_MATRIX.get(platform, {})
            for prop_key, prop_value in entity.properties.items():
                authority = platform_matrix.get(prop_key, DEFAULT_AUTHORITY)
                all_props.setdefault(prop_key, []).append((authority, prop_value))

        resolved: dict[str, Any] = {}
        for prop_key, authority_values in all_props.items():
            # Sort by authority descending, pick highest
            authority_values.sort(key=lambda x: x[0], reverse=True)
            resolved[prop_key] = authority_values[0][1]

        # Merge labels from all perspectives
        merged_labels: dict[str, str] = {}
        for entity in perspectives.values():
            merged_labels.update(entity.labels)
        if merged_labels:
            resolved["labels"] = merged_labels

        return resolved

    def choose_canonical_name(
        self, perspectives: dict[str, PerspectiveEntity]
    ) -> str:
        """Pick the best display name from all perspectives."""
        if not perspectives:
            return "unknown"

        # Use name authority weights
        best_authority = -1.0
        best_name = ""

        for platform, entity in perspectives.items():
            authority = NAME_AUTHORITY.get(platform, DEFAULT_AUTHORITY)
            if authority > best_authority:
                best_authority = authority
                best_name = entity.name

        return best_name or next(iter(perspectives.values())).name
