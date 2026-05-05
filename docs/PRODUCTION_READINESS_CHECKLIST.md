# Prism — Production Readiness Sprint Plan
# AWS Deployment · Multi-Tenant · SOC2-Ready · Patent-Protected

---

## 🔴 URGENT: Wiss Demo Sprint — Due Today 5PM EST

**Goal**: Build a standalone `/wiss-demo` page that shows the CPT Engine solving Wiss's exact problem (fragmented client identities across M365, CCH, iChannel, Rillet) — so the CIO sees their world, not a generic engineering demo.

**Pitch**: "The same engine that unifies Kubernetes services and GitHub repos can unify your clients across CCH, iChannel, Rillet, and M365. We want Wiss to be the first accounting firm in the world to have this."

**Ask**: Design partner engagement — 3 months, ~$75–150K. Wiss co-builds the accounting vertical. They get: custom solution + Iris trained on their workflows + pricing locked. We get: domain expertise + API access + case study.

### Files to Create/Modify

- [ ] **`frontend/src/pages/WissDemo.tsx`** — new standalone page (no Shell sidebar)
- [ ] **`frontend/src/App.tsx`** — add `<Route path="/wiss-demo" element={<WissDemo />} />` outside the Shell block (line ~31)

### WissDemo.tsx Page Structure

```
┌─────────────────────────────────────────────────────────┐
│  PRISM · FOR PROFESSIONAL SERVICES                      │
│  Prepared for Wiss & Company — May 2026                 │
│  [Confidential Preview]                                 │
├─────────────────────────────────────────────────────────┤
│  KPI Strip (4 cards)                                    │
│  847 Client Identities Unified | 5 Tools Connected      │
│  23 Open Reconciliation Gaps   | Q1 Close: 91% on track │
├─────────────────────────────────────────────────────────┤
│  THE PROBLEM WE SOLVE                                   │
│  CPT Resolution Story — one client, 4 identities        │
│                                                         │
│  [iChannel #1247] [CCH T2024-089] [Rillet NYABC] [M365]│
│         ↓               ↓              ↓          ↓    │
│              ──── CPT Engine ────                       │
│                      ↓                                  │
│              [ ABC Corp · Unified ]                     │
│  "Same client. 4 systems. 0 manual reconciliation."     │
├─────────────────────────────────────────────────────────┤
│  YOUR TOOL STACK — UNIFIED TOPOLOGY                     │
│  D3/CSS node graph: M365 ── iChannel ── CCH             │
│                          ↕        ↕                     │
│                     Rillet ── Basis AI                  │
│                     (all connected through Prism)        │
├─────────────────────────────────────────────────────────┤
│  ASK IRIS — ACCOUNTING INTELLIGENCE                     │
│  3 pre-loaded questions with animated mock responses:   │
│  1. "Which clients have open reconciliation exceptions?" │
│  2. "What's the Q1 month-end close status?"             │
│  3. "Which partners have the most overdue client items?" │
├─────────────────────────────────────────────────────────┤
│  BECOME OUR DESIGN PARTNER                              │
│  "Wiss would be the first accounting firm in the world  │
│   with a unified intelligence layer across every tool." │
│  [Schedule a Follow-Up]                                 │
└─────────────────────────────────────────────────────────┘
```

### CPT Resolution Story (Section Detail)

Show 4 "raw identity" cards side by side — each with system logo color + raw ID:
- **iChannel** (teal): `client_file · #IC-1247 · ABC Manufacturing Corp`
- **CCH Axcess** (blue): `engagement · T2024-089 · ABC Mfg. Corp — Tax 2024`
- **Rillet ERP** (purple): `gl_center · NYABC-001 · ABC Corp (NY) — Revenue`
- **Microsoft 365** (red): `teams_channel · ABC Corp Project · abc-corp@wiss.com`

Then a converge animation → single gold "ABC Corp · Verified" card with CPT badge.
Label: "847 client entities resolved automatically. Zero manual mapping."

### Iris Mock Q&A (Section Detail)

Three clickable questions that trigger a typewriter-effect response:

**Q1**: "Which clients have open reconciliation exceptions?"
**A1**: "I found 23 open reconciliation exceptions across your client portfolio. The highest-priority items are: ABC Corp (Rillet ↔ CCH variance: $47K, aging 8 days), Meridian Partners (iChannel document missing for Q3 engagement), and TechVentures LLC (Basis AI reconciliation flagged 3 unmatched journal entries). [View all 23 →]"

