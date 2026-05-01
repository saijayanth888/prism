from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

router = APIRouter()

PLATFORMS = [
    {"id": "kubernetes", "name": "kubernetes", "entityCount": 48, "status": "synced", "lastSynced": "2 min ago"},
    {"id": "github", "name": "github", "entityCount": 32, "status": "synced", "lastSynced": "5 min ago"},
    {"id": "datadog", "name": "datadog", "entityCount": 24, "status": "synced", "lastSynced": "1 min ago"},
    {"id": "apiconnect", "name": "apiconnect", "entityCount": 18, "status": "synced", "lastSynced": "3 min ago"},
    {"id": "argocd", "name": "argocd", "entityCount": 21, "status": "synced", "lastSynced": "4 min ago"},
    {"id": "confluent", "name": "confluent", "entityCount": 15, "status": "synced", "lastSynced": "2 min ago"},
    {"id": "aws", "name": "aws", "entityCount": 29, "status": "syncing", "lastSynced": "12 min ago"},
    {"id": "terraform", "name": "terraform", "entityCount": 11, "status": "synced", "lastSynced": "8 min ago"},
    {"id": "servicenow", "name": "servicenow", "entityCount": 9, "status": "synced", "lastSynced": "15 min ago"},
    {"id": "jira", "name": "jira", "entityCount": 7, "status": "synced", "lastSynced": "10 min ago"},
    {"id": "vault", "name": "vault", "entityCount": 14, "status": "synced", "lastSynced": "6 min ago"},
    {"id": "sonarqube", "name": "sonarqube", "entityCount": 8, "status": "error", "lastSynced": "45 min ago"},
    {"id": "nexus", "name": "nexus", "entityCount": 11, "status": "synced", "lastSynced": "7 min ago"},
    {"id": "sharepoint", "name": "sharepoint", "entityCount": 22, "status": "synced", "lastSynced": "20 min ago"},
    {"id": "jfrog", "name": "jfrog", "entityCount": 16, "status": "synced", "lastSynced": "9 min ago"},
    {"id": "openshift", "name": "openshift", "entityCount": 31, "status": "synced", "lastSynced": "3 min ago"},
]

