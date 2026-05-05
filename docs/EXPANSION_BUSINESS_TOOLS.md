# Prism Connector Expansion — Business & Accounting Tools
# Why We Can't Support Wiss's Stack Today (And What It Takes To)

---

## The Gap in Plain Terms

Prism today is an **engineering infrastructure intelligence platform**. Every connector, entity type, and relationship type was designed for the DevOps/platform engineering buyer:

| Prism Today | Wiss's Actual Stack |
|-------------|---------------------|
| Kubernetes pods, deployments, namespaces | Microsoft 365 users, groups, SharePoint sites |
| GitHub repos, PRs, workflows | CCH tax software clients, engagements |
| Datadog monitors, services, incidents | iChannel documents, workflows, client files |
| AWS EC2, RDS, Lambda, S3 | Basis AI reconciliation workflows |
| ArgoCD applications, rollout history | Rillet ERP GL accounts, cost centers, invoices |
| HashiCorp Vault secrets | Abacus AI agent pipelines, data extractions |
| Confluent Kafka topics, consumers | Tabs subscription contracts, revenue schedules |
| SonarQube vulnerabilities | Netgain fixed asset records, lease schedules |

**These are completely different domains.** Prism's entity model has 17 types: Application, Service, API, Deployment, Container, Repository, Pipeline, Image, Namespace, Topic, Database, Secret, Policy, Vulnerability, Environment, Domain, Team. None of these map naturally to "Invoice", "GL Account", "Audit Engagement", "Reconciliation Workflow", or "Tax Client."

---

## Why We Can't Just "Add a Connector"

Adding a Kubernetes or GitHub connector is straightforward — they produce entities that already exist in our schema (Services, Repos, Deployments). Adding a Rillet ERP connector requires us to answer harder questions first:

### Blocker 1: Entity Schema Mismatch
Our current 17 entity types have no concept of financial or business process entities. A Rillet GL Account is not an Application. An iChannel document workflow is not a Deployment. We would need to either:
- **Extend the schema** (add 10–15 new entity types for business tools) — clean but requires CPT Engine changes to fingerprint and resolve these new types
- **Force-fit into existing types** (map "Invoice" to "Policy", "GL Account" to "Database") — works for a demo, breaks conceptual integrity and confuses Iris

### Blocker 2: API Availability and Quality

| Tool | API Status |
|------|-----------|
| Microsoft 365 | ✅ Microsoft Graph API — well-documented, REST+OAuth |
| Rillet ERP | ⚠️ Early-stage startup — API may exist but not public/stable |
| Basis AI | ⚠️ Partner API — requires partnership agreement with Basis |
| iChannel (IRIS Global) | ⚠️ Older document management system — API exists but may be SOAP/limited |
| Abacus AI | ✅ REST API available for enterprise customers |
| Tabs | ⚠️ Early-stage startup — API access unclear |
| Netgain | ⚠️ NetSuite-native app — accessible via NetSuite REST API only |
| Aiwyn | ⚠️ Practice management tool — API access unclear |
| CCH (Wolters Kluwer) | ❌ Legacy enterprise software — limited or no public API |

Several of these tools are early-stage startups with no stable public API. Building connectors for tools without reliable APIs creates brittle integrations that break with every vendor update.

### Blocker 3: Iris Doesn't Know This Domain
Iris's system prompts, 10 graph tools, and anti-hallucination safeguards are all written for infrastructure questions:
- "What services depend on payments-api?"
- "What is the blast radius if inventory-svc goes down?"
- "Show me all PCI-DSS gaps across our Kubernetes namespaces."

If we ingest Rillet GL accounts and iChannel document workflows, Iris would need entirely new prompts, new tools (e.g., `get_reconciliation_status`, `check_close_checklist`), and new personas (Accountant, Controller, CFO). The current Iris cannot answer: "Which clients have open reconciliation exceptions in Basis AI?"

### Blocker 4: Compliance Framework Mismatch
Our compliance engine checks PCI-DSS, SOC2, HIPAA, NIST, ISO 27001 — all IT/security frameworks. Accounting firms care about different frameworks:
- **AICPA standards** (audit quality, engagement independence)
- **IRS regulations** (tax filing compliance)
- **SEC rules** (for their RIA subsidiary)
- **PCAOB** (if they audit public companies)

Our compliance YAML rulesets would need complete rewrites for an accounting firm audience.

### Blocker 5: The Value Proposition Shifts
Engineering teams care about: blast radius (what breaks if X goes down), topology (how are services connected), security posture (vulnerabilities, CVEs). Accounting firms care about: close cycle time, reconciliation exceptions, client engagement status, revenue recognition accuracy, staff utilization. These are fundamentally different metrics requiring fundamentally different visualizations and AI responses.

---

## What It Would Actually Take

### Option A — Extend Prism for Business Operations (6–8 weeks of product work)

**Phase 1: Schema Extension**
Add new entity types to the 17-type model:
```
New entity types for business tools:
  - User (M365 user, distinct from Team)
  - Workflow (iChannel, Basis AI workflows)
  - Document (iChannel files, engagement letters)
  - Contract (Tabs subscriptions, MSAs)
  - FinancialRecord (GL accounts, cost centers, invoices)
  - Engagement (CCH audit/tax engagements)
  - Pipeline (Abacus AI data pipeline, distinct from CI/CD pipeline)
```
CPT Engine fingerprinting needs to handle these new types. The 5-pass resolution would work — the algorithm is domain-agnostic — but test cases need to be written for financial entity deduplication.