**Q2**: "What's the Q1 2025 month-end close status?"
**A2**: "Q1 close is 91% complete across 156 active engagements. 14 engagements have open items blocking finalization: 9 are awaiting client document delivery (tracked in iChannel), 3 have CCH tax form dependencies, and 2 are pending partner review. Estimated full close: April 18. [View close checklist →]"

**Q3**: "Which partners have the most overdue client items?"
**A3**: "Top 3 partners by overdue item count: J. Rodriguez (14 items, avg 12 days overdue — primarily tax extension requests), M. Chen (9 items, avg 6 days — document requests pending in iChannel), S. Patel (7 items, avg 4 days — Rillet reconciliation approvals). [View partner dashboard →]"

### Design Notes

- **Dark theme only** — same `--p-bg-main`, `--p-text-1` design tokens as rest of Prism
- **No sidebar** — standalone full-width page, feels like an executive presentation
- **Prism logo + "FOR PROFESSIONAL SERVICES" badge** in the header
- **Gold accent** (`#F59E0B`) for CPT resolution elements — distinct from the cyan used in engineering demo
- **Font**: same as Prism design system — Instrument Sans headers, Geist Mono for data
- **Confidential watermark** in header: "PREPARED FOR WISS & COMPANY — CONFIDENTIAL"
- Animation: CPT resolution arrow converge should animate in on scroll-into-view

---

> **Context**: Prism is a patent-pending enterprise platform intelligence product with a working local demo. The application is ~65% feature-complete but 0% infrastructure-ready for AWS. This plan covers every checklist item needed to go from "impressive CIO demo" to "production-deployable enterprise SaaS" — multi-tenant, licensed, SOC2-compliant, and AWS-deployable.

# Prism — Production Readiness Checklist
# AWS Deployment · Multi-Tenant · SOC2-Ready · Patent-Protected

> **Goal**: Take Prism from working local demo → production-deployable enterprise SaaS on AWS.
> **Timeline**: 8–10 weeks · **Team**: 1 Full-Stack Engineer + 1 DevOps/Infra Engineer + Founder (legal/SOC2)

---

## Honest State of the Build Today

| Layer | Status | Gap to Production |
|-------|--------|-------------------|
| Frontend UI (15 pages) | 90% complete | Minor — needs auth UI |
| Backend API | 60% real, 40% mock | Significant — connectors are synthetic |
| CPT Engine | 70% complete | Core works, edge cases untested |
| Iris AI (Claude) | Real integration | Rate limiting + cost controls needed |
| Authentication | 0% — hardcoded dev secret | CRITICAL |
| Multi-tenancy | Header-based only | CRITICAL — spoofable |
| Rate limiting | 0% | CRITICAL — open to abuse |
| AWS Infrastructure | 0% — prism-infra is empty | CRITICAL |
| CI/CD Pipeline | 0% | CRITICAL |
| Secrets management | Plaintext .env | CRITICAL — API key was in git |
| Monitoring | structlog only | HIGH |
| Test coverage | ~20% | HIGH |
| Compliance engine | 100% mock data | MEDIUM |
| Platform connectors | 16 platforms, all synthetic | MEDIUM for demo, HIGH for prod |
| License / IP file | Missing | HIGH |

**Estimated time to production: 8–10 weeks**
**Estimated AWS cost: ~$810/month (production tier)**

---

## Sprint 0 — IP Protection & Legal *(Week 0 — run immediately, in parallel with everything)*

| # | Checklist Item | Owner | Done |
|---|---------------|-------|------|
| S0.1 | File provisional patent application for CPT Engine (5-pass entity resolution + topological fingerprinting) | Founder | ☐ |
| S0.2 | Add `LICENSE` file — proprietary license + patent pending notice | Founder | ☐ |
| S0.3 | Add `NOTICE` file — CPT Engine patent attribution | Founder | ☐ |
| S0.4 | **Rotate the Anthropic API key that was committed to git — do this TODAY** | Founder | ☐ |
| S0.5 | Audit full git history for leaked secrets: `git log --all -p \| grep -E 'sk-ant\|AKIA\|password'` | Engineer | ☐ |
| S0.6 | Purge secrets from git history (BFG Repo Cleaner) + force push | Engineer | ☐ |
| S0.7 | Move all API keys to GitHub repository secrets | Engineer | ☐ |
| S0.8 | Establish legal entity (LLC or C-Corp) before first enterprise contract | Founder | ☐ |
| S0.9 | Draft standard SaaS subscription agreement (IP ownership, data processing, tenant isolation SLA) | Founder | ☐ |
| S0.10 | Create `SECURITY.md` with responsible disclosure policy | Engineer | ☐ |

