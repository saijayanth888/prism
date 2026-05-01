from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request

router = APIRouter()

# ---------------------------------------------------------------------------
# Mock reports with sparkline-compatible time series (7 data points = 7 days)
# ---------------------------------------------------------------------------

MOCK_REPORTS: dict[str, dict[str, Any]] = {
    "executive-summary": {
        "id": "executive-summary",
        "title": "Executive Summary",
        "description": "Overall platform health, entity count, convergence statistics, and risk posture across all monitored systems.",
        "category": "overview",
        "generated_at": "2026-04-30T23:00:00Z",
        "data": {
            "total_entities": 247,
            "total_relationships": 312,
            "platforms_connected": 13,
            "convergence_rate": 94.7,
            "convergence_trend": [91.2, 92.0, 92.8, 93.1, 93.9, 94.3, 94.7],
            "avg_health_score": 81.4,
            "health_trend": [78.2, 79.1, 79.8, 80.3, 80.9, 81.1, 81.4],
            "overall_risk": "moderate",
            "risk_score": 42.6,
            "risk_trend": [48.1, 46.9, 45.3, 44.8, 43.7, 43.1, 42.6],
            "critical_entities": 3,
            "critical_entities_trend": [6, 5, 5, 4, 4, 3, 3],
            "compliance_score": 74.2,
            "compliance_trend": [68.5, 69.8, 70.4, 71.2, 72.1, 73.5, 74.2],
            "top_risks": [
                {"entity": "inventory-svc", "risk": "Health score critically low (45)", "severity": "high"},
                {"entity": "notification-svc", "risk": "Below SLA health threshold (68)", "severity": "medium"},
                {"entity": "orders-svc", "risk": "Degraded performance, compliance gaps", "severity": "medium"},
            ],
            "highlights": [
                "Platform convergence rate improved 3.5% over 7 days",
                "3 critical entities remain, down from 6 last week",
                "Average health score trending upward (+3.2 points)",
                "Compliance posture strengthened across PCI and SOC2 frameworks",
            ],
        },
    },
    "compliance-posture": {
        "id": "compliance-posture",
        "title": "Compliance Posture",
        "description": "Framework compliance scores, gap analysis, and remediation trends across regulatory standards.",
        "category": "compliance",
        "generated_at": "2026-04-30T23:00:00Z",
        "data": {
            "overall_score": 74.2,
            "overall_trend": [68.5, 69.8, 70.4, 71.2, 72.1, 73.5, 74.2],
            "frameworks": [
                {
                    "name": "PCI-DSS v3.2",
                    "score": 82.5,
                    "trend": [76.0, 77.5, 78.2, 79.8, 80.5, 81.3, 82.5],
                    "status": "partial",
                    "total_controls": 48,
                    "passing_controls": 40,
                    "failing_controls": 5,
                    "not_assessed": 3,
                    "gaps": [
                        {"control": "6.5.1", "description": "Input validation on payment endpoints", "severity": "high", "entity": "payments-api"},
                        {"control": "6.5.3", "description": "Insecure cryptographic storage", "severity": "medium", "entity": "payments-svc"},
                        {"control": "8.2.3", "description": "Password complexity requirements", "severity": "low", "entity": "user-svc"},
                        {"control": "10.2.4", "description": "Invalid logical access attempts logging", "severity": "medium", "entity": "auth-api"},
                        {"control": "11.5", "description": "File integrity monitoring", "severity": "high", "entity": "payments-db"},
                    ],
                },
                {
                    "name": "SOC2 Type II",
                    "score": 78.9,
                    "trend": [72.3, 73.8, 74.5, 75.9, 76.8, 77.6, 78.9],
                    "status": "partial",
                    "total_controls": 62,
                    "passing_controls": 49,
                    "failing_controls": 8,
                    "not_assessed": 5,
                    "gaps": [
                        {"control": "CC6.1", "description": "Logical access security", "severity": "medium", "entity": "gateway-prod"},
                        {"control": "CC6.3", "description": "Role-based access control", "severity": "high", "entity": "user-svc"},
                        {"control": "CC7.2", "description": "System monitoring", "severity": "medium", "entity": "orders-svc"},
                    ],
                },
                {
                    "name": "HIPAA 164.312",
                    "score": 58.3,
                    "trend": [52.0, 53.5, 54.8, 55.6, 56.9, 57.4, 58.3],
                    "status": "failing",
                    "total_controls": 24,
                    "passing_controls": 14,
                    "failing_controls": 7,
                    "not_assessed": 3,
                    "gaps": [
                        {"control": "164.312(a)(1)", "description": "Access control - unique user IDs", "severity": "high", "entity": "user-svc"},
                        {"control": "164.312(a)(2)(iv)", "description": "Encryption and decryption", "severity": "critical", "entity": "payments-db"},
                        {"control": "164.312(b)", "description": "Audit controls", "severity": "high", "entity": "analytics-svc"},
                    ],
                },
                {
                    "name": "ISO 27001",
                    "score": 71.6,
                    "trend": [66.0, 67.2, 68.0, 69.1, 70.0, 70.8, 71.6],
                    "status": "partial",
                    "total_controls": 114,
                    "passing_controls": 82,
                    "failing_controls": 21,
                    "not_assessed": 11,
                    "gaps": [],
                },
            ],
            "remediation_velocity": {
                "closed_this_week": 7,
                "opened_this_week": 3,
                "net_change": -4,
                "avg_resolution_days": 4.2,
                "trend": [12, 10, 8, 9, 6, 5, 4],
            },
        },
    },
    "platform-health": {
        "id": "platform-health",
        "title": "Platform Health",
        "description": "Per-platform health metrics, mean time to recovery (MTTR), incident counts, and uptime tracking.",
        "category": "operations",
        "generated_at": "2026-04-30T23:00:00Z",
        "data": {
            "avg_health_score": 81.4,
            "health_trend": [78.2, 79.1, 79.8, 80.3, 80.9, 81.1, 81.4],
            "total_incidents_7d": 12,
            "incidents_trend": [4, 3, 2, 1, 0, 1, 1],
            "mttr_hours": 2.3,
            "mttr_trend": [4.1, 3.8, 3.5, 3.1, 2.8, 2.5, 2.3],
            "uptime_percent": 99.94,
            "uptime_trend": [99.87, 99.89, 99.91, 99.92, 99.93, 99.94, 99.94],
            "platforms": [
                {"name": "kubernetes", "health_score": 84, "entities": 42, "incidents_7d": 3, "mttr_hours": 1.8, "uptime": 99.97, "trend": [80, 81, 82, 83, 83, 84, 84]},
                {"name": "aws", "health_score": 96, "entities": 18, "incidents_7d": 0, "mttr_hours": 0.5, "uptime": 99.99, "trend": [94, 95, 95, 96, 96, 96, 96]},
                {"name": "apiconnect", "health_score": 91, "entities": 14, "incidents_7d": 1, "mttr_hours": 1.2, "uptime": 99.98, "trend": [87, 88, 89, 90, 90, 91, 91]},
                {"name": "confluent", "health_score": 93, "entities": 12, "incidents_7d": 1, "mttr_hours": 0.8, "uptime": 99.99, "trend": [90, 91, 92, 92, 93, 93, 93]},
                {"name": "github", "health_score": 88, "entities": 28, "incidents_7d": 0, "mttr_hours": 0.0, "uptime": 100.0, "trend": [85, 86, 86, 87, 87, 88, 88]},
                {"name": "argocd", "health_score": 82, "entities": 15, "incidents_7d": 2, "mttr_hours": 2.1, "uptime": 99.95, "trend": [78, 79, 80, 80, 81, 81, 82]},
                {"name": "sonarqube", "health_score": 76, "entities": 22, "incidents_7d": 1, "mttr_hours": 3.5, "uptime": 99.92, "trend": [72, 73, 74, 74, 75, 76, 76]},
                {"name": "datadog", "health_score": 95, "entities": 35, "incidents_7d": 0, "mttr_hours": 0.0, "uptime": 100.0, "trend": [93, 94, 94, 95, 95, 95, 95]},
                {"name": "vault", "health_score": 99, "entities": 8, "incidents_7d": 0, "mttr_hours": 0.0, "uptime": 100.0, "trend": [98, 99, 99, 99, 99, 99, 99]},
                {"name": "servicenow", "health_score": 72, "entities": 10, "incidents_7d": 2, "mttr_hours": 5.1, "uptime": 99.88, "trend": [68, 69, 70, 70, 71, 71, 72]},
                {"name": "jira", "health_score": 90, "entities": 16, "incidents_7d": 0, "mttr_hours": 0.0, "uptime": 100.0, "trend": [88, 88, 89, 89, 90, 90, 90]},
                {"name": "terraform", "health_score": 88, "entities": 9, "incidents_7d": 1, "mttr_hours": 1.4, "uptime": 99.96, "trend": [84, 85, 86, 87, 87, 88, 88]},
                {"name": "nexus", "health_score": 85, "entities": 18, "incidents_7d": 1, "mttr_hours": 2.0, "uptime": 99.94, "trend": [82, 83, 83, 84, 84, 85, 85]},
            ],
            "top_incidents": [
                {"id": "INC-4281", "entity": "inventory-svc", "platform": "kubernetes", "severity": "P1", "title": "Pod crash loop - OOMKilled", "duration_hours": 1.2, "resolved": True},
                {"id": "INC-4279", "entity": "notification-svc", "platform": "kubernetes", "severity": "P2", "title": "High latency on event processing", "duration_hours": 3.5, "resolved": True},
                {"id": "INC-4283", "entity": "orders-deploy", "platform": "argocd", "severity": "P2", "title": "Deployment sync failure", "duration_hours": 0.8, "resolved": True},
            ],
        },
    },
    "security-posture": {
        "id": "security-posture",
        "title": "Security Posture",
        "description": "CVE tracking, critical vulnerability assessment, SBOM coverage, and secret rotation compliance.",
        "category": "security",
        "generated_at": "2026-04-30T23:00:00Z",
        "data": {
            "total_cves": 23,
            "cve_trend": [31, 29, 27, 26, 25, 24, 23],
            "critical_vulns": 2,
            "critical_trend": [5, 4, 4, 3, 3, 2, 2],
            "high_vulns": 7,
            "medium_vulns": 9,
            "low_vulns": 5,
            "sbom_coverage_percent": 87.3,
            "sbom_trend": [80.1, 81.5, 83.0, 84.2, 85.5, 86.4, 87.3],
            "secret_rotation_compliance_percent": 92.1,
            "secret_rotation_trend": [85.0, 86.5, 88.0, 89.2, 90.1, 91.3, 92.1],
            "mean_time_to_remediate_days": 3.8,
            "mttr_vuln_trend": [6.2, 5.8, 5.3, 4.9, 4.5, 4.1, 3.8],
            "critical_vulnerabilities": [
                {
                    "id": "CVE-2024-0001",
                    "title": "Remote code execution in log4j dependency",
                    "severity": "critical",
                    "cvss": 9.8,
                    "affected_entity": "inventory-svc",
                    "affected_platform": "kubernetes",
                    "discovered_at": "2026-04-25T14:30:00Z",
                    "status": "remediation_in_progress",
                    "sla_hours_remaining": 12,
                },
                {
                    "id": "CVE-2024-0014",
                    "title": "SQL injection in query builder",
                    "severity": "critical",
                    "cvss": 9.1,
                    "affected_entity": "payments-db",
                    "affected_platform": "aws",
                    "discovered_at": "2026-04-28T09:15:00Z",
                    "status": "investigating",
                    "sla_hours_remaining": 36,
                },
            ],
            "vulnerability_by_severity": [
                {"severity": "critical", "count": 2, "trend": [5, 4, 4, 3, 3, 2, 2]},
                {"severity": "high", "count": 7, "trend": [10, 9, 9, 8, 8, 7, 7]},
                {"severity": "medium", "count": 9, "trend": [11, 11, 10, 10, 9, 9, 9]},
                {"severity": "low", "count": 5, "trend": [5, 5, 4, 5, 5, 6, 5]},
            ],
            "secrets_summary": {
                "total_secrets": 38,
                "rotated_on_time": 35,
                "overdue_rotation": 3,
                "overdue_secrets": [
                    {"name": "payments/db-credentials", "entity": "payments-svc", "last_rotated": "2026-03-15T00:00:00Z", "overdue_days": 46},
                    {"name": "orders/api-key", "entity": "orders-svc", "last_rotated": "2026-03-28T00:00:00Z", "overdue_days": 33},
                    {"name": "analytics/s3-access-key", "entity": "analytics-svc", "last_rotated": "2026-04-05T00:00:00Z", "overdue_days": 25},
                ],
            },
        },
    },
    "change-velocity": {
        "id": "change-velocity",
        "title": "Change Velocity",
        "description": "DORA metrics including deployment frequency, lead time for changes, change failure rate, and mean time to recovery.",
        "category": "engineering",
        "generated_at": "2026-04-30T23:00:00Z",
        "data": {
            "dora_rating": "High",
            "deployment_frequency": {
                "value": 18.4,
                "unit": "deploys/day",
                "trend": [14.2, 15.1, 15.8, 16.3, 17.0, 17.8, 18.4],
                "benchmark": "elite",
            },
            "lead_time_for_changes": {
                "value": 4.2,
                "unit": "hours",
                "trend": [6.8, 6.2, 5.7, 5.3, 4.9, 4.5, 4.2],
                "benchmark": "high",
            },
            "change_failure_rate": {
                "value": 3.8,
                "unit": "percent",
                "trend": [7.2, 6.5, 5.9, 5.3, 4.8, 4.2, 3.8],
                "benchmark": "elite",
            },
            "mean_time_to_recovery": {
                "value": 2.3,
                "unit": "hours",
                "trend": [4.1, 3.8, 3.5, 3.1, 2.8, 2.5, 2.3],
                "benchmark": "high",
            },
            "deployments_by_team": [
                {"team": "payments-team", "deploys_7d": 32, "success_rate": 96.9, "avg_lead_time_hours": 3.8, "trend": [3, 4, 5, 5, 4, 6, 5]},
                {"team": "orders-team", "deploys_7d": 28, "success_rate": 92.9, "avg_lead_time_hours": 5.1, "trend": [4, 3, 4, 5, 4, 4, 4]},
                {"team": "platform-team", "deploys_7d": 22, "success_rate": 100.0, "avg_lead_time_hours": 2.1, "trend": [2, 3, 3, 4, 3, 4, 3]},
                {"team": "analytics-team", "deploys_7d": 15, "success_rate": 93.3, "avg_lead_time_hours": 6.2, "trend": [1, 2, 2, 3, 2, 3, 2]},
                {"team": "catalog-team", "deploys_7d": 18, "success_rate": 94.4, "avg_lead_time_hours": 4.5, "trend": [2, 3, 2, 3, 3, 2, 3]},
            ],
            "recent_failures": [
                {"deployment": "orders-svc@prod", "timestamp": "2026-04-29T15:42:00Z", "reason": "Health check timeout", "rollback_time_min": 4.2, "team": "orders-team"},
                {"deployment": "analytics-svc@prod", "timestamp": "2026-04-28T11:18:00Z", "reason": "Config map mismatch", "rollback_time_min": 2.8, "team": "analytics-team"},
            ],
        },
    },
    "cost-analysis": {
        "id": "cost-analysis",
        "title": "Cost Analysis",
        "description": "Resource utilization, over-provisioned services, cost optimization opportunities, and spend trends.",
        "category": "finops",
        "generated_at": "2026-04-30T23:00:00Z",
        "data": {
            "total_monthly_cost_usd": 148520,
            "cost_trend": [152300, 151200, 150100, 149800, 149200, 148900, 148520],
            "projected_savings_usd": 18400,
            "resource_utilization_percent": 62.3,
            "utilization_trend": [58.1, 59.0, 59.8, 60.5, 61.2, 61.8, 62.3],
            "cost_by_platform": [
                {"platform": "aws", "monthly_cost": 52800, "percent_of_total": 35.6, "trend": [54200, 53800, 53400, 53100, 52900, 52800, 52800]},
                {"platform": "kubernetes", "monthly_cost": 38200, "percent_of_total": 25.7, "trend": [39800, 39500, 39100, 38800, 38500, 38300, 38200]},
                {"platform": "confluent", "monthly_cost": 18900, "percent_of_total": 12.7, "trend": [19500, 19300, 19200, 19100, 19000, 18900, 18900]},
                {"platform": "datadog", "monthly_cost": 14200, "percent_of_total": 9.6, "trend": [14200, 14200, 14200, 14200, 14200, 14200, 14200]},
                {"platform": "other", "monthly_cost": 24420, "percent_of_total": 16.4, "trend": [24600, 24500, 24400, 24400, 24400, 24400, 24420]},
            ],
            "over_provisioned": [
                {
                    "entity": "analytics-svc",
                    "resource": "CPU",
                    "allocated": "2000m",
                    "avg_used": "380m",
                    "utilization_percent": 19.0,
                    "potential_savings_usd": 4200,
                    "recommendation": "Reduce CPU limit to 800m",
                },
                {
                    "entity": "catalog-db",
                    "resource": "Memory",
                    "allocated": "16Gi",
                    "avg_used": "4.2Gi",
                    "utilization_percent": 26.3,
                    "potential_savings_usd": 3800,
                    "recommendation": "Downsize to db.r6g.large (8Gi)",
                },
                {
                    "entity": "notification-svc",
                    "resource": "Replicas",
                    "allocated": "5 replicas",
                    "avg_used": "1.2 replicas equivalent load",
                    "utilization_percent": 24.0,
                    "potential_savings_usd": 2800,
                    "recommendation": "Scale down to 2 replicas with HPA",
                },
                {
                    "entity": "search-svc",
                    "resource": "Storage",
                    "allocated": "500Gi",
                    "avg_used": "120Gi",
                    "utilization_percent": 24.0,
                    "potential_savings_usd": 1900,
                    "recommendation": "Reduce EBS volume to 200Gi",
                },
                {
                    "entity": "reporting-svc",
                    "resource": "CPU",
                    "allocated": "1000m",
                    "avg_used": "150m",
                    "utilization_percent": 15.0,
                    "potential_savings_usd": 2100,
                    "recommendation": "Reduce CPU limit to 400m",
                },
            ],
            "optimization_summary": {
                "total_opportunities": 12,
                "high_impact": 3,
                "medium_impact": 5,
                "low_impact": 4,
                "estimated_annual_savings_usd": 220800,
            },
        },
    },
}