CONNECTOR_DETAILS = {
    # --- Container Orchestration ---
    "kubernetes": {
        "id": "kubernetes",
        "name": "Kubernetes",
        "displayName": "Kubernetes / K8s",
        "category": "Container Orchestration",
        "entityCount": 48,
        "entityTypes": ["Service", "Deployment", "Namespace", "Pod", "ConfigMap"],
        "status": "synced",
        "lastSynced": "2 min ago",
        "authMethod": "Service Account",
        "healthScore": 98,
        "description": "Discovers pods, services, deployments, namespaces, and config maps",
        "authorityDomains": ["replica_count", "namespace", "container_image"],
        "cptContribution": "Provides runtime topology and resource states",
    },
    "openshift": {
        "id": "openshift",
        "name": "OpenShift",
        "displayName": "Red Hat OpenShift",
        "category": "Container Orchestration",
        "entityCount": 31,
        "entityTypes": ["DeploymentConfig", "Route", "Project", "BuildConfig", "ImageStream"],
        "status": "synced",
        "lastSynced": "3 min ago",
        "authMethod": "OAuth Token",
        "healthScore": 96,
        "description": "Discovers OpenShift-specific resources including routes, projects, and build configs",
        "authorityDomains": ["route_host", "build_strategy", "project_quota"],
        "cptContribution": "Provides enterprise container platform topology and build pipeline states",
    },
    # --- CI/CD ---
    "github": {
        "id": "github",
        "name": "GitHub",
        "displayName": "GitHub Enterprise",
        "category": "CI/CD",
        "entityCount": 32,
        "entityTypes": ["Repository", "Workflow", "Action", "Team", "Branch"],
        "status": "synced",
        "lastSynced": "5 min ago",
        "authMethod": "GitHub App",
        "healthScore": 99,
        "description": "Discovers repositories, workflows, actions, teams, and branch protection rules",
        "authorityDomains": ["repo_owner", "branch_protection", "workflow_status"],
        "cptContribution": "Provides source code lineage and CI pipeline definitions",
    },
    "argocd": {
        "id": "argocd",
        "name": "ArgoCD",
        "displayName": "Argo CD",
        "category": "CI/CD",
        "entityCount": 21,
        "entityTypes": ["Application", "AppProject", "SyncPolicy", "Repository"],
        "status": "synced",
        "lastSynced": "4 min ago",
        "authMethod": "API Token",
        "healthScore": 97,
        "description": "Discovers GitOps applications, sync policies, and deployment targets",
        "authorityDomains": ["sync_status", "target_revision", "destination_namespace"],
        "cptContribution": "Provides GitOps deployment state and desired-vs-actual drift detection",
    },
    # --- Monitoring ---
    "datadog": {
        "id": "datadog",
        "name": "Datadog",
        "displayName": "Datadog APM & Infrastructure",
        "category": "Monitoring",
        "entityCount": 24,
        "entityTypes": ["Monitor", "Dashboard", "ServiceMap", "SLO", "Metric"],
        "status": "synced",
        "lastSynced": "1 min ago",
        "authMethod": "API Key + App Key",
        "healthScore": 100,
        "description": "Discovers monitors, dashboards, service maps, SLOs, and infrastructure metrics",
        "authorityDomains": ["alert_status", "slo_target", "error_rate", "latency_p99"],
        "cptContribution": "Provides observability signals, health status, and performance baselines",
    },
    # --- API Management ---
    "apiconnect": {
        "id": "apiconnect",
        "name": "API Connect",
        "displayName": "IBM API Connect",
        "category": "API Management",
        "entityCount": 18,
        "entityTypes": ["API", "Product", "Plan", "Subscription", "Gateway"],
        "status": "synced",
        "lastSynced": "3 min ago",
        "authMethod": "Client ID + Secret",
        "healthScore": 95,
        "description": "Discovers APIs, products, plans, subscriptions, and gateway configurations",
        "authorityDomains": ["api_version", "rate_limit", "endpoint_url", "consumer_org"],
        "cptContribution": "Provides API catalog, traffic policies, and consumer relationships",
    },
    # --- Event Streaming ---
    "confluent": {
        "id": "confluent",
        "name": "Confluent",
        "displayName": "Confluent (Kafka)",
        "category": "Event Streaming",
        "entityCount": 15,
        "entityTypes": ["Topic", "Schema", "Connector", "ConsumerGroup", "Cluster"],
        "status": "synced",
        "lastSynced": "2 min ago",
        "authMethod": "API Key",
        "healthScore": 94,
        "description": "Discovers Kafka topics, schemas, connectors, consumer groups, and cluster configs",
        "authorityDomains": ["partition_count", "replication_factor", "schema_version", "consumer_lag"],
        "cptContribution": "Provides event-driven architecture topology and data flow lineage",
    },
    # --- Cloud Infrastructure ---
    "aws": {
        "id": "aws",
        "name": "AWS",
        "displayName": "Amazon Web Services",
        "category": "Cloud Infrastructure",
        "entityCount": 29,
        "entityTypes": ["EC2", "S3", "RDS", "Lambda", "IAMRole", "VPC", "EKS"],
        "status": "syncing",
        "lastSynced": "12 min ago",
        "authMethod": "IAM Role (AssumeRole)",
        "healthScore": 87,
        "description": "Discovers EC2 instances, S3 buckets, RDS databases, Lambda functions, and IAM roles",
        "authorityDomains": ["instance_type", "region", "vpc_id", "security_group", "iam_policy"],
        "cptContribution": "Provides cloud infrastructure topology, IAM relationships, and resource configurations",
    },
    "terraform": {
        "id": "terraform",
        "name": "Terraform",
        "displayName": "HashiCorp Terraform",
        "category": "Cloud Infrastructure",
        "entityCount": 11,
        "entityTypes": ["Module", "Resource", "State", "Workspace", "Variable"],
        "status": "synced",
        "lastSynced": "8 min ago",
        "authMethod": "TFC API Token",
        "healthScore": 92,
        "description": "Discovers Terraform workspaces, modules, resources, and state files",
        "authorityDomains": ["resource_address", "provider", "state_serial", "workspace_name"],
        "cptContribution": "Provides infrastructure-as-code definitions and planned-vs-actual state comparison",
    },
    # --- ITSM ---
    "servicenow": {
        "id": "servicenow",
        "name": "ServiceNow",
        "displayName": "ServiceNow ITSM",
        "category": "ITSM",
        "entityCount": 9,
        "entityTypes": ["CI", "Incident", "ChangeRequest", "CMDB_Entry", "ServiceOffering"],
        "status": "synced",
        "lastSynced": "15 min ago",
        "authMethod": "OAuth 2.0",
        "healthScore": 91,
        "description": "Discovers CMDB configuration items, incidents, change requests, and service offerings",
        "authorityDomains": ["ci_class", "operational_status", "change_type", "assignment_group"],
        "cptContribution": "Provides ITSM context, change history, and configuration item relationships",
    },
    # --- Project Management ---
    "jira": {
        "id": "jira",
        "name": "Jira",
        "displayName": "Atlassian Jira",
        "category": "Project Management",
        "entityCount": 7,
        "entityTypes": ["Project", "Epic", "Story", "Sprint", "Board"],
        "status": "synced",
        "lastSynced": "10 min ago",
        "authMethod": "API Token",
        "healthScore": 93,
        "description": "Discovers projects, epics, stories, sprints, and board configurations",
        "authorityDomains": ["project_key", "issue_status", "sprint_goal", "assignee"],
        "cptContribution": "Provides work-item traceability linking features to services and deployments",
    },
    # --- Security ---
    "vault": {
        "id": "vault",
        "name": "Vault",
        "displayName": "HashiCorp Vault",
        "category": "Security",
        "entityCount": 14,
        "entityTypes": ["SecretEngine", "Policy", "AuthMethod", "Token", "PKICert"],
        "status": "synced",
        "lastSynced": "6 min ago",
        "authMethod": "AppRole",
        "healthScore": 99,
        "description": "Discovers secret engines, policies, auth methods, and PKI certificates",
        "authorityDomains": ["secret_path", "policy_name", "auth_backend", "cert_expiry"],
        "cptContribution": "Provides secrets management topology and credential rotation status",
    },
    "sonarqube": {
        "id": "sonarqube",
        "name": "SonarQube",
        "displayName": "SonarQube / SonarCloud",
        "category": "Security",
        "entityCount": 8,
        "entityTypes": ["Project", "QualityGate", "QualityProfile", "Issue", "Hotspot"],
        "status": "error",
        "lastSynced": "45 min ago",
        "authMethod": "User Token",
        "healthScore": 42,
        "description": "Discovers code quality projects, quality gates, security hotspots, and vulnerability issues",
        "authorityDomains": ["quality_gate_status", "coverage_pct", "vulnerability_count", "code_smell_count"],
        "cptContribution": "Provides code quality signals, security vulnerability context, and tech debt metrics",
    },
    # --- Artifact Management ---
    "nexus": {
        "id": "nexus",
        "name": "Nexus",
        "displayName": "Sonatype Nexus Repository",
        "category": "Artifact Management",
        "entityCount": 11,
        "entityTypes": ["Repository", "Component", "Asset", "BlobStore", "RoutingRule"],
        "status": "synced",
        "lastSynced": "7 min ago",
        "authMethod": "API Token",
        "healthScore": 90,
        "description": "Discovers repositories, components, assets, and blob store configurations",
        "authorityDomains": ["artifact_version", "repository_format", "group_id", "blob_store"],
        "cptContribution": "Provides artifact lineage linking built components to source repos and deployments",
    },
    "jfrog": {
        "id": "jfrog",
        "name": "JFrog Artifactory",
        "displayName": "JFrog Artifactory",
        "category": "Artifact Management",
        "entityCount": 16,
        "entityTypes": ["Repository", "Build", "Artifact", "Permission", "Xray_Policy"],
        "status": "synced",
        "lastSynced": "9 min ago",
        "authMethod": "Access Token",
        "healthScore": 95,
        "description": "Discovers repositories, builds, artifacts, permissions, and Xray security policies",
        "authorityDomains": ["artifact_path", "build_number", "xray_severity", "package_type"],
        "cptContribution": "Provides universal artifact management, build info, and security scanning results",
    },
    # --- Document Management ---
    "sharepoint": {
        "id": "sharepoint",
        "name": "SharePoint",
        "displayName": "Microsoft SharePoint",
        "category": "Document Management",
        "entityCount": 22,
        "entityTypes": ["Site", "DocumentLibrary", "List", "Page", "Permission"],
        "status": "synced",
        "lastSynced": "20 min ago",
        "authMethod": "Azure AD App Registration",
        "healthScore": 88,
        "description": "Discovers SharePoint sites, document libraries, lists, pages, and permission sets",
        "authorityDomains": ["site_url", "library_name", "content_type", "sharing_scope"],
        "cptContribution": "Provides document and knowledge base topology linked to teams and projects",
    },
}


@router.get("")
async def list_connectors(request: Request):
    return {"platforms": PLATFORMS, "total": len(PLATFORMS)}


@router.get("/{connector_id}/status")
async def connector_status(connector_id: str):
    platform = next((p for p in PLATFORMS if p["id"] == connector_id), None)
    if not platform:
        return {"error": "connector not found"}
    return platform


@router.get("/{connector_id}/details")
async def connector_details(connector_id: str):
    """Return rich detail for a specific connector including entity types, auth, and CPT contribution."""
    detail = CONNECTOR_DETAILS.get(connector_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Connector '{connector_id}' not found. Available: {list(CONNECTOR_DETAILS.keys())}")
    return detail


@router.post("/{connector_id}/sync")
async def trigger_sync(connector_id: str, request: Request):
    platform = next((p for p in PLATFORMS if p["id"] == connector_id), None)
    if not platform:
        return {"error": "connector not found"}
    return {"connector_id": connector_id, "status": "sync_started", "message": f"Sync triggered for {connector_id}"}
