# AGENTS.md — Prism Master Agent Instructions

> Drop this file at the root of the `prism-core` repository.
> AI coding agents (Claude Code, Devin, Codex) read this file automatically.

---

## Product identity

Prism is a platform intelligence product. It creates a unified knowledge graph over an enterprise's entire technology estate — connecting Kubernetes clusters, API gateways, source code repositories, CI/CD pipelines, APM tools, vulnerability scanners, and any other platform tool — into a single, queryable, AI-powered truth layer.

Prism's competitive moat is the **Convergent Perspective Topology (CPT) Engine** — a patent-pending data engine that no other product in the world uses. Read section "CPT Engine" below before writing any connector or graph code.

---

## Repository layout

This repository is `prism-core` — the application. AWS infrastructure lives in a separate repository `prism-infra`.

```
prism-core/
├── AGENTS.md              ← You are here
├── DESIGN.md              ← Design system tokens and guidelines
├── docker-compose.yml     ← Local dev (api + frontend + neo4j + redis)
├── Makefile
├── backend/
│   ├── app/
│   │   ├── main.py        ← FastAPI entry
│   │   ├── config.py      ← Pydantic Settings (env-based)
│   │   ├── cpt/           ← ★ CPT Engine (patent-pending core)
│   │   ├── connectors/    ← Platform adapters
│   │   ├── graph/         ← Neo4j operations
│   │   ├── intelligence/  ← AI copilot, compliance, health
│   │   ├── api/v1/        ← REST + WebSocket endpoints
│   │   └── middleware/     ← Auth, tenant, rate limiting
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/    ← React + Tailwind
│   │   ├── stores/        ← Zustand state
│   │   ├── hooks/
│   │   └── api/
│   └── tests/
└── docs/
```

Separate repository:
```
prism-infra/
├── terraform/
│   ├── modules/
│   │   ├── eks/           ← EKS cluster
│   │   ├── neo4j/         ← Neo4j on EC2/EBS or Aura
│   │   ├── redis/         ← ElastiCache
│   │   ├── networking/    ← VPC, subnets, security groups
│   │   ├── iam/           ← Roles, policies
│   │   ├── secrets/       ← Secrets Manager
│   │   ├── monitoring/    ← CloudWatch, alarms
│   │   └── cdn/           ← CloudFront for frontend
│   ├── environments/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── production/
│   └── backend.tf         ← S3 + DynamoDB state backend
├── helm/
│   └── prism/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-dev.yaml
│       ├── values-prod.yaml
│       └── templates/
└── github-actions/
    ├── ci.yml
    ├── cd-dev.yml
    └── cd-prod.yml
```

---

## Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Python 3.12, FastAPI, async/await | Best AI/ML ecosystem, Devin/Codex most productive |
| Graph DB | Neo4j 5.x + APOC + GDS | Native graph algorithms, vector index, multi-database tenancy |
| Cache/Queue | Redis + Celery | Background sync tasks, conversation memory, rate limiting |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS | Production-grade SPA with D3.js graph visualization |
| Graph Viz | D3.js (d3-force, d3-zoom, d3-selection) | Force-directed topology with pan/zoom/filter |
| State | Zustand | Lightweight, no boilerplate |
| AI Agent | LangGraph + LangChain | Tool-calling agent over Neo4j graph |
| LLM | Model-agnostic router (Claude, GPT, Ollama, custom) | Customer brings their own LLM |
| Infra | AWS EKS, Terraform, Helm, ArgoCD | Self-hosted Kubernetes-native deployment |
| CI/CD | GitHub Actions | Build, test, deploy pipeline |

---

## Code conventions

