from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

router = APIRouter()

MOCK_COMPLIANCE_DASHBOARD = {
    "overall_score": 73.0,  # average of all 8 frameworks: (68+81+73+71+83+67+79+62)/8 = 73.0
    "policies": [
        {"name": "PCI-DSS", "version": "3.2.1", "score": 68, "total_controls": 12, "passing": 8, "failing": 4},
        {"name": "SOC2", "version": "2017", "score": 81, "total_controls": 15, "passing": 12, "failing": 3},
        {"name": "HIPAA", "version": "2013", "score": 73, "total_controls": 10, "passing": 7, "failing": 3},
        {"name": "NIST 800-53", "version": "Rev 5", "score": 71, "total_controls": 20, "passing": 14, "failing": 6},
        {"name": "ISO 27001", "version": "2022", "score": 83, "total_controls": 18, "passing": 15, "failing": 3},
        {"name": "GDPR", "version": "2018", "score": 67, "total_controls": 8, "passing": 5, "failing": 3},
        {"name": "SOX", "version": "2002", "score": 79, "total_controls": 11, "passing": 9, "failing": 2},
        {"name": "FedRAMP", "version": "Rev 5", "score": 62, "total_controls": 25, "passing": 15, "failing": 10},
    ],
    "top_risks": [
        {"entity": "inventory-svc", "policy": "PCI-DSS", "control": "6.5.1", "severity": "critical"},
        {"entity": "payments-svc", "policy": "HIPAA", "control": "164.312(a)", "severity": "high"},
        {"entity": "notification-svc", "policy": "SOC2", "control": "CC6.1", "severity": "medium"},
        {"entity": "user-data-lake", "policy": "GDPR", "control": "Art. 17", "severity": "critical"},
        {"entity": "auth-gateway", "policy": "FedRAMP", "control": "IR-4", "severity": "critical"},
        {"entity": "billing-svc", "policy": "SOX", "control": "ITGC-CM-3", "severity": "high"},
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
    # --- NIST 800-53 gaps ---
    {
        "id": "gap-007",
        "entity": "platform-infra",
        "entity_type": "Infrastructure",
        "policy": "NIST 800-53",
        "control": "CA-7",
        "description": "Continuous monitoring controls not automated",
        "severity": "medium",
        "remediation": "Deploy automated OSCAP scanning via ArgoCD pipeline with Datadog integration",
        "evidence": "Manual review: CA-7 continuous monitoring relies on quarterly manual audits",
        "since": "2025-02-10",
    },
    {
        "id": "gap-008",
        "entity": "network-boundary",
        "entity_type": "Infrastructure",
        "policy": "NIST 800-53",
        "control": "CA-3",
        "description": "System boundary documentation incomplete",
        "severity": "high",
        "remediation": "Complete system interconnection agreements and update boundary diagrams in Confluence",
        "evidence": "Audit finding: 4 of 9 interconnection security agreements expired or missing",
        "since": "2025-01-28",
    },
    # --- ISO 27001 gaps ---
    {
        "id": "gap-009",
        "entity": "infosec-policy",
        "entity_type": "Policy",
        "policy": "ISO 27001",
        "control": "A.5.1",
        "description": "Information security policy review overdue",
        "severity": "medium",
        "remediation": "Schedule annual ISMS policy review with CISO and update document control register",
        "evidence": "Document control: last policy review completed 2024-01-15 (14 months overdue)",
        "since": "2025-03-15",
    },
    # --- GDPR gaps ---
    {
        "id": "gap-010",
        "entity": "user-data-lake",
        "entity_type": "DataStore",
        "policy": "GDPR",
        "control": "Art. 17",
        "description": "Data retention policy not enforced for PII",
        "severity": "critical",
        "remediation": "Implement automated PII purge jobs with 30-day TTL on S3 lifecycle policies",
        "evidence": "AWS S3 audit: 2.3M PII records older than retention period in user-data-lake bucket",
        "since": "2025-01-05",
    },
    {
        "id": "gap-011",
        "entity": "analytics-pipeline",
        "entity_type": "Service",
        "policy": "GDPR",
        "control": "Art. 35",
        "description": "Cross-border data transfer impact assessment missing",
        "severity": "high",
        "remediation": "Complete DPIA for EU-to-US data flows and implement Standard Contractual Clauses",
        "evidence": "DPO review: no DPIA on file for analytics-pipeline processing EU user data in us-east-1",
        "since": "2025-02-20",
    },
    # --- SOX gaps ---
    {
        "id": "gap-012",
        "entity": "billing-svc",
        "entity_type": "Service",
        "policy": "SOX",
        "control": "ITGC-CM-3",
        "description": "Change management audit trail incomplete",
        "severity": "high",
        "remediation": "Enforce Jira ticket linkage on all GitHub PRs and enable ServiceNow change request workflow",
        "evidence": "GitHub audit: 23% of production deployments in Q1 lack approved change request reference",
        "since": "2025-03-01",
    },
    # --- FedRAMP gaps ---
    {
        "id": "gap-013",
        "entity": "auth-gateway",
        "entity_type": "Service",
        "policy": "FedRAMP",
        "control": "IR-4",
        "description": "Incident response plan not tested in 12 months",
        "severity": "critical",
        "remediation": "Schedule tabletop exercise and full IR drill within 30 days; update IR playbooks",
        "evidence": "Last IR test: 2024-03-15 (13 months ago); FedRAMP requires annual testing",
        "since": "2025-03-15",
    },
    {
        "id": "gap-014",
        "entity": "fedramp-boundary",
        "entity_type": "Infrastructure",
        "policy": "FedRAMP",
        "control": "CA-5",
        "description": "POA&M items exceed remediation timeline",
        "severity": "high",
        "remediation": "Prioritize 8 overdue POA&M items; escalate to system owner for risk acceptance or remediation",
        "evidence": "POA&M tracker: 8 of 22 items past scheduled remediation date (avg 47 days overdue)",
        "since": "2025-02-28",
    },
]

# Detailed controls per framework for /compliance/frameworks/{framework}/controls
FRAMEWORK_CONTROLS = {
    "PCI-DSS": {
        "framework": "PCI-DSS",
        "version": "3.2.1",
        "description": "Payment Card Industry Data Security Standard",
        "controls": [
            {"id": "1.1", "title": "Establish firewall and router configuration standards", "status": "pass", "category": "Network Security"},
            {"id": "1.2", "title": "Restrict connections between untrusted networks and cardholder data", "status": "pass", "category": "Network Security"},
            {"id": "2.1", "title": "Change vendor-supplied defaults before installing on network", "status": "pass", "category": "System Configuration"},
            {"id": "2.2", "title": "Develop configuration standards for all system components", "status": "fail", "category": "System Configuration"},
            {"id": "3.4", "title": "Render PAN unreadable anywhere it is stored", "status": "pass", "category": "Data Protection"},
            {"id": "4.1", "title": "Use strong cryptography for transmission of cardholder data", "status": "pass", "category": "Encryption"},
            {"id": "6.3", "title": "Develop software applications in accordance with PCI DSS", "status": "fail", "category": "Application Security"},
            {"id": "6.5.1", "title": "Injection flaws, particularly SQL injection", "status": "fail", "category": "Application Security"},
            {"id": "8.1", "title": "Define and implement policies for user identification", "status": "pass", "category": "Access Control"},
            {"id": "10.1", "title": "Implement audit trails linking access to individual users", "status": "pass", "category": "Logging & Monitoring"},
            {"id": "11.2", "title": "Run internal and external vulnerability scans quarterly", "status": "fail", "category": "Vulnerability Management"},
            {"id": "12.1", "title": "Establish, publish, and maintain a security policy", "status": "pass", "category": "Policy"},
        ],
    },
    "SOC2": {
        "framework": "SOC2",
        "version": "2017",
        "description": "Service Organization Control 2",
        "controls": [
            {"id": "CC1.1", "title": "COSO principle: demonstrate commitment to integrity", "status": "pass", "category": "Control Environment"},
            {"id": "CC1.2", "title": "Board exercises oversight of internal controls", "status": "pass", "category": "Control Environment"},
            {"id": "CC2.1", "title": "Information to support internal control objectives", "status": "pass", "category": "Communication & Information"},
            {"id": "CC3.1", "title": "Entity specifies objectives with sufficient clarity", "status": "pass", "category": "Risk Assessment"},
            {"id": "CC3.2", "title": "Entity identifies risks to objectives across the entity", "status": "pass", "category": "Risk Assessment"},
            {"id": "CC4.1", "title": "Entity selects and develops ongoing monitoring activities", "status": "pass", "category": "Monitoring Activities"},
            {"id": "CC5.1", "title": "Entity selects and develops control activities", "status": "pass", "category": "Control Activities"},
            {"id": "CC5.2", "title": "Entity deploys control activities through policies", "status": "pass", "category": "Control Activities"},
            {"id": "CC6.1", "title": "Logical access security over protected information assets", "status": "fail", "category": "Logical & Physical Access"},
            {"id": "CC6.2", "title": "Prior to issuing system credentials, entity registers users", "status": "pass", "category": "Logical & Physical Access"},
            {"id": "CC6.3", "title": "Entity authorizes, modifies, or removes access", "status": "pass", "category": "Logical & Physical Access"},
            {"id": "CC7.1", "title": "Entity uses detection and monitoring to identify anomalies", "status": "pass", "category": "System Operations"},
            {"id": "CC7.2", "title": "Entity monitors system components for anomalies", "status": "fail", "category": "System Operations"},
            {"id": "CC8.1", "title": "Entity authorizes, designs, and implements changes", "status": "pass", "category": "Change Management"},
            {"id": "CC9.1", "title": "Entity identifies and assesses risk from vendors", "status": "fail", "category": "Risk Mitigation"},
        ],
    },
    "HIPAA": {
        "framework": "HIPAA",
        "version": "2013",
        "description": "Health Insurance Portability and Accountability Act",
        "controls": [
            {"id": "164.308(a)(1)", "title": "Security Management Process", "status": "pass", "category": "Administrative Safeguards"},
            {"id": "164.308(a)(3)", "title": "Workforce Security", "status": "pass", "category": "Administrative Safeguards"},
            {"id": "164.308(a)(4)", "title": "Information Access Management", "status": "pass", "category": "Administrative Safeguards"},
            {"id": "164.308(a)(5)", "title": "Security Awareness and Training", "status": "pass", "category": "Administrative Safeguards"},
            {"id": "164.310(a)", "title": "Facility Access Controls", "status": "pass", "category": "Physical Safeguards"},
            {"id": "164.310(d)", "title": "Device and Media Controls", "status": "fail", "category": "Physical Safeguards"},
            {"id": "164.312(a)(1)", "title": "Access Control", "status": "fail", "category": "Technical Safeguards"},
            {"id": "164.312(b)", "title": "Audit Controls", "status": "pass", "category": "Technical Safeguards"},
            {"id": "164.312(c)", "title": "Integrity Controls", "status": "fail", "category": "Technical Safeguards"},
            {"id": "164.312(e)", "title": "Transmission Security", "status": "pass", "category": "Technical Safeguards"},
        ],
    },
    "NIST 800-53": {
        "framework": "NIST 800-53",
        "version": "Rev 5",
        "description": "Security and Privacy Controls for Information Systems and Organizations",
        "controls": [
            {"id": "AC-2", "title": "Account Management", "status": "pass", "category": "Access Control"},
            {"id": "AC-3", "title": "Access Enforcement", "status": "pass", "category": "Access Control"},
            {"id": "AC-6", "title": "Least Privilege", "status": "fail", "category": "Access Control"},
            {"id": "AT-2", "title": "Literacy Training and Awareness", "status": "pass", "category": "Awareness & Training"},
            {"id": "AU-2", "title": "Event Logging", "status": "pass", "category": "Audit & Accountability"},
            {"id": "AU-6", "title": "Audit Record Review, Analysis, and Reporting", "status": "fail", "category": "Audit & Accountability"},
            {"id": "CA-3", "title": "Information Exchange", "status": "fail", "category": "Assessment & Authorization"},
            {"id": "CA-7", "title": "Continuous Monitoring", "status": "fail", "category": "Assessment & Authorization"},
            {"id": "CM-2", "title": "Baseline Configuration", "status": "pass", "category": "Configuration Management"},
            {"id": "CM-6", "title": "Configuration Settings", "status": "pass", "category": "Configuration Management"},
            {"id": "CP-2", "title": "Contingency Plan", "status": "pass", "category": "Contingency Planning"},
            {"id": "IA-2", "title": "Identification and Authentication (Org Users)", "status": "pass", "category": "Identification & Authentication"},
            {"id": "IR-4", "title": "Incident Handling", "status": "pass", "category": "Incident Response"},
            {"id": "MA-2", "title": "Controlled Maintenance", "status": "pass", "category": "Maintenance"},
            {"id": "PE-3", "title": "Physical Access Control", "status": "pass", "category": "Physical & Environmental"},
            {"id": "PL-2", "title": "System Security and Privacy Plans", "status": "fail", "category": "Planning"},
            {"id": "RA-5", "title": "Vulnerability Monitoring and Scanning", "status": "pass", "category": "Risk Assessment"},
            {"id": "SA-3", "title": "System Development Life Cycle", "status": "fail", "category": "System & Services Acquisition"},
            {"id": "SC-7", "title": "Boundary Protection", "status": "pass", "category": "System & Communications Protection"},
            {"id": "SI-2", "title": "Flaw Remediation", "status": "pass", "category": "System & Information Integrity"},
        ],
    },
    "ISO 27001": {
        "framework": "ISO 27001",
        "version": "2022",
        "description": "Information Security Management Systems — Requirements",
        "controls": [
            {"id": "A.5.1", "title": "Policies for information security", "status": "fail", "category": "Organizational Controls"},
            {"id": "A.5.2", "title": "Information security roles and responsibilities", "status": "pass", "category": "Organizational Controls"},
            {"id": "A.5.3", "title": "Segregation of duties", "status": "pass", "category": "Organizational Controls"},
            {"id": "A.5.10", "title": "Acceptable use of information and assets", "status": "pass", "category": "Organizational Controls"},
            {"id": "A.6.1", "title": "Screening", "status": "pass", "category": "People Controls"},
            {"id": "A.6.2", "title": "Terms and conditions of employment", "status": "pass", "category": "People Controls"},
            {"id": "A.7.1", "title": "Physical security perimeters", "status": "pass", "category": "Physical Controls"},
            {"id": "A.7.4", "title": "Physical security monitoring", "status": "pass", "category": "Physical Controls"},
            {"id": "A.8.1", "title": "User endpoint devices", "status": "pass", "category": "Technological Controls"},
            {"id": "A.8.2", "title": "Privileged access rights", "status": "fail", "category": "Technological Controls"},
            {"id": "A.8.5", "title": "Secure authentication", "status": "pass", "category": "Technological Controls"},
            {"id": "A.8.8", "title": "Management of technical vulnerabilities", "status": "pass", "category": "Technological Controls"},
            {"id": "A.8.9", "title": "Configuration management", "status": "pass", "category": "Technological Controls"},
            {"id": "A.8.12", "title": "Data leakage prevention", "status": "pass", "category": "Technological Controls"},
            {"id": "A.8.15", "title": "Logging", "status": "pass", "category": "Technological Controls"},
            {"id": "A.8.16", "title": "Monitoring activities", "status": "fail", "category": "Technological Controls"},
            {"id": "A.8.24", "title": "Use of cryptography", "status": "pass", "category": "Technological Controls"},
            {"id": "A.8.28", "title": "Secure coding", "status": "pass", "category": "Technological Controls"},
        ],
    },
    "GDPR": {
        "framework": "GDPR",
        "version": "2018",
        "description": "General Data Protection Regulation (EU)",
        "controls": [
            {"id": "Art. 5", "title": "Principles relating to processing of personal data", "status": "pass", "category": "Data Processing Principles"},
            {"id": "Art. 6", "title": "Lawfulness of processing", "status": "pass", "category": "Lawful Basis"},
            {"id": "Art. 13", "title": "Information to be provided to data subjects", "status": "pass", "category": "Transparency"},
            {"id": "Art. 15", "title": "Right of access by the data subject", "status": "pass", "category": "Data Subject Rights"},
            {"id": "Art. 17", "title": "Right to erasure (right to be forgotten)", "status": "fail", "category": "Data Subject Rights"},
            {"id": "Art. 25", "title": "Data protection by design and by default", "status": "pass", "category": "Privacy by Design"},
            {"id": "Art. 32", "title": "Security of processing", "status": "fail", "category": "Security"},
            {"id": "Art. 35", "title": "Data protection impact assessment", "status": "fail", "category": "Impact Assessment"},
        ],
    },
    "SOX": {
        "framework": "SOX",
        "version": "2002",
        "description": "Sarbanes-Oxley Act — IT General Controls",
        "controls": [
            {"id": "ITGC-AC-1", "title": "User access provisioning and deprovisioning", "status": "pass", "category": "Access Controls"},
            {"id": "ITGC-AC-2", "title": "Privileged access management", "status": "pass", "category": "Access Controls"},
            {"id": "ITGC-AC-3", "title": "Periodic access reviews", "status": "pass", "category": "Access Controls"},
            {"id": "ITGC-CM-1", "title": "Change request and approval process", "status": "pass", "category": "Change Management"},
            {"id": "ITGC-CM-2", "title": "Segregation of duties in change management", "status": "pass", "category": "Change Management"},
            {"id": "ITGC-CM-3", "title": "Change audit trail and documentation", "status": "fail", "category": "Change Management"},
            {"id": "ITGC-CO-1", "title": "Job scheduling and batch processing controls", "status": "pass", "category": "Computer Operations"},
            {"id": "ITGC-CO-2", "title": "Backup and recovery procedures", "status": "pass", "category": "Computer Operations"},
            {"id": "ITGC-SD-1", "title": "System development lifecycle controls", "status": "pass", "category": "System Development"},
            {"id": "ITGC-SD-2", "title": "Testing and quality assurance", "status": "fail", "category": "System Development"},
            {"id": "ITGC-SD-3", "title": "Program migration controls", "status": "pass", "category": "System Development"},
        ],
    },
    "FedRAMP": {
        "framework": "FedRAMP",
        "version": "Rev 5",
        "description": "Federal Risk and Authorization Management Program",
        "controls": [
            {"id": "AC-2", "title": "Account Management", "status": "pass", "category": "Access Control"},
            {"id": "AC-3", "title": "Access Enforcement", "status": "pass", "category": "Access Control"},
            {"id": "AC-6", "title": "Least Privilege", "status": "fail", "category": "Access Control"},
            {"id": "AC-17", "title": "Remote Access", "status": "fail", "category": "Access Control"},
            {"id": "AU-2", "title": "Event Logging", "status": "pass", "category": "Audit & Accountability"},
            {"id": "AU-6", "title": "Audit Record Review", "status": "fail", "category": "Audit & Accountability"},
            {"id": "AU-12", "title": "Audit Record Generation", "status": "pass", "category": "Audit & Accountability"},
            {"id": "CA-5", "title": "Plan of Action and Milestones", "status": "fail", "category": "Assessment & Authorization"},
            {"id": "CM-2", "title": "Baseline Configuration", "status": "pass", "category": "Configuration Management"},
            {"id": "CM-6", "title": "Configuration Settings", "status": "fail", "category": "Configuration Management"},
            {"id": "CM-8", "title": "System Component Inventory", "status": "pass", "category": "Configuration Management"},
            {"id": "CP-2", "title": "Contingency Plan", "status": "pass", "category": "Contingency Planning"},
            {"id": "IA-2", "title": "Identification and Authentication", "status": "pass", "category": "Identification & Authentication"},
            {"id": "IA-5", "title": "Authenticator Management", "status": "fail", "category": "Identification & Authentication"},
            {"id": "IR-2", "title": "Incident Response Training", "status": "fail", "category": "Incident Response"},
            {"id": "IR-4", "title": "Incident Handling", "status": "fail", "category": "Incident Response"},
            {"id": "IR-6", "title": "Incident Reporting", "status": "pass", "category": "Incident Response"},
            {"id": "PE-3", "title": "Physical Access Control", "status": "pass", "category": "Physical & Environmental"},
            {"id": "PL-2", "title": "System Security and Privacy Plans", "status": "fail", "category": "Planning"},
            {"id": "RA-5", "title": "Vulnerability Monitoring and Scanning", "status": "pass", "category": "Risk Assessment"},
            {"id": "SA-3", "title": "System Development Life Cycle", "status": "pass", "category": "System & Services Acquisition"},
            {"id": "SC-7", "title": "Boundary Protection", "status": "fail", "category": "System & Communications Protection"},
            {"id": "SC-12", "title": "Cryptographic Key Establishment", "status": "pass", "category": "System & Communications Protection"},
            {"id": "SI-2", "title": "Flaw Remediation", "status": "pass", "category": "System & Information Integrity"},
            {"id": "SI-4", "title": "System Monitoring", "status": "pass", "category": "System & Information Integrity"},
        ],
    },
}


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
            {"name": "NIST 800-53", "version": "Rev 5", "description": "Security and Privacy Controls for Information Systems and Organizations"},
            {"name": "ISO 27001", "version": "2022", "description": "Information Security Management Systems — Requirements"},
            {"name": "GDPR", "version": "2018", "description": "General Data Protection Regulation (EU)"},
            {"name": "SOX", "version": "2002", "description": "Sarbanes-Oxley Act — IT General Controls"},
            {"name": "FedRAMP", "version": "Rev 5", "description": "Federal Risk and Authorization Management Program"},
        ]
    }


@router.get("/frameworks/{framework}/controls")
async def framework_controls(framework: str):
    """Return detailed controls for a specific compliance framework."""
    # Try exact match first, then case-insensitive
    controls = FRAMEWORK_CONTROLS.get(framework)
    if not controls:
        for key, value in FRAMEWORK_CONTROLS.items():
            if key.lower() == framework.lower():
                controls = value
                break
    if not controls:
        raise HTTPException(status_code=404, detail=f"Framework '{framework}' not found. Available: {list(FRAMEWORK_CONTROLS.keys())}")
    total = len(controls["controls"])
    passing = sum(1 for c in controls["controls"] if c["status"] == "pass")
    failing = total - passing
    return {
        **controls,
        "total_controls": total,
        "passing": passing,
        "failing": failing,
        "score": round((passing / total) * 100) if total > 0 else 0,
    }