# Ordered list for the reports index endpoint
MOCK_REPORT_INDEX: list[dict[str, Any]] = [
    {
        "id": r["id"],
        "title": r["title"],
        "description": r["description"],
        "category": r["category"],
        "generated_at": r["generated_at"],
    }
    for r in MOCK_REPORTS.values()
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("")
async def list_reports(request: Request) -> dict[str, Any]:
    """List all available reports with metadata (no payload data)."""
    # Reports are always generated from aggregated data.
    # When Neo4j is available, we could generate live reports;
    # for now, return mock index in both cases.
    return {"reports": MOCK_REPORT_INDEX, "total": len(MOCK_REPORT_INDEX)}


@router.get("/{report_id}")
async def get_report(report_id: str, request: Request) -> dict[str, Any]:
    """Retrieve a specific report with full data payload."""
    client = _get_neo4j_client(request)

    if client is not None:
        try:
            # Future: generate live report from Neo4j aggregate queries
            # For now, fall through to mock data
            pass
        except Exception:
            pass

    report = MOCK_REPORTS.get(report_id)
    if report is None:
        return {
            "error": "report_not_found",
            "message": f"Report '{report_id}' not found. Use GET /api/v1/reports to list available reports.",
            "available_reports": [r["id"] for r in MOCK_REPORT_INDEX],
        }

    return report
