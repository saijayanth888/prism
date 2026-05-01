"""
Synthetic data engine — generates realistic 16-platform mock data for CIO demos.
Key design: the SAME service appears with DIFFERENT names on each platform,
which is what the CPT Engine must resolve.
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone
from typing import Any

from app.cpt.models import (
    EntityType,
    Perspective,
    PerspectiveEdge,
    PerspectiveEntity,
    RelationshipType,
)

PROFILES: dict[str, dict] = {
    "small":  {"apps": 10,  "services_per_app": 3, "envs": ["dev", "prod"]},
    "medium": {"apps": 50,  "services_per_app": 5, "envs": ["dev", "staging", "prod"]},
    "large":  {"apps": 200, "services_per_app": 5, "envs": ["dev", "staging", "prod", "dr"]},
}

DOMAINS = [
    "payments", "lending", "accounts", "cards", "fraud", "kyc",
    "onboarding", "notifications", "reporting", "analytics",
    "authentication", "mobile", "web", "batch", "compliance",
]

SERVICE_PATTERNS: dict[str, list[str]] = {
    "payments":       ["payments-api", "payments-processor", "payments-worker", "refunds-api", "settlements-svc", "fx-converter"],
    "lending":        ["loans-api", "credit-scoring", "underwriting-engine", "loan-origination", "collections-svc", "interest-calculator"],
    "accounts":       ["accounts-api", "balance-service", "statements-generator", "account-events", "transaction-ledger"],
    "cards":          ["cards-api", "card-issuing", "card-activation", "pin-management", "card-controls", "rewards-engine"],
    "fraud":          ["fraud-detector", "fraud-rules-engine", "fraud-alerts", "fraud-ml-scorer", "transaction-monitor"],
    "kyc":            ["kyc-verification", "document-scanner", "identity-validator", "sanctions-checker", "biometric-api"],
    "onboarding":     ["onboarding-api", "customer-profile", "welcome-flow", "eligibility-checker"],
    "notifications":  ["notification-api", "email-sender", "sms-gateway", "push-notifier", "template-engine"],
    "reporting":      ["reporting-api", "report-generator", "data-export", "analytics-aggregator"],
    "analytics":      ["analytics-api", "event-tracker", "metrics-collector", "dashboard-api"],
    "authentication": ["auth-api", "token-service", "oauth-server", "mfa-service", "session-manager"],
    "mobile":         ["mobile-bff", "device-registry", "app-config-api", "force-update-svc"],
    "web":            ["web-bff", "frontend-api", "cdn-purge-svc", "static-asset-svc"],
    "batch":          ["batch-scheduler", "etl-pipeline", "data-sync-worker", "report-generator"],
    "compliance":     ["compliance-api", "audit-logger", "policy-engine", "evidence-collector"],
}

TEAM_NAMES = [
    "payments-team", "lending-team", "cards-team", "fraud-team", "platform-team",
    "kyc-team", "auth-team", "mobile-team", "data-team", "compliance-team",
]


def _rng(seed: int | None = None) -> random.Random:
    return random.Random(seed)


def _rand_dt(days_back: int = 90) -> datetime:
    delta = random.randint(0, days_back * 86400)
    return datetime.now(timezone.utc) - timedelta(seconds=delta)


def _health_score() -> float:
    return round(random.gauss(88, 8), 1)


def _compliance_score() -> float:
    # 15% chance of a gap (score < 75)
    if random.random() < 0.15:
        return round(random.uniform(55, 74), 1)
    return round(random.uniform(80, 100), 1)


class ApplicationSpec:
    """Ground truth for one application across all platforms."""

    def __init__(self, domain: str, service_name: str, env: str, index: int):
        self.domain = domain
        self.service_name = service_name
        self.env = env
        self.index = index
        self.version = random.randint(1, 4)
        self.team = random.choice(TEAM_NAMES)
        self.port = random.choice([8080, 8000, 3000, 5000, 8443])
        self.language = random.choice(["python", "java", "nodejs", "go", "kotlin"])
        self.health = _health_score()
        self.compliance = _compliance_score()
        self.last_deploy = _rand_dt(90)
        self.has_vulns = random.random() < 0.4
        self.replica_count = random.randint(2, 6)
        self.rps = round(random.uniform(10, 5000), 1)
        self.error_rate = round(random.uniform(0.01, 3.0), 2)

        # Dependency index: this service depends on these indices (within domain)
        self.depends_on_indices: list[int] = []

    # Platform-specific naming (intentionally different to test CPT)
    @property
    def k8s_name(self) -> str:
        return self.service_name  # "payments-api"

    @property
    def github_repo(self) -> str:
        return f"acme/{self.service_name}"  # "acme/payments-api"

    @property
    def api_connect_name(self) -> str:
        return f"{self.service_name}-api-v{self.version}"  # "payments-api-api-v2"

    @property
    def datadog_name(self) -> str:
        return f"{self.domain}.{self.service_name.replace('-', '_')}"  # "payments.payments_api"

    @property
    def argocd_name(self) -> str:
        return f"{self.env}-{self.domain}-{self.service_name.split('-')[0]}"  # "prod-payments-payments"

    @property
    def labels(self) -> dict[str, str]:
        return {
            "app": self.service_name,
            "domain": self.domain,
            "team": self.team,
            "env": self.env,
            "language": self.language,
        }


class MockDataEngine:
    """Generates interconnected mock Perspectives across 16 platforms."""

    def __init__(self, seed: int = 42):
        random.seed(seed)

    def generate_all_perspectives(
        self, profile: str = "medium", tenant_id: str = "demo"
    ) -> list[Perspective]:
        config = PROFILES.get(profile, PROFILES["medium"])
        apps = self._generate_app_specs(config)

        return [
            self._kubernetes_perspective(apps),
            self._github_perspective(apps),
            self._apiconnect_perspective(apps),
            self._datadog_perspective(apps),
            self._argocd_perspective(apps),
            self._confluent_perspective(apps),
            self._aws_perspective(apps),
            self._terraform_perspective(apps),
            self._servicenow_perspective(apps),
            self._jira_perspective(apps),
            self._vault_perspective(apps),
            self._sonarqube_perspective(apps),
            self._nexus_perspective(apps),
            self._sharepoint_perspective(apps),
            self._jfrog_perspective(apps),
            self._openshift_perspective(apps),
        ]

    def _generate_app_specs(self, config: dict) -> list[ApplicationSpec]:
        specs: list[ApplicationSpec] = []
        domain_pool = (DOMAINS * 10)[:config["apps"]]
        random.shuffle(domain_pool)

        for i, domain in enumerate(domain_pool):
            patterns = SERVICE_PATTERNS.get(domain, [f"{domain}-service"])
            for j in range(config["services_per_app"]):
                for env in config["envs"]:
                    name = patterns[j % len(patterns)]
                    spec = ApplicationSpec(domain, name, env, len(specs))
                    specs.append(spec)

        # Wire up dependencies (services depend on same-domain services)
        domain_groups: dict[str, list[ApplicationSpec]] = {}
        for s in specs:
            domain_groups.setdefault(f"{s.domain}-{s.env}", []).append(s)

        for group in domain_groups.values():
            for i, spec in enumerate(group):
                if i > 0 and random.random() < 0.6:
                    dep_idx = random.randint(0, i - 1)
                    spec.depends_on_indices.append(group[dep_idx].index)

        return specs

    def _make_entity(
        self,
        entity_id: str,
        name: str,
        platform: str,
        entity_type: EntityType,
        spec: ApplicationSpec,
        **extra_props,
    ) -> PerspectiveEntity:
        return PerspectiveEntity(
            entity_id=entity_id,
            name=name,
            platform=platform,
            entity_type=entity_type,
            namespace=spec.domain,
            environment=spec.env,
            labels=spec.labels,
            observed_at=_rand_dt(1),
            properties={
                "health_score": spec.health,
                "compliance_score": spec.compliance,
                "last_deployed": spec.last_deploy.isoformat(),
                **extra_props,
            },
        )

    # ─── Platform perspectives ────────────────────────────────────────────

    def _kubernetes_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        entities: list[PerspectiveEntity] = []
        edges: list[PerspectiveEdge] = []

        for spec in apps:
            eid = f"k8s-{spec.env}-{spec.domain}-{spec.service_name}"
            entities.append(self._make_entity(
                eid, spec.k8s_name, "kubernetes", EntityType.SERVICE, spec,
                replica_count=spec.replica_count,
                ports=[spec.port],
                requests_per_second=spec.rps,
                error_rate=spec.error_rate,
                namespace=spec.domain,
                container_image=f"registry.acme.io/{spec.service_name}:v{spec.version}.0.0",
                resource_limits={"cpu": "500m", "memory": "512Mi"},
            ))

            # Namespace entity
            ns_id = f"k8s-ns-{spec.env}-{spec.domain}"
            if not any(e.entity_id == ns_id for e in entities):
                entities.append(PerspectiveEntity(
                    entity_id=ns_id,
                    name=f"{spec.env}-{spec.domain}",
                    platform="kubernetes",
                    entity_type=EntityType.NAMESPACE,
                    namespace=spec.domain,
                    environment=spec.env,
                    labels={"domain": spec.domain, "env": spec.env},
                    observed_at=_rand_dt(1),
                    properties={},
                ))
            edges.append(PerspectiveEdge(
                source_id=eid,
                target_id=ns_id,
                relationship_type=RelationshipType.RUNS_IN,
                platform="kubernetes",
            ))

        # Dependency edges
        id_map = {spec.index: f"k8s-{spec.env}-{spec.domain}-{spec.service_name}" for spec in apps}
        for spec in apps:
            for dep_idx in spec.depends_on_indices:
                dep_id = id_map.get(dep_idx)
                src_id = id_map[spec.index]
                if dep_id and dep_id != src_id:
                    edges.append(PerspectiveEdge(
                        source_id=src_id,
                        target_id=dep_id,
                        relationship_type=RelationshipType.DEPENDS_ON,
                        platform="kubernetes",
                    ))

        return Perspective(
            platform="kubernetes",
            entities=entities,
            relationships=edges,
            authority_domains=["replica_count", "namespace", "container_image"],
        )

    def _github_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        entities: list[PerspectiveEntity] = []
        edges: list[PerspectiveEdge] = []
        seen: set[str] = set()

        for spec in apps:
            rid = f"gh-{spec.domain}-{spec.service_name}"
            if rid in seen:
                continue
            seen.add(rid)

            entities.append(self._make_entity(
                rid, spec.github_repo, "github", EntityType.REPOSITORY, spec,
                language=spec.language,
                branch_count=random.randint(3, 25),
                default_branch="main",
                open_prs=random.randint(0, 8),
                sast_findings=random.randint(0, 10) if spec.has_vulns else 0,
                coverage=round(random.uniform(65, 98), 1),
                last_commit_days_ago=random.randint(0, 14),
            ))

            # Pipeline entity
            pipe_id = f"gh-pipeline-{spec.domain}-{spec.service_name}"
            entities.append(PerspectiveEntity(
                entity_id=pipe_id,
                name=f"{spec.service_name}-ci",
                platform="github",
                entity_type=EntityType.PIPELINE,
                namespace=spec.domain,
                environment=spec.env,
                labels=spec.labels,
                observed_at=_rand_dt(1),
                properties={
                    "pass_rate": round(random.uniform(90, 99.5), 1),
                    "avg_duration_minutes": random.randint(3, 15),
                },
            ))
            edges.append(PerspectiveEdge(
                source_id=pipe_id,
                target_id=rid,
                relationship_type=RelationshipType.BUILT_FROM,
                platform="github",
            ))

        return Perspective(
            platform="github",
            entities=entities,
            relationships=edges,
            authority_domains=["source_code_url", "language", "sast_findings"],
        )

    def _apiconnect_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        entities: list[PerspectiveEntity] = []
        edges: list[PerspectiveEdge] = []
        seen: set[str] = set()

        # Only API-type services get an API Connect representation
        api_services = [s for s in apps if "api" in s.service_name][:len(apps) // 2 + 1]
        for spec in api_services:
            aid = f"apic-{spec.env}-{spec.service_name}-v{spec.version}"
            if aid in seen:
                continue
            seen.add(aid)

            entities.append(self._make_entity(
                aid, spec.api_connect_name, "apiconnect", EntityType.API, spec,
                api_version=f"v{spec.version}",
                subscription_count=random.randint(5, 500),
                gateway_url=f"https://gw.acme.io/{spec.domain}/{spec.service_name}",
                oauth_policy="oauth-default",
                rate_limit=f"{random.choice([100, 500, 1000, 5000])}/min",
                api_contract=f"/specs/{spec.service_name}-v{spec.version}.yaml",
            ))

        return Perspective(
            platform="apiconnect",
            entities=entities,
            relationships=edges,
            authority_domains=["api_contract", "subscription_count", "oauth_policy"],
        )

    def _datadog_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        entities: list[PerspectiveEntity] = []
        seen: set[str] = set()

        for spec in apps:
            did = f"dd-{spec.env}-{spec.domain}-{spec.service_name}"
            if did in seen:
                continue
            seen.add(did)

            entities.append(self._make_entity(
                did, spec.datadog_name, "datadog", EntityType.SERVICE, spec,
                apm_service_id=f"apm-{spec.service_name}",
                p99_latency=round(random.uniform(10, 350), 1),
                error_rate=spec.error_rate,
                throughput=spec.rps,
                avg_latency=round(random.uniform(5, 150), 1),
                alert_count=random.randint(0, 5),
                monitor_count=random.randint(2, 15),
            ))

        return Perspective(
            platform="datadog",
            entities=entities,
            relationships=[],
            authority_domains=["p99_latency", "error_rate", "throughput"],
        )

    def _argocd_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        entities: list[PerspectiveEntity] = []
        seen: set[str] = set()

        for spec in apps:
            aid = f"argo-{spec.env}-{spec.domain}-{spec.service_name}"
            if aid in seen:
                continue
            seen.add(aid)

            sync_status = random.choices(
                ["Synced", "OutOfSync", "Unknown"],
                weights=[85, 10, 5],
            )[0]
            entities.append(self._make_entity(
                aid, spec.argocd_name, "argocd", EntityType.DEPLOYMENT, spec,
                sync_status=sync_status,
                health_status=random.choice(["Healthy", "Progressing", "Degraded"]),
                deployment_strategy=random.choice(["RollingUpdate", "Recreate", "BlueGreen"]),
                git_revision=f"sha-{random.randint(1000000, 9999999)}",
            ))

        return Perspective(
            platform="argocd",
            entities=entities,
            relationships=[],
            authority_domains=["sync_status", "deployment_strategy"],
        )

    def _confluent_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        entities: list[PerspectiveEntity] = []
        edges: list[PerspectiveEdge] = []

        # Generate Kafka topics for event-driven services
        topic_producers: dict[str, list[str]] = {}
        topic_consumers: dict[str, list[str]] = {}

        for spec in apps:
            # Some services produce/consume events
            if random.random() < 0.4:
                topic = f"{spec.domain}-events"
                tid = f"kafka-topic-{spec.env}-{topic}"
                if not any(e.entity_id == tid for e in entities):
                    entities.append(PerspectiveEntity(
                        entity_id=tid,
                        name=topic,
                        platform="confluent",
                        entity_type=EntityType.TOPIC,
                        namespace=spec.domain,
                        environment=spec.env,
                        labels={"domain": spec.domain, "env": spec.env},
                        observed_at=_rand_dt(1),
                        properties={
                            "topic_partitions": random.randint(3, 24),
                            "replication_factor": 3,
                            "retention_ms": 604800000,
                            "consumer_lag": random.randint(0, 10000),
                            "schema_registry": f"schemas.acme.io/{topic}-value",
                        },
                    ))
                producer_id = f"k8s-{spec.env}-{spec.domain}-{spec.service_name}"
                edges.append(PerspectiveEdge(
                    source_id=producer_id,
                    target_id=tid,
                    relationship_type=RelationshipType.PUBLISHES_TO,
                    platform="confluent",
                ))

        return Perspective(
            platform="confluent",
            entities=entities,
            relationships=edges,
            authority_domains=["topic_partitions", "consumer_lag", "schema_registry"],
        )

    def _aws_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        entities: list[PerspectiveEntity] = []

        # Generate RDS instances and S3 buckets
        seen_dbs: set[str] = set()
        for spec in apps:
            db_id = f"aws-rds-{spec.env}-{spec.domain}"
            if db_id not in seen_dbs and random.random() < 0.3:
                seen_dbs.add(db_id)
                entities.append(PerspectiveEntity(
                    entity_id=db_id,
                    name=f"{spec.domain}-postgres-{spec.env}",
                    platform="aws",
                    entity_type=EntityType.DATABASE,
                    namespace=spec.domain,
                    environment=spec.env,
                    labels={"domain": spec.domain, "env": spec.env, "engine": "postgres"},
                    observed_at=_rand_dt(1),
                    properties={
                        "engine": "postgres",
                        "version": "15.4",
                        "instance_class": random.choice(["db.t3.medium", "db.r6g.large"]),
                        "multi_az": spec.env == "prod",
                        "storage_gb": random.choice([100, 250, 500]),
                    },
                ))

        return Perspective(
            platform="aws",
            entities=entities,
            relationships=[],
            authority_domains=["instance_class", "multi_az"],
        )

    def _terraform_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        # Terraform tracks infrastructure as IaC — mirror AWS but as IaC resources
        entities: list[PerspectiveEntity] = []
        seen: set[str] = set()

        for spec in apps:
            eid = f"tf-module-{spec.env}-{spec.domain}"
            if eid in seen:
                continue
            seen.add(eid)
            entities.append(PerspectiveEntity(
                entity_id=eid,
                name=f"module.{spec.domain}-{spec.env}",
                platform="terraform",
                entity_type=EntityType.ENVIRONMENT,
                namespace=spec.domain,
                environment=spec.env,
                labels={"domain": spec.domain, "env": spec.env},
                observed_at=_rand_dt(1),
                properties={
                    "workspace": spec.env,
                    "state_backend": "s3://acme-tf-state",
                    "resource_count": random.randint(10, 50),
                    "last_apply": _rand_dt(30).isoformat(),
                },
            ))

        return Perspective(
            platform="terraform",
            entities=entities,
            relationships=[],
            authority_domains=["workspace", "resource_count"],
        )

    def _servicenow_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        entities: list[PerspectiveEntity] = []
        seen: set[str] = set()

        for spec in apps:
            sid = f"snow-{spec.domain}-{spec.service_name}"
            if sid in seen:
                continue
            seen.add(sid)
            entities.append(self._make_entity(
                sid,
                f"{spec.service_name.replace('-', ' ').title()} Service",
                "servicenow",
                EntityType.APPLICATION,
                spec,
                cmdb_class="cmdb_ci_service",
                business_criticality=random.choice(["1-Critical", "2-High", "3-Medium", "4-Low"]),
                support_group=spec.team,
                open_incidents=random.randint(0, 5),
                change_requests=random.randint(0, 3),
            ))

        return Perspective(
            platform="servicenow",
            entities=entities,
            relationships=[],
            authority_domains=["business_criticality", "support_group"],
        )

    def _jira_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        entities: list[PerspectiveEntity] = []
        seen: set[str] = set()

        for spec in apps:
            pid = f"jira-proj-{spec.domain}"
            if pid in seen:
                continue
            seen.add(pid)
            entities.append(PerspectiveEntity(
                entity_id=pid,
                name=f"{spec.domain.upper()}",
                platform="jira",
                entity_type=EntityType.TEAM,
                namespace=spec.domain,
                labels={"domain": spec.domain, "team": spec.team},
                observed_at=_rand_dt(1),
                properties={
                    "project_key": spec.domain.upper()[:4],
                    "open_issues": random.randint(5, 80),
                    "velocity": random.randint(20, 80),
                    "sprint_goal": f"Q{random.randint(1,4)} delivery",
                    "team": spec.team,
                },
            ))

        return Perspective(
            platform="jira",
            entities=entities,
            relationships=[],
            authority_domains=["team"],
        )

    def _vault_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        entities: list[PerspectiveEntity] = []
        seen: set[str] = set()

        for spec in apps:
            vid = f"vault-secret-{spec.env}-{spec.domain}-{spec.service_name}"
            if vid in seen:
                continue
            seen.add(vid)
            entities.append(PerspectiveEntity(
                entity_id=vid,
                name=f"secret/{spec.env}/{spec.domain}/{spec.service_name}",
                platform="vault",
                entity_type=EntityType.SECRET,
                namespace=spec.domain,
                environment=spec.env,
                labels=spec.labels,
                observed_at=_rand_dt(1),
                properties={
                    "secret_path": f"secret/{spec.env}/{spec.domain}/{spec.service_name}",
                    "engine_type": random.choice(["kv-v2", "database", "pki"]),
                    "lease_duration": "768h",
                    "rotated": random.random() < 0.7,
                    "last_rotated": _rand_dt(30).isoformat(),
                },
            ))

        return Perspective(
            platform="vault",
            entities=entities,
            relationships=[],
            authority_domains=["secret_path", "engine_type"],
        )

    def _sonarqube_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        entities: list[PerspectiveEntity] = []
        seen: set[str] = set()

        for spec in apps:
            sid = f"sonar-{spec.domain}-{spec.service_name}"
            if sid in seen:
                continue
            seen.add(sid)

            quality_gate = "PASSED" if spec.compliance >= 75 else "FAILED"
            entities.append(self._make_entity(
                sid, spec.service_name, "sonarqube", EntityType.REPOSITORY, spec,
                quality_gate=quality_gate,
                code_coverage=round(random.uniform(60, 98), 1),
                vulnerabilities_count=random.randint(0, 8) if spec.has_vulns else 0,
                bugs_count=random.randint(0, 15),
                code_smells=random.randint(0, 50),
                duplicated_lines_pct=round(random.uniform(0, 12), 1),
                technical_debt_days=round(random.uniform(0.5, 20), 1),
            ))

        return Perspective(
            platform="sonarqube",
            entities=entities,
            relationships=[],
            authority_domains=["code_coverage", "quality_gate", "vulnerabilities_count"],
        )

    def _nexus_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        entities: list[PerspectiveEntity] = []
        seen: set[str] = set()

        for spec in apps:
            nid = f"nexus-img-{spec.domain}-{spec.service_name}-v{spec.version}"
            if nid in seen:
                continue
            seen.add(nid)

            entities.append(PerspectiveEntity(
                entity_id=nid,
                name=f"registry.acme.io/{spec.service_name}:v{spec.version}.0.0",
                platform="nexus",
                entity_type=EntityType.IMAGE,
                namespace=spec.domain,
                environment=spec.env,
                labels=spec.labels,
                observed_at=_rand_dt(1),
                properties={
                    "image_tag": f"v{spec.version}.0.0",
                    "digest": f"sha256:{random.randint(10**15, 10**16)}",
                    "size_mb": random.randint(80, 600),
                    "base_image": random.choice([
                        "python:3.12-slim", "eclipse-temurin:21-jre", "node:20-alpine", "golang:1.22-alpine"
                    ]),
                    "vulnerabilities_critical": random.randint(0, 3) if spec.has_vulns else 0,
                    "vulnerabilities_high": random.randint(0, 8) if spec.has_vulns else 0,
                    "scan_passed": not spec.has_vulns or random.random() < 0.6,
                },
            ))

        return Perspective(
            platform="nexus",
            entities=entities,
            relationships=[],
            authority_domains=["image_tag", "digest", "vulnerabilities_critical"],
        )

    def _sharepoint_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        """SharePoint: runbooks, architecture docs, wikis for services."""
        entities: list[PerspectiveEntity] = []
        seen: set[str] = set()

        for spec in apps:
            sid = f"sp-doc-{spec.domain}-{spec.service_name}"
            if sid in seen:
                continue
            seen.add(sid)

            doc_type = random.choice(["Runbook", "Architecture", "API Guide", "Onboarding"])
            entities.append(PerspectiveEntity(
                entity_id=sid,
                # SharePoint names things with title-case and spaces
                name=f"{spec.service_name.replace('-', ' ').title()} — {doc_type}",
                platform="sharepoint",
                entity_type=EntityType.APPLICATION,
                namespace=spec.domain,
                environment=spec.env,
                labels=spec.labels,
                observed_at=_rand_dt(1),
                properties={
                    "site_collection": f"https://acme.sharepoint.com/sites/{spec.domain}",
                    "document_url": f"https://acme.sharepoint.com/sites/{spec.domain}/Shared%20Documents/{spec.service_name}-{doc_type.lower().replace(' ', '-')}.docx",
                    "content_type": doc_type,
                    "last_modified_by": random.choice([
                        "alice.chen@acme.com", "bob.kumar@acme.com",
                        "carol.smith@acme.com", "david.jones@acme.com",
                    ]),
                    "classification": random.choice(["Internal", "Confidential", "Public"]),
                    "page_views": random.randint(5, 500),
                },
            ))

        return Perspective(
            platform="sharepoint",
            entities=entities,
            relationships=[],
            authority_domains=["document_url", "site_collection", "classification"],
        )

    def _jfrog_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        """JFrog Artifactory: Docker images as alternative to Nexus registry."""
        entities: list[PerspectiveEntity] = []
        seen: set[str] = set()

        for spec in apps:
            jid = f"jfrog-img-{spec.domain}-{spec.service_name}-v{spec.version}"
            if jid in seen:
                continue
            seen.add(jid)

            build_num = random.randint(100, 9999)
            entities.append(PerspectiveEntity(
                entity_id=jid,
                # JFrog uses full artifact path as name (different from Nexus)
                name=f"acme-docker-local/{spec.domain}/{spec.service_name}:{spec.version}.0.{build_num}",
                platform="jfrog",
                entity_type=EntityType.IMAGE,
                namespace=spec.domain,
                environment=spec.env,
                labels=spec.labels,
                observed_at=_rand_dt(1),
                properties={
                    "artifact_path": f"acme-docker-local/{spec.domain}/{spec.service_name}/{spec.version}.0.{build_num}",
                    "build_name": f"{spec.service_name}-pipeline",
                    "build_number": build_num,
                    "package_type": "docker",
                    "xray_violations": random.randint(0, 5) if spec.has_vulns else 0,
                    "download_count": random.randint(1, 200),
                },
            ))

        return Perspective(
            platform="jfrog",
            entities=entities,
            relationships=[],
            authority_domains=["artifact_path", "build_name", "xray_violations"],
        )

    def _openshift_perspective(self, apps: list[ApplicationSpec]) -> Perspective:
        """OpenShift: DeploymentConfigs and Routes (alternative to plain k8s)."""
        entities: list[PerspectiveEntity] = []
        edges: list[PerspectiveEdge] = []

        for spec in apps:
            eid = f"ocp-dc-{spec.env}-{spec.domain}-{spec.service_name}"
            # OpenShift project names use domain prefix (different from k8s namespace)
            project = f"{spec.env}-{spec.domain}"
            route_host = f"{spec.service_name}-{project}.apps.ocp.acme.io"

            entities.append(PerspectiveEntity(
                entity_id=eid,
                # OpenShift names match k8s but prefixed with project
                name=f"{project}/{spec.service_name}",
                platform="openshift",
                entity_type=EntityType.DEPLOYMENT,
                namespace=spec.domain,
                environment=spec.env,
                labels=spec.labels,
                observed_at=_rand_dt(1),
                properties={
                    "route_url": f"https://{route_host}",
                    "build_config": f"bc/{spec.service_name}",
                    "deployment_config": f"dc/{spec.service_name}",
                    "project_name": project,
                    "scc_policy": random.choice(["restricted", "anyuid", "privileged"]),
                    "replicas": spec.replica_count,
                },
            ))

            for dep_idx in spec.depends_on_indices:
                dep_spec = apps[dep_idx] if dep_idx < len(apps) else None
                if dep_spec:
                    dep_eid = f"ocp-dc-{dep_spec.env}-{dep_spec.domain}-{dep_spec.service_name}"
                    edges.append(PerspectiveEdge(
                        source_id=eid,
                        target_id=dep_eid,
                        relationship_type=RelationshipType.DEPENDS_ON,
                        platform="openshift",
                    ))

        return Perspective(
            platform="openshift",
            entities=entities,
            relationships=edges,
            authority_domains=["route_url", "build_config", "deployment_config", "scc_policy"],
        )