---

## Sprint 1 — Security Foundation *(Week 1–2)*

### 1A. Authentication (CRITICAL — blocks customer onboarding)

| # | Checklist Item | File | Done |
|---|---------------|------|------|
| S1.1 | Implement JWT verification middleware — fail if token invalid/missing | `backend/app/middleware/auth.py` (create) | ☐ |
| S1.2 | JWT claims must include: `sub`, `tenant_id`, `roles[]`, `exp` | `backend/app/middleware/auth.py` | ☐ |
| S1.3 | Remove hardcoded `jwt_secret` default — raise error if not set in env | `backend/app/config.py` | ☐ |
| S1.4 | Add `POST /api/v1/auth/login` endpoint → returns signed JWT | `backend/app/api/v1/auth.py` (create) | ☐ |
| S1.5 | Add `POST /api/v1/auth/refresh` endpoint | `backend/app/api/v1/auth.py` | ☐ |
| S1.6 | Add `POST /api/v1/auth/logout` → blacklist token in Redis | `backend/app/api/v1/auth.py` | ☐ |
| S1.7 | Create `/login` page in React — email + password, JWT in httpOnly cookie | `frontend/src/pages/Login.tsx` (create) | ☐ |
| S1.8 | Fix API client to send JWT cookie on every request | `frontend/src/api/client.ts` | ☐ |
| S1.9 | Move tenant isolation from `X-Tenant-ID` header → JWT claim | `backend/app/middleware/tenant.py` | ☐ |

### 1B. Authorization (RBAC)

| # | Checklist Item | File | Done |
|---|---------------|------|------|
| S1.10 | Define roles: `admin`, `editor`, `viewer`, `auditor` | `backend/app/models/roles.py` (create) | ☐ |
| S1.11 | Create `get_current_user()` FastAPI dependency returning user + role | `backend/app/dependencies.py` | ☐ |
| S1.12 | Wrap destructive endpoints (DELETE, POST sync) with role checks | All API modules | ☐ |
| S1.13 | Add tenant admin endpoint `POST /api/v1/admin/tenants` (admin only) | `backend/app/api/v1/admin.py` (create) | ☐ |

### 1C. Rate Limiting (CRITICAL — LLM cost control)

| # | Checklist Item | File | Done |
|---|---------------|------|------|
| S1.14 | Add `slowapi` with Redis-backed limiter | `backend/pyproject.toml` | ☐ |
| S1.15 | Iris chat: 20 req/min per tenant | `backend/app/api/v1/copilot.py` | ☐ |
| S1.16 | Connector sync: 5 req/min per tenant | `backend/app/api/v1/connectors.py` | ☐ |
| S1.17 | All other API: 200 req/min per tenant | `backend/app/main.py` | ☐ |
| S1.18 | Global request timeout: 30s max | `backend/app/main.py` | ☐ |

### 1D. Input Validation

| # | Checklist Item | Done |
|---|---------------|------|
| S1.19 | Pydantic request models on every POST/PUT endpoint (no raw dict) | ☐ |
| S1.20 | Entity name validation: alphanumeric + dash/underscore, max 256 chars | ☐ |
| S1.21 | Cypher injection guard: validate all user-supplied strings | ☐ |

### 1E. Secrets & Security Headers

| # | Checklist Item | Done |
|---|---------------|------|
| S1.22 | Config validation on startup: fail if `jwt_secret` == default in production | ☐ |
| S1.23 | Add security headers to nginx.conf: X-Frame-Options, CSP, HSTS, X-Content-Type-Options | ☐ |
| S1.24 | Tighten CORS: specific methods only (GET, POST, DELETE), not `allow_methods=["*"]` | ☐ |

---

## Sprint 2 — AWS Infrastructure *(Week 2–4)*

