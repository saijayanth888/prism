from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request

from app.graph.queries import get_topology

router = APIRouter()

MOCK_TOPOLOGY: dict[str, list] = {
    "nodes": [
        # ── Core Services (Kubernetes) ──
        {"id": "payments-svc", "label": "payments-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "payments", "environment": "prod", "healthScore": 92, "complianceScore": 78, "platforms": ["kubernetes", "datadog", "argocd", "sonarqube", "github"], "confidence": 0.95, "replicaCount": 3, "p99Latency": 42.1},
        {"id": "orders-svc", "label": "orders-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "orders", "environment": "prod", "healthScore": 75, "complianceScore": 68, "platforms": ["kubernetes", "datadog", "argocd", "github"], "confidence": 0.93, "replicaCount": 3, "p99Latency": 88.4},
        {"id": "inventory-svc", "label": "inventory-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "inventory", "environment": "prod", "healthScore": 45, "complianceScore": 55, "platforms": ["kubernetes", "datadog", "sonarqube"], "confidence": 0.91, "replicaCount": 2, "p99Latency": 210.3},
        {"id": "user-svc", "label": "user-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "auth", "environment": "prod", "healthScore": 94, "complianceScore": 88, "platforms": ["kubernetes", "datadog", "argocd", "vault"], "confidence": 0.97, "replicaCount": 4, "p99Latency": 18.7},
        {"id": "notification-svc", "label": "notification-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "notifications", "environment": "prod", "healthScore": 68, "complianceScore": 60, "platforms": ["kubernetes", "datadog"], "confidence": 0.89, "replicaCount": 2, "p99Latency": 125.6},
        {"id": "fraud-detector", "label": "fraud-detector", "entityType": "Service", "platform": "kubernetes", "namespace": "fraud", "environment": "prod", "healthScore": 96, "complianceScore": 92, "platforms": ["kubernetes", "datadog", "argocd", "vault", "sonarqube"], "confidence": 0.98, "replicaCount": 5, "p99Latency": 15.2},
        {"id": "kyc-verification", "label": "kyc-verification", "entityType": "Service", "platform": "kubernetes", "namespace": "kyc", "environment": "prod", "healthScore": 87, "complianceScore": 91, "platforms": ["kubernetes", "datadog", "servicenow"], "confidence": 0.94, "replicaCount": 3, "p99Latency": 340.8},
        {"id": "analytics-svc", "label": "analytics-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "analytics", "environment": "prod", "healthScore": 82, "complianceScore": 76, "platforms": ["kubernetes", "datadog"], "confidence": 0.90, "replicaCount": 2, "p99Latency": 95.1},
        {"id": "reporting-svc", "label": "reporting-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "analytics", "environment": "prod", "healthScore": 77, "complianceScore": 72, "platforms": ["kubernetes", "github"], "confidence": 0.88},
        {"id": "search-svc", "label": "search-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "catalog", "environment": "prod", "healthScore": 89, "complianceScore": 83, "platforms": ["kubernetes", "datadog"], "confidence": 0.92},
        {"id": "catalog-svc", "label": "catalog-svc", "entityType": "Service", "platform": "kubernetes", "namespace": "catalog", "environment": "prod", "healthScore": 91, "complianceScore": 85, "platforms": ["kubernetes", "datadog", "github"], "confidence": 0.94},
        {"id": "batch-scheduler", "label": "batch-scheduler", "entityType": "Service", "platform": "kubernetes", "namespace": "batch", "environment": "prod", "healthScore": 84, "complianceScore": 79, "platforms": ["kubernetes", "argocd"], "confidence": 0.87},
        {"id": "mobile-bff", "label": "mobile-bff", "entityType": "Service", "platform": "kubernetes", "namespace": "mobile", "environment": "prod", "healthScore": 90, "complianceScore": 86, "platforms": ["kubernetes", "datadog", "apiconnect"], "confidence": 0.93},
        # ── APIs (API Connect) ──
        {"id": "payments-api", "label": "payments-api", "entityType": "API", "platform": "apiconnect", "namespace": "payments", "environment": "prod", "healthScore": 88, "complianceScore": 82, "subscriptionCount": 247, "rateLimit": "5000/min"},
        {"id": "orders-api", "label": "orders-api", "entityType": "API", "platform": "apiconnect", "namespace": "orders", "environment": "prod", "healthScore": 80, "complianceScore": 72, "subscriptionCount": 183, "rateLimit": "1000/min"},
        {"id": "auth-api", "label": "auth-api", "entityType": "API", "platform": "apiconnect", "namespace": "auth", "environment": "prod", "healthScore": 97, "complianceScore": 95, "subscriptionCount": 512, "rateLimit": "500/min"},
        {"id": "gateway-prod", "label": "api-gateway-prod", "entityType": "API", "platform": "apiconnect", "namespace": "platform", "environment": "prod", "healthScore": 99, "complianceScore": 96},
        {"id": "fraud-api", "label": "fraud-screening-api", "entityType": "API", "platform": "apiconnect", "namespace": "fraud", "environment": "prod", "healthScore": 95, "complianceScore": 94, "subscriptionCount": 89, "rateLimit": "100/min"},
        # ── Databases (AWS) ──
        {"id": "payments-db", "label": "payments-postgres-prod", "entityType": "Database", "platform": "aws", "namespace": "payments", "environment": "prod", "healthScore": 99, "complianceScore": 91, "engine": "PostgreSQL 15.4", "multiAz": True, "storageGb": 500},
        {"id": "catalog-db", "label": "catalog-postgres-prod", "entityType": "Database", "platform": "aws", "namespace": "catalog", "environment": "prod", "healthScore": 97, "complianceScore": 88, "engine": "PostgreSQL 15.4", "multiAz": True, "storageGb": 250},
        {"id": "fraud-db", "label": "fraud-timescale-prod", "entityType": "Database", "platform": "aws", "namespace": "fraud", "environment": "prod", "healthScore": 98, "complianceScore": 93, "engine": "TimescaleDB 2.13", "multiAz": True, "storageGb": 1000},
        {"id": "analytics-db", "label": "analytics-redshift-prod", "entityType": "Database", "platform": "aws", "namespace": "analytics", "environment": "prod", "healthScore": 94, "complianceScore": 82, "engine": "Redshift Serverless", "storageGb": 2000},
        # ── Event Streaming (Confluent/Kafka) ──
        {"id": "kafka-payments", "label": "payments.events", "entityType": "Topic", "platform": "confluent", "namespace": "payments", "environment": "prod", "healthScore": 95, "partitions": 12, "consumerLag": 142},
        {"id": "kafka-orders", "label": "orders.events", "entityType": "Topic", "platform": "confluent", "namespace": "orders", "environment": "prod", "healthScore": 93, "partitions": 8, "consumerLag": 2340},
        {"id": "kafka-fraud", "label": "fraud.alerts", "entityType": "Topic", "platform": "confluent", "namespace": "fraud", "environment": "prod", "healthScore": 99, "partitions": 24, "consumerLag": 0},
        {"id": "kafka-audit", "label": "compliance.audit-log", "entityType": "Topic", "platform": "confluent", "namespace": "compliance", "environment": "prod", "healthScore": 100, "partitions": 6, "consumerLag": 0},
        # ── Repositories (GitHub) ──
        {"id": "payments-repo", "label": "acme/payments-svc", "entityType": "Repository", "platform": "github", "namespace": "payments", "healthScore": 88, "coverage": 87.2, "openPrs": 3},
        {"id": "orders-repo", "label": "acme/orders-svc", "entityType": "Repository", "platform": "github", "namespace": "orders", "healthScore": 82, "coverage": 72.1, "openPrs": 5},
        {"id": "fraud-repo", "label": "acme/fraud-detector", "entityType": "Repository", "platform": "github", "namespace": "fraud", "healthScore": 95, "coverage": 94.3, "openPrs": 1},
        {"id": "infra-repo", "label": "acme/platform-infra", "entityType": "Repository", "platform": "github", "namespace": "platform", "healthScore": 91, "coverage": 0, "openPrs": 2},
        # ── Deployments (ArgoCD) ──
        {"id": "payments-deploy", "label": "payments-svc@prod", "entityType": "Deployment", "platform": "argocd", "namespace": "payments", "environment": "prod", "healthScore": 92, "syncStatus": "Synced", "strategy": "BlueGreen"},
        {"id": "orders-deploy", "label": "orders-svc@prod", "entityType": "Deployment", "platform": "argocd", "namespace": "orders", "environment": "prod", "healthScore": 75, "syncStatus": "OutOfSync", "strategy": "RollingUpdate"},
        {"id": "fraud-deploy", "label": "fraud-detector@prod", "entityType": "Deployment", "platform": "argocd", "namespace": "fraud", "environment": "prod", "healthScore": 98, "syncStatus": "Synced", "strategy": "Canary"},
        # ── Container Images (Nexus + JFrog) ──
        {"id": "payments-image", "label": "registry.acme.io/payments-svc:v2.1.3", "entityType": "Image", "platform": "nexus", "namespace": "payments", "healthScore": 85, "scanPassed": True, "sizeMb": 182},
        {"id": "orders-image", "label": "registry.acme.io/orders-svc:v1.8.0", "entityType": "Image", "platform": "nexus", "namespace": "orders", "healthScore": 72, "scanPassed": False, "sizeMb": 245},
        {"id": "fraud-image-jfrog", "label": "artifactory.acme.io/fraud-detector:v3.0.1", "entityType": "Image", "platform": "jfrog", "namespace": "fraud", "healthScore": 99, "scanPassed": True, "sizeMb": 156},
        # ── CI/CD Pipelines (GitHub) ──
        {"id": "pipeline-payments", "label": "payments-ci", "entityType": "Pipeline", "platform": "github", "namespace": "payments", "healthScore": 90, "passRate": 97.2},
        {"id": "pipeline-fraud", "label": "fraud-ci", "entityType": "Pipeline", "platform": "github", "namespace": "fraud", "healthScore": 99, "passRate": 99.8},
        # ── Vulnerabilities (SonarQube) ──
        {"id": "cve-2024-001", "label": "CVE-2024-0001", "entityType": "Vulnerability", "platform": "sonarqube", "healthScore": 10, "severity": "critical", "affectedPackage": "log4j-core:2.14.1"},
        {"id": "cve-2024-142", "label": "CVE-2024-0142", "entityType": "Vulnerability", "platform": "sonarqube", "healthScore": 25, "severity": "high", "affectedPackage": "jackson-databind:2.13.0"},
        {"id": "cve-2025-003", "label": "CVE-2025-0003", "entityType": "Vulnerability", "platform": "sonarqube", "healthScore": 40, "severity": "medium", "affectedPackage": "spring-web:6.0.0"},
        # ── Infrastructure (Terraform) ──
        {"id": "tf-prod-infra", "label": "module.prod-infrastructure", "entityType": "Environment", "platform": "terraform", "environment": "prod", "healthScore": 88, "resourceCount": 47, "driftDetected": False},
        {"id": "tf-staging-infra", "label": "module.staging-infrastructure", "entityType": "Environment", "platform": "terraform", "environment": "staging", "healthScore": 82, "resourceCount": 31, "driftDetected": True},
        # ── Namespaces (Kubernetes) ──
        {"id": "prod-ns", "label": "prod", "entityType": "Namespace", "platform": "kubernetes", "healthScore": 88},
        {"id": "payments-ns", "label": "payments", "entityType": "Namespace", "platform": "kubernetes", "healthScore": 92},
        # ── Teams (Jira) ──
        {"id": "payments-team", "label": "payments-team", "entityType": "Team", "platform": "jira", "healthScore": 95, "velocity": 72, "openIssues": 14},
        {"id": "orders-team", "label": "orders-team", "entityType": "Team", "platform": "jira", "healthScore": 90, "velocity": 58, "openIssues": 23},
        {"id": "fraud-team", "label": "fraud-team", "entityType": "Team", "platform": "jira", "healthScore": 97, "velocity": 81, "openIssues": 6},
        {"id": "platform-team", "label": "platform-team", "entityType": "Team", "platform": "jira", "healthScore": 88, "velocity": 65, "openIssues": 19},
        # ── Secrets (Vault) ──
        {"id": "vault-payments-db", "label": "secret/prod/payments/db-credentials", "entityType": "Secret", "platform": "vault", "healthScore": 99, "rotated": True, "engineType": "database"},
        {"id": "vault-fraud-keys", "label": "secret/prod/fraud/api-keys", "entityType": "Secret", "platform": "vault", "healthScore": 95, "rotated": True, "engineType": "kv-v2"},
        {"id": "vault-auth-jwt", "label": "secret/prod/auth/jwt-signing", "entityType": "Secret", "platform": "vault", "healthScore": 100, "rotated": True, "engineType": "pki"},
        # ── ITSM / Compliance (ServiceNow) ──
        {"id": "pci-policy", "label": "PCI-DSS-v3.2", "entityType": "Policy", "platform": "servicenow", "healthScore": 78, "gapCount": 4},
        {"id": "soc2-policy", "label": "SOC2-CC6", "entityType": "Policy", "platform": "servicenow", "healthScore": 81, "gapCount": 3},
        {"id": "snow-payments", "label": "Payments Service", "entityType": "Application", "platform": "servicenow", "namespace": "payments", "healthScore": 92, "criticality": "1-Critical", "openIncidents": 1},
        {"id": "snow-fraud", "label": "Fraud Detection Service", "entityType": "Application", "platform": "servicenow", "namespace": "fraud", "healthScore": 96, "criticality": "1-Critical", "openIncidents": 0},
        # ── Documents (SharePoint) ──
        {"id": "sp-payments-runbook", "label": "Payments Service Runbook", "entityType": "Application", "platform": "sharepoint", "namespace": "payments", "healthScore": 85, "pageViews": 342},
        {"id": "sp-arch-overview", "label": "Platform Architecture Overview", "entityType": "Application", "platform": "sharepoint", "namespace": "platform", "healthScore": 90, "pageViews": 1205},
        # ── OpenShift Routes ──
        {"id": "os-payments-route", "label": "payments-svc.apps.acme.io", "entityType": "Deployment", "platform": "openshift", "namespace": "payments", "environment": "prod", "healthScore": 92},
        {"id": "os-fraud-route", "label": "fraud-detector.apps.acme.io", "entityType": "Deployment", "platform": "openshift", "namespace": "fraud", "environment": "prod", "healthScore": 97},
    ],
    "edges": [
        # ── Service Dependencies ──
        {"source": "orders-svc", "target": "payments-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 1.0},
        {"source": "orders-svc", "target": "inventory-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.95},
        {"source": "orders-svc", "target": "catalog-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.88},
        {"source": "payments-svc", "target": "fraud-detector", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.97},
        {"source": "payments-svc", "target": "user-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.92},
        {"source": "mobile-bff", "target": "payments-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.94},
        {"source": "mobile-bff", "target": "orders-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.94},
        {"source": "mobile-bff", "target": "user-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.94},
        {"source": "reporting-svc", "target": "analytics-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.9},
        {"source": "search-svc", "target": "catalog-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.95},
        {"source": "kyc-verification", "target": "user-svc", "relationshipType": "DEPENDS_ON", "platform": "kubernetes", "confidence": 0.96},
        # ── Data Storage ──
        {"source": "payments-svc", "target": "payments-db", "relationshipType": "STORED_IN", "platform": "aws", "confidence": 1.0},
        {"source": "catalog-svc", "target": "catalog-db", "relationshipType": "STORED_IN", "platform": "aws", "confidence": 1.0},
        {"source": "fraud-detector", "target": "fraud-db", "relationshipType": "STORED_IN", "platform": "aws", "confidence": 1.0},
        {"source": "analytics-svc", "target": "analytics-db", "relationshipType": "STORED_IN", "platform": "aws", "confidence": 0.95},
        # ── Secrets ──
        {"source": "payments-svc", "target": "vault-payments-db", "relationshipType": "USES_SECRET", "platform": "vault", "confidence": 0.98},
        {"source": "fraud-detector", "target": "vault-fraud-keys", "relationshipType": "USES_SECRET", "platform": "vault", "confidence": 0.98},
        {"source": "user-svc", "target": "vault-auth-jwt", "relationshipType": "USES_SECRET", "platform": "vault", "confidence": 1.0},
        # ── API Gateway ──
        {"source": "gateway-prod", "target": "payments-api", "relationshipType": "GATEWAY_FOR", "platform": "apiconnect", "confidence": 1.0},
        {"source": "gateway-prod", "target": "orders-api", "relationshipType": "GATEWAY_FOR", "platform": "apiconnect", "confidence": 1.0},
        {"source": "gateway-prod", "target": "auth-api", "relationshipType": "GATEWAY_FOR", "platform": "apiconnect", "confidence": 1.0},
        {"source": "gateway-prod", "target": "fraud-api", "relationshipType": "GATEWAY_FOR", "platform": "apiconnect", "confidence": 1.0},
        {"source": "payments-api", "target": "payments-svc", "relationshipType": "EXPOSES", "platform": "apiconnect", "confidence": 0.95},
        {"source": "orders-api", "target": "orders-svc", "relationshipType": "EXPOSES", "platform": "apiconnect", "confidence": 0.95},
        {"source": "auth-api", "target": "user-svc", "relationshipType": "EXPOSES", "platform": "apiconnect", "confidence": 0.95},
        {"source": "fraud-api", "target": "fraud-detector", "relationshipType": "EXPOSES", "platform": "apiconnect", "confidence": 0.95},
        # ── Event Streaming ──
        {"source": "payments-svc", "target": "kafka-payments", "relationshipType": "PUBLISHES_TO", "platform": "confluent", "confidence": 0.92},
        {"source": "orders-svc", "target": "kafka-orders", "relationshipType": "PUBLISHES_TO", "platform": "confluent", "confidence": 0.92},
        {"source": "fraud-detector", "target": "kafka-fraud", "relationshipType": "PUBLISHES_TO", "platform": "confluent", "confidence": 0.98},
        {"source": "notification-svc", "target": "kafka-payments", "relationshipType": "SUBSCRIBES_TO", "platform": "confluent", "confidence": 0.88},
        {"source": "notification-svc", "target": "kafka-orders", "relationshipType": "SUBSCRIBES_TO", "platform": "confluent", "confidence": 0.88},
        {"source": "analytics-svc", "target": "kafka-orders", "relationshipType": "SUBSCRIBES_TO", "platform": "confluent", "confidence": 0.85},
        {"source": "analytics-svc", "target": "kafka-payments", "relationshipType": "SUBSCRIBES_TO", "platform": "confluent", "confidence": 0.85},
        {"source": "analytics-svc", "target": "kafka-fraud", "relationshipType": "SUBSCRIBES_TO", "platform": "confluent", "confidence": 0.85},
        {"source": "fraud-detector", "target": "kafka-audit", "relationshipType": "PUBLISHES_TO", "platform": "confluent", "confidence": 0.99},
        # ── CI/CD (GitHub → Repo → Image → Service) ──
        {"source": "pipeline-payments", "target": "payments-repo", "relationshipType": "BUILT_FROM", "platform": "github", "confidence": 0.95},
        {"source": "pipeline-fraud", "target": "fraud-repo", "relationshipType": "BUILT_FROM", "platform": "github", "confidence": 0.95},
        {"source": "payments-repo", "target": "payments-svc", "relationshipType": "BUILT_FROM", "platform": "github", "confidence": 0.98},
        {"source": "orders-repo", "target": "orders-svc", "relationshipType": "BUILT_FROM", "platform": "github", "confidence": 0.98},
        {"source": "fraud-repo", "target": "fraud-detector", "relationshipType": "BUILT_FROM", "platform": "github", "confidence": 0.98},
        # ── Deployments ──
        {"source": "payments-deploy", "target": "payments-svc", "relationshipType": "DEPLOYED_TO", "platform": "argocd", "confidence": 1.0},
        {"source": "orders-deploy", "target": "orders-svc", "relationshipType": "DEPLOYED_TO", "platform": "argocd", "confidence": 1.0},
        {"source": "fraud-deploy", "target": "fraud-detector", "relationshipType": "DEPLOYED_TO", "platform": "argocd", "confidence": 1.0},
        # ── Images ──
        {"source": "payments-image", "target": "payments-svc", "relationshipType": "RUNS_IN", "platform": "nexus", "confidence": 0.9},
        {"source": "orders-image", "target": "orders-svc", "relationshipType": "RUNS_IN", "platform": "nexus", "confidence": 0.9},
        {"source": "fraud-image-jfrog", "target": "fraud-detector", "relationshipType": "RUNS_IN", "platform": "jfrog", "confidence": 0.92},
        # ── Vulnerabilities ──
        {"source": "cve-2024-001", "target": "inventory-svc", "relationshipType": "HAS_VULNERABILITY", "platform": "sonarqube", "confidence": 1.0},
        {"source": "cve-2024-142", "target": "orders-svc", "relationshipType": "HAS_VULNERABILITY", "platform": "sonarqube", "confidence": 0.95},
        {"source": "cve-2025-003", "target": "catalog-svc", "relationshipType": "HAS_VULNERABILITY", "platform": "sonarqube", "confidence": 0.88},
        # ── Team Ownership ──
        {"source": "payments-team", "target": "payments-svc", "relationshipType": "OWNS", "platform": "jira", "confidence": 1.0},
        {"source": "orders-team", "target": "orders-svc", "relationshipType": "OWNS", "platform": "jira", "confidence": 1.0},
        {"source": "fraud-team", "target": "fraud-detector", "relationshipType": "OWNS", "platform": "jira", "confidence": 1.0},
        {"source": "platform-team", "target": "gateway-prod", "relationshipType": "OWNS", "platform": "jira", "confidence": 0.95},
        # ── Compliance / ITSM ──
        {"source": "pci-policy", "target": "payments-svc", "relationshipType": "ENFORCES", "platform": "servicenow", "confidence": 0.95},
        {"source": "pci-policy", "target": "fraud-detector", "relationshipType": "ENFORCES", "platform": "servicenow", "confidence": 0.95},
        {"source": "soc2-policy", "target": "user-svc", "relationshipType": "ENFORCES", "platform": "servicenow", "confidence": 0.90},
        # ── Infrastructure (Terraform → Namespace) ──
        {"source": "tf-prod-infra", "target": "prod-ns", "relationshipType": "ENFORCES", "platform": "terraform", "confidence": 0.9},
        {"source": "tf-prod-infra", "target": "payments-ns", "relationshipType": "ENFORCES", "platform": "terraform", "confidence": 0.9},
        {"source": "payments-svc", "target": "payments-ns", "relationshipType": "BELONGS_TO", "platform": "kubernetes", "confidence": 1.0},
        # ── OpenShift Routes ──
        {"source": "os-payments-route", "target": "payments-svc", "relationshipType": "DEPLOYED_TO", "platform": "openshift", "confidence": 0.93},
        {"source": "os-fraud-route", "target": "fraud-detector", "relationshipType": "DEPLOYED_TO", "platform": "openshift", "confidence": 0.93},
        # ── ServiceNow CMDB ──
        {"source": "snow-payments", "target": "payments-svc", "relationshipType": "BELONGS_TO", "platform": "servicenow", "confidence": 0.85},
        {"source": "snow-fraud", "target": "fraud-detector", "relationshipType": "BELONGS_TO", "platform": "servicenow", "confidence": 0.85},
    ],
}


def _get_neo4j_client(request: Request):
    from app.config import get_settings
    from app.graph.client import Neo4jClient

    settings = get_settings()
    neo4j_driver = getattr(request.app.state, "neo4j_driver", None)
    if neo4j_driver is None:
        return None

    client = Neo4jClient(settings.neo4j_uri, settings.neo4j_user, settings.neo4j_password)
    client._driver = neo4j_driver
    return client


@router.get("")
async def topology(request: Request) -> dict[str, Any]:
    client = _get_neo4j_client(request)
    if client is None:
        return MOCK_TOPOLOGY

    try:
        tenant_id = getattr(request.state, "tenant_id", "demo")
        result = await get_topology(client, tenant_id=tenant_id)
        if not result["nodes"]:
            return MOCK_TOPOLOGY
        # Normalize platform field (nodes from DB store platforms as list)
        for node in result["nodes"]:
            if isinstance(node.get("platform"), list):
                node["platform"] = node["platform"][0] if node["platform"] else "unknown"
        # Filter edges to only those with both endpoints in the nodes list
        node_ids = {n["id"] for n in result["nodes"]}
        result["edges"] = [
            e for e in result["edges"]
            if e["source"] in node_ids and e["target"] in node_ids
        ]
        return result
    except Exception:
        return MOCK_TOPOLOGY


@router.get("/subgraph/{entity_id}")
async def subgraph(entity_id: str, request: Request) -> dict[str, Any]:
    from app.graph.queries import get_dependencies

    client = _get_neo4j_client(request)
    if client is None:
        # Return subset of mock data around the given entity
        related_edges = [
            e for e in MOCK_TOPOLOGY["edges"]
            if e["source"] == entity_id or e["target"] == entity_id
        ]
        related_ids = {entity_id}
        for e in related_edges:
            related_ids.add(e["source"])
            related_ids.add(e["target"])
        related_nodes = [n for n in MOCK_TOPOLOGY["nodes"] if n["id"] in related_ids]
        return {"nodes": related_nodes, "edges": related_edges}

    try:
        tenant_id = getattr(request.state, "tenant_id", "demo")
        deps_down = await get_dependencies(client, entity_id, "downstream", 2, tenant_id)
        deps_up = await get_dependencies(client, entity_id, "upstream", 2, tenant_id)
        all_deps = {d["id"]: d for d in deps_down + deps_up}
        return {"nodes": list(all_deps.values()), "entity_id": entity_id}
    except Exception:
        return {"nodes": [], "edges": []}