### Python (backend)
- PEP 8, type hints on every function signature
- Async/await for all I/O (Neo4j, Redis, HTTP, LLM calls)
- Pydantic models for all request/response schemas
- Pytest for testing, fixtures for Neo4j test database
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`
- No `print()` — use `structlog` for structured logging
- Every module has `__init__.py` with explicit exports

### TypeScript (frontend)
- Strict mode enabled
- Functional components only, hooks for state and effects
- Props interfaces defined inline or in `types/`
- No `any` — use `unknown` and narrow
- Tailwind utility classes, no custom CSS files
- Follow DESIGN.md tokens for all colors, spacing, typography

### Security
- No secrets in code, env vars, or config files — Kubernetes Secrets or Vault only
- All API endpoints require JWT authentication
- Tenant isolation enforced at middleware level — every query scoped to tenant
- Input validation on all endpoints (Pydantic)
- SQL/Cypher injection prevention: parameterized queries only, never string interpolation
- CORS restricted to known origins
- Rate limiting on all public endpoints
- Audit logging on all write operations

---

## ★ CPT Engine — Convergent Perspective Topology (Patent-Pending)

This is the core innovation of Prism. **No other product in the world uses this approach.** Every engineer working on this codebase must understand CPT before touching the data engine.

### The problem with existing approaches

Every observability tool, CMDB, and developer portal uses the same primitive approach to unifying data across platforms: **name-based matching**. They look at service names, apply some normalization (lowercase, strip hyphens), and try to match entities.

This breaks constantly because:
- The same service is called `payments-svc` in Kubernetes, `payments-api-v2` in API Connect, `payments_service` in Datadog, `acme/payments-api` in GitHub, and `prod-payments` in ArgoCD
- Names change across environments (dev vs staging vs prod)
- Names change across versions and refactors
- Multiple unrelated services can have similar names
- Some platforms don't expose meaningful names at all

The industry has accepted this as an unsolvable problem and relies on manual tagging, label conventions, and tribal knowledge. Prism solves it.

### The CPT innovation

CPT treats each platform's view of infrastructure as a **partial perspective** of reality — like multiple cameras viewing the same scene from different angles. Instead of matching by names, CPT matches by **topological shape** — the structural pattern of how entities connect, behave, and relate to each other.

### Five-layer CPT architecture

```
Layer 1: Perspective Collection
  Each connector produces a "Perspective" — a partial graph fragment
  with entities, relationships, and metadata from one platform's viewpoint.

Layer 2: Topological Fingerprinting (TFP)
  Each entity receives a multi-dimensional "topology fingerprint" 
  computed from its structural neighborhood — NOT from its name.

Layer 3: Perspective Convergence
  Multiple perspectives are aligned using fingerprint similarity,
  producing "convergence candidates" — entities that likely 
  represent the same real-world thing despite different names.

Layer 4: Confidence-Weighted Truth Resolution
  When perspectives disagree (Platform A says 3 replicas, 
  Platform B says 5), the engine resolves truth using 
  domain authority weights.

Layer 5: Causal Graph Construction
  Beyond mapping dependencies, the engine infers causality —
  "when B's latency increases, A's error rate increases" —
  by correlating temporal signals across the converged graph.
```

### Layer 1: Perspective Collection

A Perspective is a complete snapshot from one platform's viewpoint. It contains:
- Entity set (nodes)
- Relationship set (edges)
- Temporal metadata (when entities were observed)
- Confidence annotations (how certain the connector is about each entity)

```python
class Perspective(BaseModel):
    """A single platform's view of infrastructure reality."""
    platform: str                          # "kubernetes", "github", "datadog"
    observed_at: datetime                  # When this perspective was captured
    entities: list[PerspectiveEntity]      # Nodes in this perspective
    relationships: list[PerspectiveEdge]   # Edges in this perspective
    authority_domains: list[str]           # What this platform is authoritative for
    # Example: Kubernetes is authoritative for pod count, replica count, 
    # namespace assignment. Datadog is authoritative for latency, error rate.
    # API Connect is authoritative for API contracts, subscription count.