### 2A. Terraform Foundation (`prism-infra/terraform/`)

| # | Checklist Item | Done |
|---|---------------|------|
| S2.1 | Create Terraform module structure: `networking/`, `eks/`, `neo4j/`, `elasticache/`, `ecr/`, `alb/`, `iam/`, `secrets/` | ☐ |
| S2.2 | S3 + DynamoDB backend for Terraform state (remote, locked) | ☐ |
| S2.3 | Environment workspaces: `staging`, `production` | ☐ |

### 2B. Networking

| # | Checklist Item | Done |
|---|---------------|------|
| S2.4 | VPC with 3 public + 3 private subnets across 3 AZs | ☐ |
| S2.5 | Internet Gateway + NAT Gateway per AZ | ☐ |
| S2.6 | Security groups: `sg-alb` (443 inbound), `sg-api` (8000 from ALB only), `sg-neo4j` (7687 from EKS only), `sg-redis` (6379 from EKS only) | ☐ |
| S2.7 | VPC endpoints for S3, Secrets Manager, ECR (no internet for internal traffic) | ☐ |

### 2C. EKS Cluster

| # | Checklist Item | Done |
|---|---------------|------|
| S2.8 | EKS cluster (Kubernetes 1.30+) in private subnets | ☐ |
| S2.9 | Managed node groups: `general` (t3.medium × 3), `memory` (r6i.large × 2 for Neo4j) | ☐ |
| S2.10 | EKS add-ons: CoreDNS, kube-proxy, VPC CNI, EBS CSI Driver | ☐ |
| S2.11 | IRSA (IAM Roles for Service Accounts) for each service | ☐ |
| S2.12 | Cluster autoscaler configured (0 → 10 nodes max) | ☐ |

### 2D. Database (Neo4j)

| # | Checklist Item | Done |
|---|---------------|------|
| S2.13 | Decision: **Neo4j Aura Enterprise** (recommended, fully managed, APOC+GDS supported, ~$500/month) vs self-managed on EKS | ☐ |
| S2.14 | Neo4j encryption at rest enabled | ☐ |
| S2.15 | Neo4j encryption in transit: bolt TLS required | ☐ |
| S2.16 | Automated daily backup: `neo4j-admin dump` CronJob → S3 | ☐ |
| S2.17 | Neo4j credentials stored in AWS Secrets Manager | ☐ |

### 2E. ElastiCache (Redis)

| # | Checklist Item | Done |
|---|---------------|------|
| S2.18 | ElastiCache Redis: `cache.t3.medium`, multi-AZ, automatic failover | ☐ |
| S2.19 | Redis at-rest encryption + in-transit TLS | ☐ |
| S2.20 | Redis auth token in AWS Secrets Manager | ☐ |

### 2F. Application Load Balancer + WAF

| # | Checklist Item | Done |
|---|---------------|------|
| S2.21 | ALB with HTTPS listener (port 443) | ☐ |
| S2.22 | ACM certificate for `*.prism.yourdomain.com` | ☐ |
| S2.23 | ALB routing: `api.prism.io` → API (8000), `app.prism.io` → Frontend (80) | ☐ |
| S2.24 | ALB access logs to S3 (compliance audit trail) | ☐ |
| S2.25 | WAF Web ACL: OWASP Core Rule Set + rate limiting rules | ☐ |

### 2G. IAM (Least Privilege)

| # | Checklist Item | Done |
|---|---------------|------|
| S2.26 | IRSA role for API: read Secrets Manager, write CloudWatch, ECR pull | ☐ |
| S2.27 | IRSA role for frontend: ECR pull only | ☐ |
| S2.28 | CI/CD role: ECR push, EKS deploy, Secrets Manager update | ☐ |
| S2.29 | No wildcard `*` IAM policies anywhere | ☐ |

### 2H. Secrets Manager

| # | Checklist Item | Done |
|---|---------------|------|
| S2.30 | Store secrets: `prism/prod/neo4j-password`, `prism/prod/redis-auth-token`, `prism/prod/jwt-secret`, `prism/prod/anthropic-api-key` | ☐ |
| S2.31 | Auto-rotation on Neo4j password (30-day policy) | ☐ |
| S2.32 | Backend reads secrets from Secrets Manager at startup via `aws-secretsmanager-caching-python` | ☐ |