**Phase 2: Business Tool Connectors**
Priority order based on API availability:
1. **Microsoft 365** (Graph API — well-documented) — Users, Groups, Teams, SharePoint sites
2. **Abacus AI** (REST API for enterprise) — Data pipelines, agent workflows, extraction jobs
3. **Rillet** (via partnership) — GL accounts, cost centers, revenue streams
4. **NetSuite** (via SuiteQL REST API) — A/R, A/P, GL, projects (covers Netgain too since it's NetSuite-native)
5. **iChannel** (via their integration API) — Documents, client workflows, engagement status

**Phase 3: Iris Business Personas**
Add 3 new personas to `backend/app/intelligence/copilot/prompts.py`:
- `Controller` — close cycle, reconciliations, exceptions
- `CFO` — revenue trends, cost center spend, cash flow
- `Partner` — client engagement status, staff utilization, billing realization

Add new graph tools to `backend/app/intelligence/copilot/tools.py`:
- `get_close_status(period)` — check open reconciliations and exceptions
- `get_client_engagement_health(client_name)` — engagement status, open items, risk flags
- `check_revenue_recognition(period)` — ASC 606 compliance check across Tabs + Rillet data

**Phase 4: Business Compliance Rulesets**
Add YAML rulesets:
- `intelligence/compliance/rulesets/aicpa_soc2_readiness.yaml`
- `intelligence/compliance/rulesets/sec_ria_compliance.yaml`

**Estimated effort:** 6–8 weeks, 1–2 engineers
**Risk:** High — several connector APIs are unproven or require partnership agreements

---

### Option B — Build Prism for Business as a Separate Product (Recommended)

Rather than stretching the engineering-focused Prism into accounting territory, launch a focused vertical product **"Prism for Accounting Firms"** that reuses the CPT Engine and Iris infrastructure but has a purpose-built entity model, connector set, and AI persona layer.

```
Prism Core (shared)
├── CPT Engine (domain-agnostic entity resolution)
├── Neo4j graph infrastructure
├── Iris AI agent framework (LangGraph + Claude)
└── Multi-tenant platform, auth, compliance base

Prism for Engineering              Prism for Operations / Finance
├── K8s, GitHub, Datadog           ├── M365, Rillet, Basis AI
├── 17 infrastructure entity types  ├── 12 business entity types
├── SRE/Developer/Auditor personas  ├── Controller/CFO/Partner personas
└── PCI-DSS, SOC2, HIPAA checks    └── AICPA, SEC, close-cycle checks
```

**Benefits:**
- CPT Engine patent is horizontally applicable — "entity resolution across heterogeneous business tools" covers both engineering and accounting domains
- Faster to build (reuse 80% of infrastructure)
- Clean product positioning: don't confuse engineering buyers with accounting features
- Two separate GTM motions (DevOps/Platform Engineering vs CFO/Controller)

**Estimated effort:** 8–10 weeks to launch v1 of Prism for Operations
**Risk:** Lower — you're not compromising the engineering product, just extending the platform

---

## The Wiss Opportunity Reframed

If Wiss is interested in **Prism for their own internal stack**, Option B above is the right path. Here is exactly what that product would look like for them:

| Feature | Engineering Prism (Today) | Operations Prism (Wiss Edition) |
|---------|--------------------------|----------------------------------|
| **Entity graph** | 200+ K8s pods, services, pipelines | 50+ M365 users, Rillet accounts, iChannel workflows |
| **CPT resolution** | "payments-svc = payments-api-v2 = prod-payments" | "Wiss NY client file = iChannel engagement = CCH tax client" |
| **Iris question** | "What breaks if payments-api fails?" | "Which clients have open reconciliation exceptions?" |
| **Blast radius** | If inventory-svc goes down, 8 services affected | If month-end close is delayed, 3 partner reviews blocked |
| **Compliance** | PCI-DSS gaps in K8s | SEC RIA reporting deadlines, AICPA quality control |
| **Topology view** | Microservices dependency graph | Client engagement → staff → tool workflow graph |

**What to say to Wiss in the meeting:**
> "Prism's core engine — the CPT technology — is domain-agnostic. We built it first for engineering infrastructure, but the same entity resolution and AI layer applies to any multi-tool enterprise stack. We could build a version specifically for firms like Wiss: connecting your Microsoft 365, Rillet, Basis AI, and iChannel into a single unified graph with an AI assistant that understands accounting workflows. That would be a co-development partnership — you'd be our design partner for the operations vertical."

**This frames them as a design partner, not a failed enterprise sale.**

---

## Summary

| Question | Answer |
|----------|--------|
| Can we add Wiss's tools as connectors TODAY? | No — wrong entity schema, no API access, Iris doesn't know the domain |
| Is it technically impossible? | No — the CPT Engine is domain-agnostic and would work |
| What's the fastest path? | Option A: extend current product (6–8 weeks, risky) |
| What's the right path? | Option B: Prism for Operations as a second vertical (8–10 weeks, cleaner) |
| What to tell Wiss today? | Offer a design partner relationship for the operations vertical — they get a custom solution, we get a marquee customer validating the expansion |