```

### Layer 2: Topological Fingerprinting (TFP)

This is the patent-worthy innovation. Instead of matching entities by name, TFP computes a multi-dimensional fingerprint based on **topological invariants** — properties that remain the same regardless of what an entity is called.

```python
class TopologyFingerprint(BaseModel):
    """Multi-dimensional identity fingerprint for an entity.
    
    This fingerprint is computed from the entity's structural 
    neighborhood, behavioral patterns, and semantic embedding.
    It enables matching across platforms WITHOUT relying on names.
    """
    
    # Dimension 1: Structural topology
    # The connectivity pattern of this entity within its platform.
    # "This node has 3 inbound edges from type=API nodes and 
    #  2 outbound edges to type=Database nodes"
    # This SHAPE is the same regardless of naming.
    in_degree_by_type: dict[str, int]      # {API: 3, Service: 1}
    out_degree_by_type: dict[str, int]     # {Database: 2, Queue: 1}
    neighbor_type_signature: str           # Sorted hash of neighbor types
    local_clustering_coefficient: float    # How interconnected neighbors are
    
    # Dimension 2: Behavioral signature
    # Traffic patterns, error rates, deployment frequency.
    # Even without names, a payment service "behaves" differently 
    # from a notification service.
    request_rate_bucket: str               # "high" / "medium" / "low"
    error_rate_bucket: str
    deployment_frequency_bucket: str       # How often this entity changes
    
    # Dimension 3: Temporal pattern
    # When was this entity created? How old is it?
    # A service deployed 2 years ago that changes weekly has a 
    # very different temporal signature than one deployed yesterday.
    age_bucket: str                        # "days" / "weeks" / "months" / "years"
    change_velocity: str                   # "static" / "slow" / "moderate" / "fast"
    
    # Dimension 4: Semantic embedding
    # Dense vector embedding of name + labels + tags + description.
    # This IS name-based, but it's only ONE of five dimensions,
    # and it uses semantic similarity (not exact match).
    semantic_vector: list[float]           # 384-dim sentence embedding
    
    # Dimension 5: Resource signature
    # What resources does this entity consume or expose?
    # A service that exposes port 5432 and stores data is likely a database.
    # A service that exposes port 443 and has TLS certs is likely an API gateway.
    exposed_ports: list[int]
    protocol_hints: list[str]             # ["http", "grpc", "kafka", "jdbc"]
    resource_class: str                   # Inferred: "api", "worker", "database", "queue"

    def similarity(self, other: "TopologyFingerprint") -> float:
        """
        Compute similarity between two fingerprints.
        Each dimension contributes a weighted score.
        
        Weights:
          Structural topology: 0.35 (most reliable, hardest to fake)
          Resource signature: 0.25 (port/protocol patterns are stable)
          Semantic embedding: 0.20 (name-based, but semantic not exact)
          Behavioral signature: 0.10 (varies with load, less stable)
          Temporal pattern: 0.10 (useful for disambiguation)
        
        Returns: 0.0 (completely different) to 1.0 (same entity)
        """
        pass
```

### Layer 3: Perspective Convergence

The convergence algorithm aligns entities across perspectives using fingerprint similarity. This is NOT simple pairwise matching — it's a global optimization that considers the entire graph structure.

```python
class ConvergenceEngine:
    """
    Aligns entities across multiple perspectives into a 
    unified "converged" topology.
    
    Algorithm:
    1. For each entity in each perspective, compute TFP fingerprint
    2. Build a candidate match matrix: similarity scores between 
       all cross-platform entity pairs
    3. Apply Hungarian algorithm (optimal bipartite matching) to 
       find the globally optimal assignment
    4. Filter matches below confidence threshold (0.7)
    5. Merge matched entities into "converged nodes" that contain 
       data from all contributing perspectives
    6. Unmatched entities remain as platform-specific nodes 
       (flagged for human review)
    
    The key insight: matching by graph SHAPE is more reliable 
    than matching by name. A service that "receives traffic from 
    3 APIs and writes to 2 databases" has the same shape in 
    every platform, even if it's called different things.
    """
    
    async def converge(
        self, perspectives: list[Perspective]
    ) -> ConvergedTopology:
        pass
    
    async def incremental_converge(
        self, existing: ConvergedTopology, 
        new_perspective: Perspective
    ) -> ConvergedTopology:
        """
        Incremental convergence: when a single platform syncs,
        re-converge only the affected region of the graph.
        This makes real-time updates efficient.
        """
        pass
```

### Layer 4: Confidence-Weighted Truth Resolution

When platforms disagree about an entity's properties, the engine resolves truth using **domain authority weights**. Each platform is authoritative for certain properties:

```python
AUTHORITY_MATRIX = {
    "kubernetes": {
        "replica_count": 1.0,    # K8s is the truth for pod count
        "namespace": 1.0,
        "container_image": 1.0,
        "resource_limits": 1.0,
        "service_name": 0.6,     # K8s names are good but not definitive
    },
    "datadog": {
        "p99_latency": 1.0,     # APM is the truth for latency
        "error_rate": 1.0,
        "throughput": 1.0,
        "service_name": 0.5,
    },
    "apiconnect": {
        "api_contract": 1.0,    # Gateway is the truth for API specs
        "subscription_count": 1.0,
        "oauth_policy": 1.0,
        "api_name": 0.9,
    },
    "github": {
        "source_code_url": 1.0, # GitHub is the truth for code
        "branch_count": 1.0,
        "sast_findings": 1.0,
        "repo_name": 0.7,
    },
}