---

## Sprint 3 — Kubernetes Manifests & Helm Charts *(Week 3–4)*

| # | Checklist Item | Done |
|---|---------------|------|
| S3.1 | Backend Dockerfile: multi-stage, non-root user (UID 1000), health check, no dev deps in prod image | ☐ |
| S3.2 | Add `prod` extras group to pyproject.toml (exclude pytest, mypy, ruff) | ☐ |
| S3.3 | Add `.dockerignore` files for backend and frontend | ☐ |
| S3.4 | Helm chart: `prism-infra/helm/prism/` with values-staging.yaml + values-production.yaml | ☐ |
| S3.5 | API Deployment: 2 replicas (staging), 3 (prod), resource limits, liveness + readiness probes | ☐ |
| S3.6 | Pod security: `runAsNonRoot: true`, `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false` | ☐ |
| S3.7 | HPA: API scales 2→10 pods at 70% CPU | ☐ |
| S3.8 | PodDisruptionBudget: `minAvailable: 2` for API | ☐ |
| S3.9 | External Secrets Operator: maps AWS Secrets Manager → Kubernetes secrets | ☐ |
| S3.10 | ALB Ingress Controller installed + Ingress resource with TLS + WAF annotations | ☐ |

---

## Sprint 4 — CI/CD Pipeline *(Week 4–5)*

| # | Checklist Item | File | Done |
|---|---------------|------|------|
| S4.1 | `.github/workflows/ci.yml`: on every PR — backend tests (ruff, mypy, pytest ≥60% cov), frontend tests (tsc, lint, vitest), security scan (trivy, pip-audit, npm audit) | `.github/workflows/ci.yml` | ☐ |
| S4.2 | `.github/workflows/build.yml`: on merge to main — build + push Docker images to ECR with SHA tag | `.github/workflows/build.yml` | ☐ |
| S4.3 | `.github/workflows/deploy-staging.yml`: auto-deploy to staging on main push | `.github/workflows/deploy-staging.yml` | ☐ |
| S4.4 | `.github/workflows/deploy-production.yml`: manual approval gate required | `.github/workflows/deploy-production.yml` | ☐ |
| S4.5 | Protect `main` branch: require PR + 1 approval + CI pass | GitHub settings | ☐ |
| S4.6 | GitHub Environments: `staging` (auto), `production` (requires 2 approvers) | GitHub settings | ☐ |

---

## Sprint 5 — Multi-Tenant Customer Onboarding *(Week 5–6)*

| # | Checklist Item | File | Done |
|---|---------------|------|------|
| S5.1 | `POST /api/v1/admin/tenants` — creates tenant, Neo4j namespace, admin user | `backend/app/api/v1/admin.py` | ☐ |
| S5.2 | `DELETE /api/v1/admin/tenants/{id}` — soft-delete with 30-day retention | `backend/app/api/v1/admin.py` | ☐ |
| S5.3 | All Cypher queries enforce `WHERE e.tenant_id = $tenant_id` | All query files | ☐ |
| S5.4 | Neo4j RBAC: per-tenant database user with restricted access (Enterprise) | Neo4j config | ☐ |
| S5.5 | `/signup` page: company name, email, password, plan selection → auto-provisions tenant | `frontend/src/pages/Signup.tsx` | ☐ |
| S5.6 | Onboarding wizard: 4 steps (pick connector → configure → first sync → graph ready) | `frontend/src/pages/Onboarding.tsx` | ☐ |
| S5.7 | Welcome email via SES or Resend on tenant creation | Backend task | ☐ |
| S5.8 | User invite: `POST /api/v1/users/invite` + role assignment | `backend/app/api/v1/users.py` | ☐ |
| S5.9 | Plan-based limits: Starter (100 entities, 3 connectors, 100 Iris/mo), Pro (5K, 10, 1K), Enterprise (unlimited) | `backend/app/api/v1/usage.py` | ☐ |
| S5.10 | Usage tracking in Redis: `tenant:{id}:usage:{month}:{metric}` | Backend | ☐ |

---

## Sprint 6 — Monitoring & Observability *(Week 6–7)*

