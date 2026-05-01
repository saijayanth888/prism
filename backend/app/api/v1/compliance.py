from __future__ import annotations

from fastapi import APIRouter, Query, Request

router = APIRouter()

MOCK_COMPLIANCE_DASHBOARD = {
    "overall_score": 74.2,
    "policies": [
        {"name": "PCI-DSS", "version": "3.2.1", "score": 68, "total_controls": 12, "passing": 8, "failing": 4},
        {"name": "SOC2", "version": "2017", "score": 81, "total_controls": 15, "passing": 12, "failing": 3},
        {"name": "HIPAA", "version": "2013", "score": 73, "total_controls": 10, "passing": 7, "failing": 3},
    ],
    "top_risks": [
        {"entity": "inventory-svc", "policy": "PCI-DSS", "control": "6.5.1", "severity": "critical"},
        {"entity": "payments-svc", "policy": "HIPAA", "control": "164.312(a)", "severity": "high"},
        {"entity": "notification-svc", "policy": "SOC2", "control": "CC6.1", "severity": "medium"},
    ],
}

MOCK_GAPS = [
    {
        "id": "gap-001",
        "entity": "inventory-svc",
        "entity_type": "Service",
        "policy": "PCI-DSS",
        "control": "6.5.1",
        "description": "Missing input validation — SQL injection risk",
        "severity": "critical",
        "remediation": "Implement parameterized queries and input sanitization",
        "evidence": "SonarQube scan: 3 SQL injection vulnerabilities found",
        "since": "2024-11-15",
    },
    {
        "id": "gap-002",
        "entity": "payments-svc",
        "entity_type": "Service",
        "policy": "HIPAA",
        "control": "164.312(a)(1)",
        "description": "Access control logs not retained for 6 years",
        "severity": "high",
        "remediation": "Configure CloudWatch log retention to 6 years (2190 days)",
        "evidence": "Current retention: 90 days (required: 2190 days)",
        "since": "2024-10-01",
    },
    {
        "id": "gap-003",
        "entity": "notification-svc",
        "entity_type": "Service",
        "policy": "SOC2",
        "control": "CC6.1",
        "description": "Logical access controls not fully documented",
        "severity": "medium",
        "remediation": "Document all IAM roles and permissions in ServiceNow CMDB",
        "evidence": "ServiceNow: 12 undocumented roles found",
        "since": "2024-12-01",
    },
    {
        "id": "gap-004",
        "entity": "orders-svc",
        "entity_type": "Service",
        "policy": "PCI-DSS",
        "control": "2.2",
        "description": "Default service account credentials in use",
        "severity": "high",
        "remediation": "Rotate all service account credentials and use Vault for secret management",
        "evidence": "Vault scan: 2 services using default credentials",
        "since": "2025-01-05",
    },
    {
        "id": "gap-005",
        "entity": "payments-api",
        "entity_type": "API",
        "policy": "PCI-DSS",
        "control": "6.3",
        "description": "API endpoint lacks rate limiting — brute force risk",
        "severity": "medium",
        "remediation": "Enable API Connect rate limiting: 100 req/min per IP",
        "evidence": "API Connect audit: no rate limit policy attached to /payments/charge",
        "since": "2025-01-12",
    },
    {
        "id": "gap-006",
        "entity": "user-svc",
        "entity_type": "Service",
        "policy": "SOC2",
        "control": "CC7.2",
        "description": "Security monitoring alerts not configured",
        "severity": "medium",
        "remediation": "Configure Datadog monitors for anomalous login patterns",
        "evidence": "Datadog: no monitors configured for auth-related metrics",
        "since": "2025-01-20",
    },
]


@router.get("")
async def placeholder():
    return {"module": "compliance", "status": "active"}


@router.get("/dashboard")
async def compliance_dashboard(request: Request):
    return MOCK_COMPLIANCE_DASHBOARD


@router.get("/gaps")
async def compliance_gaps(
    severity: str | None = Query(None),
    policy: str | None = Query(None),
    entity: str | None = Query(None),
):
    gaps = list(MOCK_GAPS)
    if severity:
        gaps = [g for g in gaps if g["severity"] == severity]
    if policy:
        gaps = [g for g in gaps if g["policy"].lower() == policy.lower()]
    if entity:
        gaps = [g for g in gaps if entity.lower() in g["entity"].lower()]
    return {"gaps": gaps, "total": len(gaps)}


@router.get("/policies")
async def compliance_policies():
    return {
        "policies": [
            {"name": "PCI-DSS", "version": "3.2.1", "description": "Payment Card Industry Data Security Standard"},
            {"name": "SOC2", "version": "2017", "description": "Service Organization Control 2"},
            {"name": "HIPAA", "version": "2013", "description": "Health Insurance Portability and Accountability Act"},
        ]
    }