# When Kubernetes says 3 replicas and Datadog says 5 service instances:
# K8s authority for replica_count = 1.0, Datadog authority = 0.3
# → Truth: 3 replicas (K8s wins for this property)
# 
# When K8s says latency is unknown and Datadog says p99 = 420ms:
# K8s authority for latency = 0.0, Datadog authority = 1.0
# → Truth: 420ms (Datadog wins for this property)
```

### Layer 5: Causal Graph Construction

Beyond mapping "A depends on B," the CPT engine infers **causal relationships** by correlating temporal signals across the converged graph:

```python
class CausalInference:
    """
    Discovers causal relationships in the topology by analyzing
    correlated temporal signals.
    
    Example discovery:
    - When kafka-payments topic lag increases > 100 messages
    - Within 30 seconds, payments-svc error rate increases by 15%
    - Within 60 seconds, payments-api p99 latency exceeds SLO
    
    This chain is stored as a CausalEdge:
    kafka-payments -[CAUSES {lag > 100 → error_rate +15%}]-> payments-svc
    payments-svc -[CAUSES {error_rate +15% → p99 > SLO}]-> payments-api
    
    Value: During incident response, Prism can say 
    "payments-api is slow BECAUSE kafka-payments has lag"
    — not just "payments-api is slow and is connected to kafka-payments."
    """
    pass
```

### Why this is patentable

No existing product uses topological fingerprinting for cross-platform entity resolution. The patent claim would be:

> "A system and method for constructing a unified technology topology from multiple partial-perspective platform views, using topological invariant fingerprinting, multi-dimensional behavioral signatures, perspective convergence via optimal bipartite matching, and confidence-weighted truth resolution across authoritative domain boundaries."

Prior art search areas:
- ServiceNow CMDB: manual entry, no automated matching
- Datadog/Dynatrace: single-platform topology, no cross-platform resolution
- Backstage: static catalog, no entity resolution
- Knowledge graph platforms (Neo4j, Stardog): generic graph tools, no infrastructure-specific fingerprinting

None of these use topological shape matching or perspective convergence.

---

## AI Copilot — Anti-Hallucination Architecture

The chatbot is the most visible part of Prism. If it hallucinates — says a service exists when it doesn't, or claims a dependency that isn't real — trust in the entire product collapses. Every architectural decision in the copilot prioritizes groundedness.

### Core principle: The AI never answers from its own knowledge

The copilot is a **graph-grounded agent**. Every factual claim must trace back to a specific node or edge in the Neo4j graph. The LLM's general knowledge is used ONLY for reasoning and natural language — never for infrastructure facts.

### Anti-hallucination safeguards

```
Safeguard 1: Mandatory tool use before answering
  The agent MUST call at least one graph query tool before 
  generating a response to any infrastructure question.
  If zero tools are called, the response is blocked.

Safeguard 2: Source citation on every claim
  Every factual statement in the response must include a 
  citation tag: [entity:payments-svc] or [edge:DEPENDS_ON:123].
  The frontend renders these as clickable links to the graph.

Safeguard 3: Confidence scoring
  Each response includes a confidence score (0.0-1.0).
  - 1.0: Answer derived entirely from graph data
  - 0.7-0.9: Answer mostly from graph, some reasoning applied
  - < 0.7: Insufficient graph data, response includes disclaimer
  Responses below 0.5 are replaced with 
  "I don't have enough data to answer that reliably."

Safeguard 4: Entity existence verification
  Before referencing any entity by name, the agent calls 
  verify_entity(name) which checks if it exists in the graph.
  If it doesn't exist, the agent says "I couldn't find {name} 
  in your topology" instead of guessing.

Safeguard 5: Query result validation
  When Cypher queries return empty results, the agent MUST 
  report "no results found" — it cannot fill in the gap 
  from training data.

Safeguard 6: Temporal awareness
  Every answer includes the freshness of the underlying data.
  "Based on data synced 3 minutes ago, payments-svc has..."
  This prevents stale data from being presented as current truth.

