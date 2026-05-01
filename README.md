# Prism — Platform Intelligence

```
██████╗ ██████╗ ██╗███████╗███╗   ███╗
██╔══██╗██╔══██╗██║██╔════╝████╗ ████║
██████╔╝██████╔╝██║███████╗██╔████╔██║
██╔═══╝ ██╔══██╗██║╚════██║██║╚██╔╝██║
██║     ██║  ██║██║███████║██║ ╚═╝ ██║
╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝╚═╝     ╚═╝

  Platform Intelligence · CPT Engine · Iris AI
```

> **The Bloomberg Terminal for enterprise infrastructure.**  
> One unified knowledge graph over your entire technology estate — Kubernetes, GitHub, Datadog, Kafka, ArgoCD, Terraform, Vault, and 9 more — powered by a patent-pending entity resolution engine and an AI copilot that never hallucinates.

[![Backend](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](http://localhost:8000/docs)
[![Frontend](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](http://localhost:3000)
[![Graph DB](https://img.shields.io/badge/Neo4j-008CC1?style=flat&logo=neo4j&logoColor=white)](http://localhost:7474)
[![AI](https://img.shields.io/badge/Claude-Anthropic-orange?style=flat)](https://anthropic.com)
[![License](https://img.shields.io/badge/Patent-Pending-red?style=flat)](./AGENTS.md)

---

## What is Prism?

Engineering teams at scale face the same unsolved problem: **every tool sees your infrastructure differently**. Your Kubernetes cluster calls a service `payments-svc`. Datadog monitors `payments_service`. GitHub hosts `acme/payments-api`. API Connect exposes `payments-api-v2`. ArgoCD deploys `prod-payments`. They're all the same thing — but no existing tool resolves that.

Prism solves this with the **CPT Engine** (Convergent Perspective Topology), a patent-pending algorithm that builds a single canonical knowledge graph from all your platforms, resolving entity identity through topological structure rather than brittle name-matching.

On top of the graph, **Iris** — an AI copilot powered by Anthropic Claude — answers questions about your infrastructure with source citations from the live graph, making hallucination structurally impossible.

---

## Core Innovation — CPT Engine (Patent Pending)

```
Platform A: payments-svc     ─┐
Platform B: payments-api-v2  ─┼─►  [ CPT Engine ]  ─►  payments-svc  (canonical)
Platform C: prod-payments    ─┘        5-pass resolution
```

The CPT Engine uses five resolution passes, in confidence order:

| Pass | Method | Confidence |
|------|--------|-----------|
| 1 | Exact match (normalized name + namespace) | 1.00 |
| 2 | Normalized match (strip version/env prefixes) | 0.90 |
| 3 | Label-based match (3+ shared labels: app, team, domain) | 0.80 |
| 4 | Fuzzy match (Levenshtein distance < 3) | 0.60 |
| 5 | ML similarity (sentence-transformer + cosine > 0.85) | 0.85 |

Each entity receives a **topological fingerprint** — a SHA-256 hash of its structural neighborhood, not its name. This enables idempotent sync and cross-platform entity resolution that survives renaming, versioning, and env promotion.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser  ·  React 18 + TypeScript + Vite + Tailwind + Framer  │
│  localhost:3000                                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST + WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│  FastAPI  ·  Python 3.12  ·  localhost:8000                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  CPT Engine (patent-pending)                            │    │
│  │  ├── Perspective Collection (13 connectors)             │    │
│  │  ├── Topological Fingerprinting (SHA-256 structural)    │    │
│  │  ├── Perspective Convergence (Hungarian algorithm)      │    │
│  │  ├── Truth Resolution (domain authority weights)        │    │
│  │  └── Causal Graph Construction (temporal correlation)   │    │
│  ├────────────────────────────────────────────────────────-┤    │
│  │  Iris AI Copilot (LangGraph + Claude)                   │    │
│  │  ├── 10 graph tools (search, blast radius, compliance…) │    │
│  │  ├── 7 anti-hallucination safeguards                    │    │
│  │  └── 5 personas (Dev, SRE, Product, Auditor, Exec)      │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  Compliance Engine  ·  Health Scorer  ·  Report Engine  │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────┬────────────────────────────┬───────────────────────--┘
           │                            │
┌──────────▼──────────┐    ┌────────────▼───────────────┐
│  Neo4j 5.x           │    │  Redis 7.x                  │
│  localhost:7474/7687 │    │  localhost:6379             │
│  ├── Graph DB         │    │  ├── Sync queue             │
│  ├── APOC + GDS       │    │  ├── Session memory         │
│  └── Vector index     │    │  └── Rate limiting          │
│      (1536-dim, cos)  │    └─────────────────────────────┘
└──────────────────────┘
```

---

## Platform Connectors

Prism connects to 13+ platforms out of the box. Each connector is read-only by default — your data never leaves your network.

| Platform | Category | Auth Methods | Entities |
|----------|----------|-------------|---------|
| ☸️ **Kubernetes** | Container Orchestration | Service Account, SAML 2.0 | Deployments, Pods, Services, Namespaces |
| 🐙 **GitHub** | VCS / CI | GitHub App, API Token | Repos, PRs, Actions, Teams |
| 🐶 **Datadog** | Observability | API Key + App Key | Services, Monitors, Dashboards, Incidents |
| ☁️ **AWS** | Cloud | IAM Role (AssumeRole), OIDC | EKS, RDS, Lambda, S3, ECS |
| 📊 **Confluent Kafka** | Messaging | API Key + Secret, SAML 2.0 | Topics, Consumer Groups, Schemas |
| 🚀 **ArgoCD** | GitOps / CD | API Token, SAML 2.0 | Applications, Rollouts, Syncs |
| 🏗️ **Terraform** | IaC | Service Account, OIDC | Resources, Modules, Workspaces |
| 🔐 **HashiCorp Vault** | Secrets | AppRole, Kubernetes Auth | Secrets, Policies, Auth Methods |
| 📋 **ServiceNow** | ITSM | OAuth 2.0, User/Password | CIs, Incidents, Changes, Services |
| 📌 **Jira** | Project Mgmt | OAuth 2.0, API Token | Projects, Issues, Epics, Sprints |
| 🔌 **IBM API Connect** | API Gateway | Client ID + Secret, OAuth 2.0 | APIs, Products, Plans, Subscriptions |
| 🔍 **SonarQube** | Code Quality | API Token, User/Password | Projects, Issues, CVEs, Coverage |
| 📦 **Nexus Registry** | Artifact Mgmt | API Token, User/Password | Images, Artifacts, Repositories |

---

## Knowledge Graph Schema

### 17 Entity Types

```
Application  Service  API  Deployment  Container  Repository  Pipeline
Image  Namespace  Topic  Database  Secret  Policy  Vulnerability  
Environment  Domain  Team
```

### 16 Relationship Types

```
DEPENDS_ON   DEPLOYED_TO    EXPOSES       CONSUMES     BUILT_FROM
RUNS_IN      PUBLISHES_TO   SUBSCRIBES_TO OWNS         BELONGS_TO
SCANNED_BY   HAS_VULNERABILITY  ENFORCES  STORED_IN    USES_SECRET
GATEWAY_FOR
```

---

## Iris AI Copilot

Iris is a LangGraph agent backed by Anthropic Claude. It answers questions by querying the live graph — not its training data — making hallucination structurally impossible.

### 10 Graph Tools

| Tool | What it does |
|------|-------------|
| `search_entities` | Find entities by name, type, or keyword |
| `get_entity_detail` | Full entity with all connections and metadata |
| `traverse_dependencies` | Upstream / downstream dependency tree |
| `calculate_blast_radius` | BFS impact analysis — what breaks if X fails |
| `check_compliance` | Policy gaps across PCI-DSS, SOC2, HIPAA, NIST |
| `get_health_score` | Composite health breakdown by service |
| `list_vulnerabilities` | CVEs with CVSS scores and affected services |
| `get_platform_overview` | All platforms, entity counts, sync status |
| `compare_entities` | Side-by-side entity comparison |
| `explain_relationship` | All paths between two entities |

### 7 Anti-Hallucination Safeguards

1. **Mandatory tool use** — Iris must call ≥1 graph tool before answering
2. **Source citation** — every claim links to `[entity:name]` or `[edge:type:id]`
3. **Confidence scoring** — 0.0–1.0, disclaimer shown if < 0.7
4. **Existence verification** — cannot invent entities not in the graph
5. **Empty-result honesty** — "not found" replaces filling gaps from training data
6. **Temporal awareness** — "based on data synced 3 minutes ago"
7. **Uncertainty escalation** — ambiguous matches are surfaced, not silently picked

### 5 Personas

| Persona | Focus |
|---------|-------|
| **Developer** | Dependencies, APIs, service connections |
| **SRE** | Blast radius, health scores, incidents |
| **Product Owner** | Capabilities, ownership, roadmap |
| **Auditor** | Compliance evidence, policy gaps |
| **Executive** | Risk posture, KPIs, financial exposure |

---

## Application Modules (15 Pages)

| Module | Route | What it does |
|--------|-------|-------------|
| **Dashboard** | `/dashboard` | Real-time health overview — entity counts, incidents, Iris follow-ups, platform sync status |
| **Topology Explorer** | `/topology` | Force-directed D3.js graph of your entire infrastructure — pan, zoom, filter, select to inspect |
| **Application Lens** | `/app/:id` | 360° view of any service — dependencies, health score, CVEs, compliance, ownership, blast radius |
| **Iris AI** | `/iris` | Full-screen AI copilot chat with persona selector, capability cards, and graph-grounded answers |
| **Compliance Center** | `/compliance` | Automated gap analysis across PCI-DSS, SOC 2, HIPAA, NIST, ISO 27001, GDPR, SOX, FedRAMP |
| **Health Dashboard** | `/health` | 24-hour service swimlane timeline with SLO tracking, MTTR/MTTD telemetry, and incident history |
| **Vulnerability Intel** | `/vulnerabilities` | CVE catalogue with CVSS scores, blast radius per CVE, fix urgency ranking, scanner coverage |
| **Blast Radius** | `/blast-radius` | Pick any entity — see direct, transitive, and downstream impact in concentric rings with team ownership |
| **Reports** | `/reports` | Scheduled report definitions — reproducible snapshots of graph state with Iris narrative |
| **Connectors** | `/connectors` | Platform connection management — configure auth, trigger syncs, monitor entity counts |
| **Documents** | `/documents` | Document ingestion — upload PDFs, DOCX, Markdown, YAML — extracted entities added to graph |
| **Change Impact** | `/changes` | Live event log — every entity change, health shift, CVE discovery, and sync streamed in real time |
| **Documentation** | `/docs` | Interactive product documentation with CPT Engine animation and architecture deep-dive |
| **Settings** | `/settings` | LLM provider config, API key management, sync intervals, anti-hallucination toggles |
| **Landing** | `/` | Marketing landing page with animated topology hero and scroll-reveal feature sections |

---

## Quick Start

### Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Docker Desktop | 4.x+ | `docker --version` |
| Node.js | 18+ | `node --version` |
| Python | 3.12+ | `python3 --version` |
| make | any | `make --version` |

### 1. Environment Setup

```bash
cd prism/

# Copy and fill in your API key
cp .env.example .env
# Edit .env and add:
#   ANTHROPIC_API_KEY=sk-ant-...
#   NEO4J_PASSWORD=prism-dev-2024
```

### 2. Start all services

```bash
make dev
# Starts: api (8000) · frontend (3000) · neo4j (7474/7687) · redis (6379)
# Wait ~30s for neo4j to initialize on first run
```

### 3. Seed demo data

```bash
make seed
# Loads 13 platforms with intentionally conflicting entity names
# CPT Engine resolves them into ~200 canonical nodes
# Verify: open http://localhost:7474 → query MATCH (n) RETURN count(n)
```

### 4. Open the app

```
http://localhost:3000
```

---

## Makefile Reference

```bash
make dev          # Start all 4 Docker services
make seed         # Load synthetic 13-platform demo data
make seed-large   # Load 1,000-entity dataset
make test         # Run all unit + integration tests
make lint         # Python (ruff) + TypeScript (tsc --noEmit)
make logs         # Stream logs from all services
make clean        # Stop containers and remove volumes
make shell-api    # bash into the API container
make shell-neo4j  # cypher-shell into Neo4j
make demo         # Full demo walkthrough script
```

---

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...          # Iris AI copilot (Claude)
NEO4J_PASSWORD=prism-dev-2024         # Graph database password

# Optional (defaults shown)
NEO4J_URI=bolt://neo4j:7687
REDIS_URL=redis://redis:6379
API_PORT=8000
FRONTEND_PORT=3000
LOG_LEVEL=INFO
TENANT_ID=demo
CPT_CONFIDENCE_THRESHOLD=0.85        # Min confidence for entity resolution
SYNC_INTERVAL_SECONDS=300            # Background sync interval
LLM_MODEL=claude-sonnet-4-6          # Default Claude model
LLM_TEMPERATURE=0.1                  # Low temp for factual answers
LLM_MAX_TOKENS=4096
```

---

## API Reference

All endpoints are prefixed with `/api/v1`. Interactive docs at `http://localhost:8000/docs`.

### Entities
```
GET    /entities                    List all entities (with filters)
POST   /entities                    Create entity
GET    /entities/{id}               Get entity by ID
GET    /entities/{id}/dependencies  Upstream + downstream tree
GET    /entities/{id}/blast-radius  BFS impact analysis
GET    /entities/{id}/compliance    Compliance gaps for entity
```

### Topology & Search
```
GET    /topology                    Full graph (nodes + edges, paginated)
GET    /topology/subgraph/{id}      Ego-graph around entity
GET    /search?q=                   Full-text entity search
GET    /search/semantic?q=          Vector similarity search
```

### Iris AI Copilot
```
POST   /copilot/chat                Single-turn chat (returns full response)
WS     /copilot/stream              Streaming WebSocket chat
GET    /copilot/suggestions         Context-aware query suggestions
```

### Compliance
```
GET    /compliance/dashboard        Framework scores (PCI-DSS, SOC2, HIPAA…)
GET    /compliance/gaps             Gap list with severity + remediation
GET    /compliance/policies         Policy rule definitions
```

### Connectors
```
GET    /connectors                  List all connectors with status
GET    /connectors/catalog          Available connector types
GET    /connectors/auth-methods     Auth method schemas
GET    /connectors/{id}/config      Get connector configuration
PUT    /connectors/{id}/config      Save connector credentials
POST   /connectors/{id}/sync        Trigger manual sync
POST   /connectors/{id}/test        Test connection
```

### Documents
```
POST   /documents/upload            Upload file (PDF, DOCX, YAML, MD, JSON…)
GET    /documents                   List all documents
GET    /documents/{id}              Document status + metadata
GET    /documents/{id}/entities     Extracted entities
DELETE /documents/{id}              Remove document
```

### Health & Reports
```
GET    /health/dashboard            Composite health scores
GET    /health/applications         Per-application health breakdown
POST   /reports/generate            Generate report
GET    /reports/{id}/download       Download report (PDF/CSV)
```

---

## Design System

Prism uses a bifurcated palette: dark navy for structural chrome, white for content surfaces. One signature accent — cyan — for connectivity and intelligence signals.

### Color Tokens

```css
/* Surfaces */
--p-bg-deep:    #0B1222   /* Deepest background, sidebar */
--p-bg-main:    #0F1729   /* Main content background */
--p-bg-card:    #151D2E   /* Card backgrounds */
--p-bg-elevated:#1E293B   /* Elevated surfaces */

/* Text */
--p-text-1: #F1F5F9       /* Primary text */
--p-text-2: #94A3B8       /* Secondary text */
--p-text-3: #475569       /* Muted/caption text */

/* Accent */
--p-accent: #22D3EE       /* Cyan — connectivity signal */
--p-iris:   #5E6AD2       /* Iris AI purple */

/* Semantic */
--p-green:  #10B981       /* Healthy / success */
--p-amber:  #F59E0B       /* Warning / attention */
--p-red:    #EF4444       /* Error / critical */
```

### Entity Type Colors (Sacred — Never Change)

| Entity | Color | Hex |
|--------|-------|-----|
| API | Blue | `#3B82F6` |
| Service | Green | `#10B981` |
| Database | Purple | `#8B5CF6` |
| Queue / Topic | Amber | `#F59E0B` |
| Cache | Orange | `#EF6C00` |
| Repository | Gray | `#64748B` |
| Secret | Pink | `#EC4899` |
| Monitor | Indigo | `#6366F1` |
| Deployment | Lime | `#22C55E` |

### Typography

- **Display / Headings** — Instrument Sans 600, −0.025em letter-spacing
- **Data values, entity names, IDs** — JetBrains Mono (monospace = precision)
- **Body** — Instrument Sans 400, 14px, 1.6 line-height

---

## Testing

```bash
make test                         # All tests

# Individual test suites
pytest backend/tests/test_cpt.py              # CPT entity resolution accuracy
pytest backend/tests/test_blast_radius.py     # BFS blast radius correctness
pytest backend/tests/test_tenant_isolation.py # Multi-tenant data separation
pytest backend/tests/test_copilot.py          # Anti-hallucination suite
pytest backend/tests/test_connectors.py       # Connector idempotency
```

### Key Test Cases

| Test | What it verifies |
|------|----------------|
| Entity resolution | `payments-svc` / `payments-api-v2` / `prod-payments` → same canonical entity |
| Blast radius | Known topology → correct affected node set |
| Tenant isolation | Two tenants' data never cross |
| Anti-hallucination | "What does X do?" where X not in graph → "not found", not invented answer |
| Connector idempotency | Seed twice → same entity count (fingerprint dedup works) |

---

## Demo Script

For a live CIO/investor presentation:

```bash
make dev && make seed

# 1. Open http://localhost:3000 — animated landing page
# 2. "Explore the Graph" → topology with 200+ nodes colored by entity type
# 3. Click payments-svc:
#    → Application Lens: 5 dependencies, 2 CVEs, 94% PCI-DSS compliance
# 4. Open Iris chat → type:
#    "What would break if payments-api went down?"
#    → Response cites [entity:orders-svc], [entity:notification-svc], [entity:gateway-prod]
# 5. Navigate to Compliance → 3 PCI-DSS gaps with remediation paths
# 6. Navigate to Blast Radius → pick orders-pg-primary → animated ripple
# 7. Navigate to Connectors → Configure Kubernetes → add Service Account token
# 8. Navigate to Documents → upload architecture PDF → entities extracted
```

---

## Repository Layout

```
prism/
├── AGENTS.md                    ← AI agent instructions (architecture reference)
├── DESIGN.md                    ← Design system tokens and guidelines
├── Makefile                     ← Dev workflow commands
├── docker-compose.yml           ← Local dev environment (4 services)
├── .env.example                 ← Environment variable template
├── docs/
│   ├── Prism_Executive_Plan_v2_Advanced.docx
│   └── prims.pptx               ← Investor / CIO presentation deck
├── backend/
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── app/
│       ├── main.py              ← FastAPI entry, CORS, lifespan
│       ├── config.py            ← PrismSettings (pydantic-settings)
│       ├── cpt/                 ← ★ Patent-pending CPT Engine
│       │   ├── fingerprint.py   ← TopologicalFingerprint, SHA-256 structural hash
│       │   ├── convergence.py   ← PerspectiveConvergence, Hungarian algorithm
│       │   ├── truth.py         ← TruthResolver, domain authority weights
│       │   └── causal.py        ← CausalGraphBuilder, temporal correlation
│       ├── connectors/          ← 13 platform adapters
│       ├── graph/               ← Neo4j client, schema, algorithms, vector index
│       ├── intelligence/        ← Iris copilot, compliance, health, LLM router
│       ├── api/v1/              ← REST + WebSocket routes
│       └── middleware/          ← Auth (OIDC), tenant scoping, rate limiting
└── frontend/
    └── src/
        ├── components/
        │   ├── layout/          ← Shell, Sidebar, TopBar
        │   ├── graph/           ← TopologyGraph (D3.js), BlastRadiusOverlay
        │   ├── copilot/         ← IrisPanel (floating), ChatMessage
        │   ├── dashboard/       ← MetricCard, HealthDashboard
        │   ├── compliance/      ← ComplianceCenter, PolicyCard
        │   └── common/          ← PageHead, FilterBar, IrisQuickAsk, Section
        ├── pages/               ← 15 page components
        ├── stores/              ← Zustand: graph, chat, tenant, theme
        ├── hooks/               ← useIris (WS+REST), useGraph, useTenant
        └── api/client.ts        ← Axios wrapper with base URL + interceptors
```

---

## What Makes Prism Different

| Problem | Industry Standard | Prism |
|---------|-------------------|-------|
| Entity resolution | Name matching (brittle) | Topological fingerprinting (structural) |
| Cross-platform truth | Manual tags + conventions | Automated CPT convergence |
| Infrastructure AI | LLMs answer from training data | Iris queries live graph first, always |
| Blast radius | Manual runbooks | BFS graph traversal in < 100ms |
| Compliance evidence | Screenshots + spreadsheets | Automated policy check with graph evidence |
| Topology visualization | Static diagrams | Live D3.js force graph, always current |

---

## Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + TypeScript + Vite | Production-grade SPA |
| Styling | Tailwind CSS + Framer Motion | Design system + animations |
| Graph viz | D3.js (d3-force, d3-zoom) | Force-directed topology |
| State | Zustand | Lightweight, no boilerplate |
| Backend | Python 3.12 + FastAPI + async | AI/ML ecosystem, performance |
| Graph DB | Neo4j 5.x + APOC + GDS | Native graph, vector index |
| Cache | Redis 7.x | Sync queue, session memory |
| AI Agent | LangGraph + Claude (Anthropic) | Tool-calling graph agent |
| LLM | Anthropic Claude (pluggable) | Best reasoning, anti-hallucination |
| Auth | JWT + OIDC | Tenant-scoped API access |
| Infra | AWS EKS + Terraform + Helm | Kubernetes-native deployment |
| CI/CD | GitHub Actions | Build, test, deploy pipeline |

---

## License

Prism is proprietary software. The CPT Engine algorithm is patent-pending.

---

*Built with [Claude Code](https://claude.ai/code) by Anthropic.*