| # | Checklist Item | Done |
|---|---------------|------|
| S6.1 | Add `prometheus-fastapi-instrumentator` + expose `/metrics` endpoint | ☐ |
| S6.2 | Custom metrics: `prism_iris_tokens_total`, `prism_cpt_convergence_duration_seconds`, `prism_entity_count`, `prism_connector_sync_duration_seconds` | ☐ |
| S6.3 | Grafana dashboards: system overview, CPT performance, Iris cost tracking, per-tenant load | ☐ |
| S6.4 | Alerts: API error rate > 5% → PagerDuty, Iris spend > $50/day → Slack, pod restarts > 3 → PagerDuty | ☐ |
| S6.5 | CloudWatch alarms on ALB (5xx rate, target response time) | ☐ |
| S6.6 | OpenTelemetry SDK: trace API → LLM calls → Neo4j queries end-to-end | ☐ |
| S6.7 | EKS FluentBit DaemonSet → CloudWatch Logs (log groups: `/prism/api`, `/prism/neo4j`) | ☐ |
| S6.8 | Immutable audit log table: `timestamp, tenant_id, user_id, action, resource_type, ip_address` | ☐ |
| S6.9 | Audit log retention: 1 year minimum (SOC2 requirement) | ☐ |
| S6.10 | CloudTrail enabled for all AWS API calls in production account | ☐ |

---

## Sprint 7 — Testing & Quality *(Week 7–8)*

| # | Checklist Item | Done |
|---|---------------|------|
| S7.1 | CI fails if backend coverage < 60% | ☐ |
| S7.2 | Auth tests: valid JWT → 200, expired → 401, wrong tenant → 403 | ☐ |
| S7.3 | Tenant isolation test: Tenant A cannot read Tenant B entities | ☐ |
| S7.4 | Rate limit test: 21st Iris request → 429 | ☐ |
| S7.5 | CPT Engine: idempotent seed (2× same count), cross-platform merge correctness | ☐ |
| S7.6 | Iris anti-hallucination test: non-existent entity → "not found", not fabricated | ☐ |
| S7.7 | All 40+ API endpoints have happy + error path tests | ☐ |
| S7.8 | Tenant E2E: create → seed → query → delete | ☐ |
| S7.9 | Add Vitest + React Testing Library to frontend | ☐ |
| S7.10 | Playwright smoke tests: login → dashboard → topology click → Iris query | ☐ |
| S7.11 | Load test (k6): 50 concurrent users, 5 min, p99 < 2s, error rate < 1% | ☐ |

---

## Sprint 8 — SOC2 Compliance *(Week 8–10)*

### SOC2 Trust Service Criteria Checklist

| Criteria | Requirement | Sprint | Done |
|----------|------------|--------|------|
| CC6.1 | JWT auth + RBAC enforced on all endpoints | S1 | ☐ |
| CC6.2 | User provisioning + role assignment UI | S5 | ☐ |
| CC6.3 | Separation of duties: admin ≠ auditor | S1 | ☐ |
| CC6.6 | VPC + security groups restrict access | S2 | ☐ |
| CC6.7 | TLS on all endpoints + Neo4j bolt TLS | S2 | ☐ |
| CC6.8 | ECR image scanning on push | S2 | ☐ |
| CC7.1 | Dependabot + Trivy in CI pipeline | S4 | ☐ |
| CC7.2 | Prometheus + CloudWatch alerts | S6 | ☐ |
| CC7.3 | Write Incident Response Plan document | S8 | ☐ |
| CC7.4 | 72-hour breach notification policy documented | S8 | ☐ |
| CC7.5 | Backup/restore tested (Neo4j dump + restore verified) | S8 | ☐ |
| CC8.1 | All production changes via PR + approval | S4 | ☐ |
| CC9.1 | Top 10 risk register documented | S8 | ☐ |
| A1.1 | SLA defined: 99.5% uptime for Pro+ | S8 | ☐ |
| A1.3 | Quarterly DR drill: simulate Neo4j failure, restore, verify | S8 | ☐ |

### Compliance Engine (Replace Mock Data)

| # | Checklist Item | Done |
|---|---------------|------|
| S8.1 | Implement real PCI-DSS checks: TLS on API endpoints, auth enforcement, deployment change frequency | ☐ |
| S8.2 | Real SOC2 checks from `rulesets/soc2.yaml` — query actual graph entities | ☐ |
| S8.3 | Compliance evidence: link each gap to specific entity/property in graph | ☐ |
| S8.4 | Compliance report export: PDF with scores, gaps, evidence, remediation | ☐ |
| S8.5 | GDPR: `DELETE /api/v1/admin/tenants/{id}/data` purges all tenant data | ☐ |
| S8.6 | GDPR: `GET /api/v1/admin/data-export` returns all tenant data in JSON | ☐ |