Safeguard 7: Uncertainty escalation
  If the agent encounters ambiguity (multiple entities match 
  a query, or conflicting data across platforms), it presents 
  the ambiguity to the user instead of choosing silently.
  "I found 2 services matching 'payments': payments-svc in 
  OpenShift and payments-api in API Connect. Which one?"
```

### Agent architecture (LangGraph)

```python
# State machine: route → query → validate → generate → cite → respond

class CopilotState(TypedDict):
    messages: list                   # Conversation history
    persona: str                     # developer / po / sre / auditor / exec
    tenant_id: str
    tool_calls: list                 # Tools called this turn
    graph_context: list              # Results from graph queries
    confidence: float                # Response confidence score
    citations: list                  # Entity/edge references

# Graph:
# 1. classify_intent → What kind of question is this?
# 2. select_tools → Which graph tools to call?
# 3. execute_tools → Run Cypher queries against Neo4j
# 4. validate_results → Are results non-empty? Consistent?
# 5. generate_response → LLM generates natural language answer
# 6. add_citations → Attach entity/edge references
# 7. score_confidence → Compute confidence based on graph coverage
# 8. deliver → Return response with metadata

# CRITICAL: Step 5 (generate) receives ONLY graph data as context.
# The LLM system prompt explicitly says:
# "You are answering questions about infrastructure topology.
#  Use ONLY the graph query results provided below to answer.
#  If the results don't contain the information needed, say so.
#  Never infer, guess, or use your training knowledge for facts."
```

### Persona-specific system prompts

Each persona gets a tailored system prompt that controls:
- **What to emphasize** (developer → code links; executive → risk scores)
- **How to format** (SRE → terse, technical; PO → business-oriented)
- **What to proactively surface** (auditor → compliance gaps; dev → dependency warnings)

```python
PROMPTS = {
    "developer": """You help developers understand their services.
    Emphasize: dependencies, API contracts, repo links, deployment status.
    Format: technical, concise, include Cypher queries when helpful.
    Proactive: warn about circular dependencies, missing tests, stale images.""",
    
    "product_owner": """You help product owners understand capabilities.
    Emphasize: business domains, API functionality, service health, team ownership.
    Format: business-friendly, translate technical to business impact.
    Proactive: surface services without owners, APIs without documentation.""",
    
    "sre": """You help SREs during incidents and capacity planning.
    Emphasize: blast radius, dependency chains, health metrics, remediation paths.
    Format: terse, structured, time-sensitive. Lead with impact.
    Proactive: flag single points of failure, services without monitoring.""",
    
    "auditor": """You help auditors gather compliance evidence.
    Emphasize: policy compliance, gap analysis, evidence artifacts, remediation status.
    Format: formal, cite specific policies, audit-ready language.
    Proactive: list all non-compliant entities with severity.""",
    
    "executive": """You help executives understand portfolio health.
    Emphasize: aggregate metrics, risk posture, trend lines, team performance.
    Format: summary-first, no technical jargon, 3-sentence answers.
    Proactive: surface only critical risks and strategic concerns.""",
}
```

---

## AWS Infrastructure Repository (prism-infra)

The infrastructure is a separate repository with complete Terraform modules:

### Module architecture

```
terraform/modules/
├── networking/
│   ├── vpc.tf           # VPC with public/private subnets across 3 AZs
│   ├── security_groups.tf
│   ├── nat_gateway.tf
│   └── outputs.tf
├── eks/
│   ├── cluster.tf       # EKS cluster with managed node groups
│   ├── node_groups.tf   # t3.xlarge for API, r5.xlarge for Neo4j
│   ├── addons.tf        # CoreDNS, kube-proxy, VPC-CNI, EBS-CSI
│   ├── iam.tf           # Cluster role, node role, IRSA for pods
│   └── outputs.tf
├── neo4j/
│   ├── ec2.tf           # Dedicated EC2 (r5.2xlarge) with EBS gp3
│   ├── ebs.tf           # 500GB gp3, 3000 IOPS, encrypted
│   ├── backup.tf        # Nightly EBS snapshots, 30-day retention
│   └── security.tf      # SG: only allow from EKS nodes on 7687
├── redis/
│   ├── elasticache.tf   # Redis 7.x, r6g.large, single-node (dev) or cluster (prod)
│   └── security.tf
├── secrets/
│   ├── secrets_manager.tf  # Neo4j creds, LLM API keys, OIDC config
│   └── kms.tf              # Customer-managed KMS key
├── monitoring/
│   ├── cloudwatch.tf    # Log groups, metric filters, dashboards
│   ├── alarms.tf        # CPU, memory, Neo4j query latency, API 5xx
│   └── sns.tf           # Alert notifications
├── cdn/
│   ├── cloudfront.tf    # Frontend distribution
│   ├── s3.tf            # Static asset bucket
│   └── route53.tf       # DNS records
└── iam/
    ├── policies.tf      # Least-privilege policies
    └── roles.tf         # Service roles with IRSA
```

### Environment configurations

```hcl
# environments/dev/main.tf
module "networking" { source = "../../modules/networking"
  environment = "dev"
  vpc_cidr = "10.0.0.0/16"
}

module "eks" { source = "../../modules/eks"
  environment = "dev"
  cluster_version = "1.30"
  node_instance_type = "t3.large"
  node_desired_size = 2
  node_max_size = 4
}

module "neo4j" { source = "../../modules/neo4j"
  environment = "dev"
  instance_type = "r5.xlarge"
  volume_size = 100
  volume_iops = 3000
}
```

### Deployment pipeline (GitHub Actions)

```yaml
# Triggered on push to main for prism-infra repo
# 1. terraform plan (on PR)
# 2. terraform apply (on merge to main, with approval gate)
# 3. helm upgrade prism (deploys latest app image to EKS)
```

---

## When to add a new connector

1. Create `backend/app/connectors/{platform}/` directory
2. Create `connector.py` extending `BaseConnector`
3. Implement `produce_perspective()` → returns a `Perspective` object (CPT Layer 1)
4. Implement `generate_mock_perspective()` → returns synthetic `Perspective`
5. Register in `ConnectorRegistry`
6. Add authority domains to `AUTHORITY_MATRIX` (CPT Layer 4)
7. Write tests: perspective generation, mock data referential integrity
8. Add to Helm chart `values.yaml` connector list

### Connector interface (CPT-aware)

```python
class BaseConnector(ABC):
    """All connectors produce Perspectives, not raw entities."""
    
    @abstractmethod
    async def produce_perspective(self) -> Perspective:
        """Produce a complete perspective from this platform."""
        pass
    
    @abstractmethod
    def generate_mock_perspective(self, profile: str) -> Perspective:
        """Generate synthetic perspective for demos."""
        pass
    
    @abstractmethod
    async def healthcheck(self) -> bool:
        """Verify API connectivity."""
        pass
```

## When to add a new copilot tool

1. Add function to `backend/app/intelligence/copilot/tools.py`
2. Decorate with `@tool`, include detailed docstring explaining what data it returns
3. Add to tools list in `agent.py`
4. Ensure the tool returns structured data with entity IDs (for citation)
5. Update relevant persona prompts if the tool enables new question types
6. Add test scenarios covering: valid query, empty results, ambiguous query
7. Test that the copilot says "not found" when data doesn't exist (anti-hallucination)

---

## Critical don'ts

- **Never** interpolate user input into Cypher queries — parameterize everything
- **Never** let the LLM answer from training data — every fact must come from the graph
- **Never** store secrets in code, env files, or docker-compose — use Vault or K8s Secrets
- **Never** allow cross-tenant data access — middleware enforces tenant DB isolation
- **Never** use `print()` — use structured logging (`structlog`)
- **Never** skip type hints — every function signature must have them
- **Never** hardcode colors in the frontend — reference DESIGN.md tokens
- **Never** match entities by name alone — use CPT topological fingerprinting
- **Never** return confidence > 0.9 if fewer than 2 graph sources confirm the answer

---

## Testing requirements

Every PR must pass:
1. `make lint` — ruff + mypy (backend), eslint + tsc (frontend)
2. `make test` — pytest (backend), vitest (frontend)
3. Coverage minimum: 80% for `cpt/`, `intelligence/`, `graph/`
4. Anti-hallucination test suite: copilot asked about nonexistent entities must return "not found"
5. Tenant isolation test: data from tenant A must never appear in tenant B queries