---

## Sprint 9 — Real Platform Connectors *(Week 8+, Parallel Track)*

### Priority Order (implement in this sequence)

| # | Connector | Auth Method | Entities Collected | Done |
|---|-----------|------------|-------------------|------|
| S9.1 | **Kubernetes** | kubeconfig / in-cluster ServiceAccount | Deployments, Services, Pods, Namespaces | ☐ |
| S9.2 | **GitHub** | GitHub App installation token | Repos, PRs, workflows, teams | ☐ |
| S9.3 | **Datadog** | API key + APP key | Services, monitors, dashboards, incidents | ☐ |
| S9.4 | **AWS** | IAM role (IRSA) | EC2, RDS, S3, Lambda, EKS resources | ☐ |
| S9.5 | **ArgoCD** | Bearer token | Applications, sync status, rollout history | ☐ |

### Connector Standards

| # | Requirement | Done |
|---|------------|------|
| S9.6 | Each connector implements `BaseConnector`: `connect()`, `test_connection()`, `produce_perspective()`, `stream_events()` | ☐ |
| S9.7 | Celery background task `sync_connector` — runs every 15 min per connector | ☐ |
| S9.8 | Sync history stored: last sync timestamp, entity delta, error count | ☐ |
| S9.9 | Connector credentials encrypted in Secrets Manager, never stored in Neo4j | ☐ |

---

## Sprint 10 — Final Pre-Launch *(Week 9–10)*

| # | Checklist Item | Done |
|---|---------------|------|
| S10.1 | Internal pen test: auth bypass, tenant isolation, rate limiting, XSS, CSRF | ☐ |
| S10.2 | External pen test (HackerOne, Cobalt.io, or Burp Suite) | ☐ |
| S10.3 | All critical + high pen test findings remediated | ☐ |
| S10.4 | Load test passes: 50 users, 5 min, p99 < 2s, error rate < 1% | ☐ |
| S10.5 | Neo4j backup tested: simulate loss, restore from S3, verify data | ☐ |
| S10.6 | SOC2 Type I audit initiated with assessor | ☐ |
| S10.7 | Privacy policy + ToS reviewed by lawyer | ☐ |
| S10.8 | Provisional patent application filed (confirmation number in hand) | ☐ |
| S10.9 | Production GitHub environment: 2 approvers required for deploy | ☐ |
| S10.10 | On-call rotation defined, incident response runbook reviewed | ☐ |

---

## AWS Monthly Cost Estimate (Production Tier)

| Service | Monthly |
|---------|---------|
| EKS cluster (3× t3.medium nodes) | ~$120 |
| Neo4j Aura Enterprise (smallest) | ~$500 |
| ElastiCache t3.medium (multi-AZ) | ~$80 |
| ALB + data transfer | ~$30 |
| ECR + S3 (images + backups) | ~$20 |
| CloudWatch Logs + Metrics | ~$30 |
| Secrets Manager | ~$5 |
| WAF Web ACL | ~$25 |
| **Total** | **~$810/month** |

> Starter plan (t3.small nodes, single-AZ Redis): ~$300/month

---

## Critical Path (What Blocks What)

```
Sprint 0 (Legal/IP)     → run in parallel with everything — START TODAY
Sprint 1 (Security)     → MUST complete before Sprint 5 (customer onboarding)
Sprint 2 (AWS Infra)    → blocks Sprint 3 → blocks Sprint 4
Sprint 3 (Helm/K8s)     → blocks Sprint 4 (CI/CD needs manifests)
Sprint 5 (Onboarding)   → depends on Sprint 1 (auth)
Sprint 6 (Monitoring)   → can start in parallel with Sprint 2
Sprint 7 (Testing)      → can start in parallel with Sprint 1
Sprint 8 (SOC2)         → depends on Sprints 1, 2, 6
Sprint 9 (Connectors)   → can run in parallel with Sprints 2–4
Sprint 10 (Launch)      → depends on Sprints 1–9
```