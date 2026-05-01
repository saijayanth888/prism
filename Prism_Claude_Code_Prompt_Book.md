# PRISM — Claude Code Prompt Book

## Complete build prompts, ordered by execution sequence
## All prompts are local-first: Docker Compose → then AWS

> **How to use this file:**
> 1. Create your repository: `git init prism-core`
> 2. Copy AGENTS.md and DESIGN.md into the repo root
> 3. Open Claude Code in the repo
> 4. Paste each prompt below IN ORDER — wait for completion before moving to the next
> 5. After Prompt 10, you'll have a fully running local product with dummy data
> 6. Use the prism-infra prompts to deploy to AWS

---

## PROMPT 0 — Local dev environment (Docker Compose)

```
TASK: Create the local development environment for Prism

Prism is a platform intelligence product. Read AGENTS.md for full context.

Create the following at the repository root:

1. docker-compose.yml with these services:

   api:
     build: ./backend
     ports: ["8000:8000"]
     environment:
       - NEO4J_URI=bolt://neo4j:7687
       - NEO4J_USER=neo4j
       - NEO4J_PASSWORD=prism-local-dev
       - REDIS_URL=redis://redis:6379/0
       - ENVIRONMENT=development
       - LOG_LEVEL=debug
       - CORS_ORIGINS=http://localhost:3000
     depends_on: [neo4j, redis]
     volumes: ["./backend/app:/app/app"]  # hot reload
     command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

   frontend:
     build: ./frontend
     ports: ["3000:3000"]
     environment:
       - VITE_API_URL=http://localhost:8000
     volumes: ["./frontend/src:/app/src"]  # hot reload
     command: npm run dev -- --host 0.0.0.0

   neo4j:
     image: neo4j:5-enterprise
     ports: ["7474:7474", "7687:7687"]
     environment:
       - NEO4J_AUTH=neo4j/prism-local-dev
       - NEO4J_ACCEPT_LICENSE_AGREEMENT=yes
       - NEO4J_PLUGINS=["apoc", "graph-data-science"]
       - NEO4J_dbms_memory_heap_max__size=1G
       - NEO4J_dbms_security_procedures_unrestricted=apoc.*,gds.*
     volumes: ["neo4j_data:/data"]

   redis:
     image: redis:7-alpine
     ports: ["6379:6379"]
     volumes: ["redis_data:/data"]

   volumes:
     neo4j_data:
     redis_data:

2. Makefile with these targets:
   - dev: docker-compose up --build
   - down: docker-compose down
   - logs: docker-compose logs -f
   - seed: docker-compose exec api python -m app.seed --profile medium --tenant demo
   - test-backend: docker-compose exec api pytest
   - test-frontend: docker-compose exec frontend npm test
   - lint: runs ruff (backend) + eslint (frontend)
   - clean: docker-compose down -v (removes volumes)
   - shell-api: docker-compose exec api bash
   - shell-neo4j: docker-compose exec neo4j cypher-shell -u neo4j -p prism-local-dev

3. .env.example with all environment variables documented

4. .gitignore (Python + Node + Docker + IDE files)

5. README.md with:
   - "Quick Start" section: git clone → make dev → open localhost:3000
   - Prerequisites: Docker, Docker Compose
   - Architecture overview (one paragraph)
   - Link to AGENTS.md for developer guide

Verify: `docker-compose config` should validate without errors.
```

---

## PROMPT 1 — Backend scaffolding (FastAPI)

```
TASK: Scaffold the FastAPI backend for Prism

Create backend/ directory with this structure:

1. pyproject.toml with dependencies:
   fastapi>=0.111.0
   uvicorn[standard]>=0.30.0
   neo4j>=5.20.0
   redis>=5.0.0
   celery>=5.4.0
   pydantic>=2.7.0
   pydantic-settings>=2.3.0
   httpx>=0.27.0
   python-jose[cryptography]>=3.3.0
   python-multipart>=0.0.9
   langchain>=0.2.0
   langgraph>=0.1.0
   structlog>=24.1.0
   faker>=25.0.0
   sentence-transformers>=3.0.0

   [project.optional-dependencies]
   dev = ["pytest>=8.0", "pytest-asyncio>=0.23", "ruff>=0.4.0", "mypy>=1.10"]

2. backend/Dockerfile:
   FROM python:3.12-slim
   WORKDIR /app
   COPY pyproject.toml .
   RUN pip install --no-cache-dir .
   COPY app/ app/
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

3. backend/app/main.py:
   - FastAPI app with title="Prism API", version="0.1.0"
   - CORS middleware (origins from config)
   - Lifespan handler: on startup connect Neo4j + Redis, on shutdown close
   - Health endpoint: GET /health → {"status": "ok", "version": "0.1.0", "neo4j": "connected", "redis": "connected"}
   - Include API v1 router

4. backend/app/config.py:
   - PrismSettings(BaseSettings) with:
     neo4j_uri, neo4j_user, neo4j_password
     redis_url
     environment (dev/staging/prod)
     log_level
     cors_origins (list)
     jwt_secret (default for dev)
     default_tenant ("demo")
     llm_provider ("anthropic")
     llm_api_key (optional)
     llm_model ("claude-sonnet-4-20250514")
   - model_config: env_prefix="PRISM_", env_file=".env"

5. backend/app/dependencies.py:
   - get_settings() → cached PrismSettings
   - get_neo4j_client() → Neo4jClient (from graph/client.py)
   - get_redis() → Redis client
   - get_current_tenant() → extract tenant from request header or JWT

6. backend/app/middleware/tenant.py:
   - TenantMiddleware: extracts X-Tenant-ID header or from JWT claims
   - Sets tenant_id on request.state
   - Returns 401 if no tenant found (skip for /health endpoint)

7. backend/app/api/v1/__init__.py:
   - APIRouter with prefix="/api/v1"
   - Include sub-routers (entities, topology, search, iris, compliance, connectors, health, reports)
   - Create placeholder files for each sub-router with a single GET endpoint returning {"module": "name", "status": "placeholder"}

8. Logging setup with structlog:
   - JSON output in production
   - Pretty console output in development
   - Include tenant_id, request_id in every log line

9. backend/tests/conftest.py:
   - pytest fixtures for: test app client, test Neo4j connection, test Redis
   - Test settings override

10. backend/tests/test_health.py:
    - Test GET /health returns 200 with expected fields

Verify: The API should start with `uvicorn app.main:app` and /health should return OK.
Do NOT create the graph/, connectors/, or intelligence/ modules yet — those come in later prompts.
```

---

## PROMPT 2 — Frontend scaffolding (React + Tailwind)

```
TASK: Scaffold the React frontend for Prism

Read DESIGN.md in the repo root for all design tokens and guidelines.

Create frontend/ directory:

1. Initialize with Vite + React + TypeScript:
   Use the react-ts template structure

2. Install dependencies:
   tailwindcss @tailwindcss/vite
   @tanstack/react-query
   zustand
   d3 @types/d3
   react-router-dom
   lucide-react
   axios
   react-markdown

3. tailwind.config.js:
   - Add custom colors from DESIGN.md:
     prism: { dark: "#0B1222", mid: "#151D2E", slate: "#1E293B" }
     accent: "#22D3EE"
     graph: { api: "#3B82F6", service: "#10B981", database: "#8B5CF6", 
              queue: "#F59E0B", cache: "#EF6C00", repo: "#64748B",
              secret: "#EC4899", monitor: "#6366F1", deploy: "#22C55E" }
   - Font family: "Instrument Sans" (import from Google Fonts in index.html)
   - Mono font: "JetBrains Mono" (import from Google Fonts)

4. frontend/Dockerfile:
   Multi-stage: node:20-alpine for build, nginx:alpine for serve
   Copy built assets to nginx html directory
   Include nginx.conf that routes all paths to index.html (SPA)

5. Create src/api/client.ts:
   - Axios instance with baseURL from VITE_API_URL env var
   - Request interceptor: add X-Tenant-ID header from tenant store
   - Response interceptor: handle 401 (redirect to login)

6. Create src/stores/:
   a. tenant.ts (Zustand):
      - currentTenant: string
      - availableTenants: string[]
      - setTenant(id)

   b. graph.ts (Zustand):
      - selectedNodeId: string | null
      - graphData: { nodes: Node[], edges: Edge[] }
      - filters: { platforms: string[], entityTypes: string[], environments: string[] }
      - selectNode(id), clearSelection(), setFilters(), setGraphData()

   c. chat.ts (Zustand):
      - messages: ChatMessage[]
      - isOpen: boolean
      - isStreaming: boolean
      - persona: "developer" | "product_owner" | "sre" | "auditor" | "executive"
      - addMessage(), toggleChat(), setPersona(), clearMessages()

7. Create src/types/index.ts:
   - GraphNode: { id, label, entityType, platform, namespace, environment, healthScore, x?, y? }
   - GraphEdge: { source, target, relationshipType, platform, confidence }
   - ChatMessage: { id, role: "user"|"iris"|"system", text, citations?, toolsUsed?, confidence?, timestamp }
   - MetricCard: { label, value, trend, trendDirection }
   - Platform: { name, entityCount, status: "synced"|"syncing"|"error", lastSynced }

8. Create placeholder pages in src/pages/:
   - TopologyExplorer.tsx
   - ApplicationLens.tsx
   - ComplianceCenter.tsx
   - HealthDashboard.tsx
   - (other module pages as simple "Coming soon" placeholders)

9. Set up React Router in App.tsx:
   - / → TopologyExplorer
   - /app/:id → ApplicationLens
   - /compliance → ComplianceCenter
   - /health → HealthDashboard
   - /iris → dedicated Iris chat page (full screen)

10. Create src/components/layout/Shell.tsx:
    - Three-column layout as described in DESIGN.md
    - Import Sidebar, TopBar (as placeholder divs for now)
    - Right panel slot for Iris chat
    - Main content renders <Outlet /> from router

Verify: `npm run dev` should show the shell layout with sidebar placeholder and router working.
Do NOT build the actual components yet — those come in Prompts 6-7.
```

---

## PROMPT 3 — Data engine: CPT base classes + connector interface

```
TASK: Build the Convergent Perspective Topology (CPT) data engine base

Read the "CPT Engine" section in AGENTS.md carefully. This is the patent-pending core of Prism.

Create backend/app/cpt/ directory:

1. cpt/models.py — All Pydantic models for the CPT engine:

   EntityType enum: APPLICATION, SERVICE, API, DEPLOYMENT, CONTAINER,
     REPOSITORY, PIPELINE, IMAGE, NAMESPACE, TOPIC, DATABASE, SECRET,
     POLICY, VULNERABILITY, ENVIRONMENT, DOMAIN, TEAM

   RelationshipType enum: DEPENDS_ON, DEPLOYED_TO, EXPOSES, CONSUMES,
     BUILT_FROM, RUNS_IN, PUBLISHES_TO, SUBSCRIBES_TO, OWNS, BELONGS_TO,
     SCANNED_BY, HAS_VULNERABILITY, ENFORCES, STORED_IN, USES_SECRET, GATEWAY_FOR

   PerspectiveEntity(BaseModel):
     entity_id: str
     entity_type: EntityType
     name: str
     platform: str
     platform_url: str | None
     namespace: str | None
     environment: str | None
     labels: dict[str, str]
     properties: dict[str, Any]
     observed_at: datetime

   PerspectiveEdge(BaseModel):
     source_id: str
     target_id: str
     relationship_type: RelationshipType
     platform: str
     properties: dict[str, Any] = {}

   Perspective(BaseModel):
     platform: str
     observed_at: datetime
     entities: list[PerspectiveEntity]
     relationships: list[PerspectiveEdge]
     authority_domains: list[str]

   TopologyFingerprint(BaseModel):
     entity_id: str
     platform: str
     in_degree_by_type: dict[str, int]
     out_degree_by_type: dict[str, int]
     neighbor_type_signature: str
     local_clustering_coefficient: float
     request_rate_bucket: str  # "high"/"medium"/"low"/"unknown"
     error_rate_bucket: str
     deployment_frequency_bucket: str
     age_bucket: str
     change_velocity: str
     semantic_vector: list[float]  # 384-dim
     exposed_ports: list[int]
     protocol_hints: list[str]
     resource_class: str

     def similarity(self, other: "TopologyFingerprint") -> float:
       """Weighted multi-dimensional similarity. See AGENTS.md for weights:
       structural=0.35, resource=0.25, semantic=0.20, behavioral=0.10, temporal=0.10"""
       # Implement each dimension's similarity calculation
       # structural: Jaccard similarity of neighbor_type_signature
       # resource: overlap of ports + protocol_hints
       # semantic: cosine similarity of semantic_vector
       # behavioral: exact match of bucket values (1.0 if same, 0.5 if adjacent, 0.0 if different)
       # temporal: exact match of age_bucket + change_velocity

   ConvergenceCandidate(BaseModel):
     entity_a: PerspectiveEntity
     entity_b: PerspectiveEntity
     fingerprint_a: TopologyFingerprint
     fingerprint_b: TopologyFingerprint
     similarity_score: float
     dimension_scores: dict[str, float]  # per-dimension breakdown

   ConvergedEntity(BaseModel):
     """An entity that has been merged from multiple perspectives."""
     converged_id: str  # UUID
     canonical_name: str  # Best name chosen from perspectives
     entity_type: EntityType
     perspectives: dict[str, PerspectiveEntity]  # platform → entity
     confidence: float
     properties: dict[str, Any]  # Merged properties (truth-resolved)
     fingerprint: TopologyFingerprint | None

2. cpt/fingerprint.py — TopologyFingerprint computation:
   
   class FingerprintEngine:
     def compute(self, entity: PerspectiveEntity, perspective: Perspective) -> TopologyFingerprint:
       """Compute the multi-dimensional fingerprint for an entity."""
       # Structural: analyze edges in the perspective to compute degree by type
       # Behavioral: extract from entity.properties if APM data available, else "unknown"
       # Temporal: compute from entity.observed_at
       # Semantic: use sentence-transformers to embed name + labels
       # Resource: extract from entity.properties (ports, protocols)
       pass

     def _compute_structural(self, entity, perspective) -> dict:
       """Count in/out degree by entity type from perspective edges."""
       pass

     def _compute_semantic_vector(self, entity) -> list[float]:
       """Embed entity name + labels using sentence-transformers (all-MiniLM-L6-v2)."""
       # For local dev, use a small model. Cache embeddings.
       pass

     def _compute_neighbor_signature(self, in_degree, out_degree) -> str:
       """Create a sorted hash of neighbor type distribution."""
       import hashlib
       sig = sorted(list(in_degree.items()) + list(out_degree.items()))
       return hashlib.md5(str(sig).encode()).hexdigest()[:12]

3. cpt/convergence.py — Perspective convergence engine:

   class ConvergenceEngine:
     def __init__(self, fingerprint_engine: FingerprintEngine):
       self.fp = fingerprint_engine
       self.confidence_threshold = 0.7

     async def converge(self, perspectives: list[Perspective]) -> list[ConvergedEntity]:
       """
       Full convergence across all perspectives.
       1. Compute fingerprints for all entities in all perspectives
       2. Build similarity matrix (cross-platform pairs only)
       3. Apply scipy.optimize.linear_sum_assignment (Hungarian algorithm)
       4. Filter by confidence threshold
       5. Return converged entities
       """
       pass

     async def incremental_converge(self, existing: list[ConvergedEntity], new_perspective: Perspective) -> list[ConvergedEntity]:
       """Re-converge when a single platform syncs. Only recompute affected region."""
       pass

4. cpt/truth_resolver.py — Confidence-weighted truth resolution:

   AUTHORITY_MATRIX = {
     "kubernetes": {"replica_count": 1.0, "namespace": 1.0, "container_image": 1.0, "resource_limits": 1.0, "service_name": 0.6},
     "datadog": {"p99_latency": 1.0, "error_rate": 1.0, "throughput": 1.0, "service_name": 0.5},
     "apiconnect": {"api_contract": 1.0, "subscription_count": 1.0, "oauth_policy": 1.0, "api_name": 0.9},
     "github": {"source_code_url": 1.0, "branch_count": 1.0, "sast_findings": 1.0, "repo_name": 0.7},
     "argocd": {"sync_status": 1.0, "deployment_strategy": 1.0, "app_name": 0.6},
     "confluent": {"topic_partitions": 1.0, "consumer_lag": 1.0, "schema_registry": 1.0, "topic_name": 0.8},
   }

   class TruthResolver:
     def resolve(self, converged: ConvergedEntity) -> dict[str, Any]:
       """For each property, pick the value from the platform with highest authority."""
       pass

     def choose_canonical_name(self, perspectives: dict[str, PerspectiveEntity]) -> str:
       """Pick the best name from all perspectives using authority weights for service_name."""
       pass

5. cpt/__init__.py — Export all public classes

6. Create backend/app/connectors/base.py:
   
   class BaseConnector(ABC):
     def __init__(self, config: dict, tenant_id: str):
       self.config = config
       self.tenant_id = tenant_id

     @abstractmethod
     async def produce_perspective(self) -> Perspective:
       """Produce a complete perspective from this platform."""
       pass

     @abstractmethod
     def generate_mock_perspective(self, profile: str = "medium") -> Perspective:
       """Generate synthetic perspective for demos."""
       pass

     @abstractmethod
     async def healthcheck(self) -> bool:
       pass

7. Create backend/app/connectors/registry.py:
   - ConnectorRegistry with register(), create(), list_available()
   - Auto-discover connectors from subpackages

8. Write tests:
   - test_fingerprint.py: test similarity computation with known entities
   - test_convergence.py: test that two entities with same topology match
   - test_truth_resolver.py: test authority-based property resolution
   - test_models.py: test Pydantic model validation

Verify: All tests pass. Models serialize/deserialize correctly.
```

---

## PROMPT 4 — Synthetic data engine (dummy data)

```
TASK: Build the synthetic data engine that generates realistic enterprise infrastructure

This is CRITICAL — the dummy data must be good enough to demo to a CIO.

Create backend/app/connectors/mock_engine.py:

class MockDataEngine:
  """Generates interconnected mock Perspectives across 13 platforms."""

  PROFILES = {
    "small":  {"apps": 10,  "services_per_app": 3, "envs": ["dev", "prod"]},
    "medium": {"apps": 50,  "services_per_app": 5, "envs": ["dev", "staging", "prod"]},
    "large":  {"apps": 200, "services_per_app": 5, "envs": ["dev", "staging", "prod", "dr"]},
  }

  # Business domains
  DOMAINS = ["payments", "lending", "accounts", "cards", "fraud", "kyc",
             "onboarding", "notifications", "reporting", "analytics",
             "authentication", "mobile", "web", "batch", "compliance"]

  # Realistic service name patterns per domain
  SERVICE_PATTERNS = {
    "payments": ["payments-api", "payments-processor", "payments-worker", "payments-scheduler", "refunds-api", "settlements-svc"],
    "lending": ["loans-api", "credit-scoring", "underwriting-engine", "loan-origination", "collections-svc"],
    "accounts": ["accounts-api", "balance-service", "statements-generator", "account-events"],
    "cards": ["cards-api", "card-issuing", "card-activation", "pin-management", "card-controls"],
    "fraud": ["fraud-detector", "fraud-rules-engine", "fraud-alerts", "fraud-ml-scorer", "transaction-monitor"],
    "kyc": ["kyc-verification", "document-scanner", "identity-validator", "sanctions-checker"],
    # ... more patterns for other domains
  }

  def generate_all_perspectives(self, profile: str = "medium", tenant_id: str = "demo") -> list[Perspective]:
    """Generate perspectives for ALL platforms with internally consistent data."""
    
    # Step 1: Generate the "ground truth" application portfolio
    apps = self._generate_applications(profile)
    
    # Step 2: For each platform, generate a perspective that sees
    # the SAME applications but with platform-specific naming and metadata
    perspectives = []
    perspectives.append(self._generate_kubernetes_perspective(apps, profile))
    perspectives.append(self._generate_github_perspective(apps, profile))
    perspectives.append(self._generate_apiconnect_perspective(apps, profile))
    perspectives.append(self._generate_datadog_perspective(apps, profile))
    perspectives.append(self._generate_argocd_perspective(apps, profile))
    perspectives.append(self._generate_confluent_perspective(apps, profile))
    perspectives.append(self._generate_aws_perspective(apps, profile))
    perspectives.append(self._generate_terraform_perspective(apps, profile))
    perspectives.append(self._generate_servicenow_perspective(apps, profile))
    perspectives.append(self._generate_jira_perspective(apps, profile))
    perspectives.append(self._generate_vault_perspective(apps, profile))
    perspectives.append(self._generate_sonarqube_perspective(apps, profile))
    perspectives.append(self._generate_nexus_perspective(apps, profile))
    
    return perspectives

  IMPORTANT naming rules for realism:
  - Kubernetes names: "{service-name}" in namespace "{domain}"
  - GitHub repos: "acme/{service-name}" or "acme/{domain}-{component}"
  - API Connect: "{service-name}-api-v{version}" as product name
  - Datadog: "{domain}.{component}" (dot notation)
  - ArgoCD: "{env}-{domain}-{service}" 
  - These DIFFERENT names for the SAME service is what tests the CPT engine

  Generate realistic data including:
  - Health scores (70-100, weighted toward 85-95)
  - Compliance scores (60-100, with 15% having gaps)
  - 10-20 CVEs with CVSS scores (mix of medium/high/critical)
  - Deployment timestamps (spread over last 90 days)
  - Realistic dependency chains (payment flows, auth chains, event pipelines)
  - Consumer/producer relationships for Kafka topics
  - API subscription counts (5-500)
  - Pipeline pass/fail rates (90-99% pass)

Also create backend/app/seed.py:
  CLI script: python -m app.seed --profile medium --tenant demo
  1. Connect to Neo4j
  2. Create database for tenant (or use default for local dev)
  3. Apply schema (indexes, constraints)
  4. Generate all perspectives
  5. Run CPT convergence on perspectives
  6. Write converged entities + relationships to Neo4j
  7. Print summary: "Seeded {N} entities, {M} relationships across {P} platforms"

Verify: Run `make seed` and confirm data appears in Neo4j browser at localhost:7474
```

---

## PROMPT 5 — Neo4j graph engine

```
TASK: Build the Neo4j graph layer

Create backend/app/graph/:

1. graph/client.py:
   - Neo4jClient class wrapping async neo4j driver
   - __init__(uri, user, password, database="neo4j")
   - execute_read(cypher, params) → list[dict]
   - execute_write(cypher, params) → dict
   - Async context manager for sessions
   - Connection pool (max_size=50)
   - Health check method

2. graph/schema.py:
   - apply_schema(client) function:
     CREATE CONSTRAINT entity_unique IF NOT EXISTS FOR (e:Entity) REQUIRE (e.converged_id) IS UNIQUE
     CREATE INDEX idx_entity_name IF NOT EXISTS FOR (e:Entity) ON (e.canonical_name)
     CREATE INDEX idx_entity_type IF NOT EXISTS FOR (e:Entity) ON (e.entity_type)
     CREATE INDEX idx_entity_platform IF NOT EXISTS FOR (e:Entity) ON (e.platform)
     CREATE VECTOR INDEX entity_embeddings IF NOT EXISTS FOR (e:Entity) ON (e.embedding)
       OPTIONS {indexConfig: {`vector.dimensions`: 384, `vector.similarity_function`: 'cosine'}}
   - All operations are idempotent (IF NOT EXISTS)

3. graph/queries.py — Cypher query library:
   - upsert_converged_entity(entity: ConvergedEntity)
   - upsert_relationship(source_id, target_id, rel_type, properties)
   - search_entities(query: str, entity_type: str = None, platform: str = None, limit: int = 20)
   - get_entity(converged_id: str) → full entity with all perspective data
   - get_topology(limit: int = 500) → nodes + edges for graph visualization
   - get_dependencies(entity_id: str, direction: str, depth: int = 2)
   - get_application_view(app_name: str) → all entities belonging to an application
   - delete_stale(platform: str, current_ids: list[str])
   ALL QUERIES USE PARAMETERIZED CYPHER — never string interpolation.

4. graph/algorithms.py:
   - blast_radius(entity_id: str, max_depth: int = 3) → BFS using APOC:
     MATCH (start:Entity {converged_id: $id})
     CALL apoc.path.subgraphNodes(start, {maxLevel: $depth, relationshipFilter: "DEPENDS_ON>|CONSUMES>|GATEWAY_FOR>"})
     YIELD node RETURN node
   - critical_nodes(limit: int = 20) → PageRank:
     CALL gds.pageRank.stream('entity-graph') YIELD nodeId, score
   - domain_clusters() → Louvain community detection
   - shortest_path(from_id, to_id) → shortest dependency path

5. graph/vector_search.py:
   - store_embedding(entity_id: str, embedding: list[float])
   - semantic_search(query_embedding: list[float], top_k: int = 10)
   - Uses Neo4j's native vector index

Write tests:
- test_queries.py: test CRUD operations with a test Neo4j instance
- test_algorithms.py: create a known graph topology, verify blast radius returns expected nodes
```

---

## PROMPT 6 — Iris AI chatbot (LangGraph agent)

```
TASK: Build Iris — Prism's AI chatbot using LangGraph

Iris is Prism's graph-grounded AI assistant. Read the "AI Copilot — Anti-Hallucination Architecture"
section in AGENTS.md. CRITICAL: Iris never answers from training data. Every fact comes from the graph.

Create backend/app/intelligence/:

1. intelligence/copilot/tools.py — 10 graph query tools:

   @tool
   def search_entities(query: str, entity_type: str = None, platform: str = None) -> str:
     """Search the Prism knowledge graph for entities by name, type, or platform.
     Returns a list of matching entities with their key properties."""

   @tool
   def get_entity_detail(entity_name: str) -> str:
     """Get full details about a specific entity including all connected entities,
     health score, compliance status, and platform metadata."""

   @tool
   def traverse_dependencies(entity_name: str, direction: str = "downstream", depth: int = 2) -> str:
     """Walk the dependency chain from an entity. Direction is 'upstream' (what depends on me)
     or 'downstream' (what I depend on). Returns the full chain with relationship types."""

   @tool
   def calculate_blast_radius(entity_name: str, max_depth: int = 3) -> str:
     """Calculate the blast radius if an entity goes down. Uses BFS to find all
     affected services with hop distance. Returns affected entities grouped by depth."""

   @tool
   def check_compliance(entity_name: str = None, policy: str = None) -> str:
     """Check compliance status. If entity_name provided, check that entity.
     If policy provided (e.g., 'PCI-DSS'), check all entities against that policy.
     Returns gaps with severity and remediation guidance."""

   @tool
   def get_health_scores(entity_name: str = None) -> str:
     """Get composite health scores. If entity_name provided, get that entity's score breakdown.
     If not provided, get top-level dashboard metrics across all entities."""

   @tool
   def list_vulnerabilities(severity: str = None, entity_name: str = None) -> str:
     """List vulnerabilities (CVEs). Filter by severity (critical/high/medium/low)
     or by entity. Returns CVEs with CVSS scores and affected workloads."""

   @tool
   def get_platform_overview() -> str:
     """Get an overview of all connected platforms: entity counts, sync status,
     last sync time, and any errors."""

   @tool
   def compare_entities(entity_a: str, entity_b: str) -> str:
     """Compare two entities side by side: type, platform, health, compliance,
     dependencies, and key properties."""

   @tool
   def verify_entity_exists(entity_name: str) -> str:
     """ANTI-HALLUCINATION CHECK: Verify if an entity exists in the knowledge graph.
     Returns True/False with closest matches if not found exactly."""

   Each tool:
   - Calls the graph layer (graph/queries.py or graph/algorithms.py)
   - Returns structured text with entity IDs in [entity:name] citation format
   - Returns "NOT_FOUND: No entity matching '{name}' exists in the graph" for missing entities
   - Logs the query and result count with structlog

2. intelligence/copilot/prompts.py — Persona-aware system prompts:

   BASE_PROMPT = """You are Iris, the AI assistant for Prism platform intelligence.

   CRITICAL RULES:
   1. You MUST call at least one tool before answering any infrastructure question.
   2. You can ONLY state facts that appear in tool results. Never use your training data for infrastructure facts.
   3. If a tool returns NOT_FOUND, tell the user the entity was not found. Do NOT guess or infer.
   4. Every factual claim must include a citation: [entity:service-name] or [platform:kubernetes].
   5. If results are ambiguous, present the ambiguity to the user and ask them to clarify.
   6. Always mention data freshness: "Based on data synced {time} ago..."
   7. If you cannot answer confidently, say "I don't have enough data to answer that reliably."

   You have access to the Prism knowledge graph containing {entity_count} entities
   across {platform_count} connected platforms for tenant {tenant_name}."""

   PERSONA_PROMPTS = {
     "developer": BASE_PROMPT + "\n\nThe user is a developer. Emphasize: dependencies, API contracts, repo links, deployment status, code-level details. Include deep links to source platforms.",
     "product_owner": BASE_PROMPT + "\n\nThe user is a product owner. Emphasize: business capabilities, API functionality, service health, domain mapping. Translate technical details into business impact.",
     "sre": BASE_PROMPT + "\n\nThe user is an SRE. Emphasize: blast radius, dependency chains, health metrics, remediation paths. Be terse and technical. Lead with impact, then details.",
     "auditor": BASE_PROMPT + "\n\nThe user is a compliance auditor. Emphasize: policy compliance, gaps, evidence, remediation timelines. Use formal language. Cite specific policies.",
     "executive": BASE_PROMPT + "\n\nThe user is an executive. Emphasize: portfolio health, risk posture, trends. Summarize in 3 sentences max. No technical jargon.",
   }

3. intelligence/copilot/agent.py — LangGraph agent:

   State: messages, persona, tenant_id, tool_calls_count, confidence

   Graph flow:
   - classify_intent: determine what kind of question (entity lookup, blast radius, compliance, freeform)
   - select_and_run_tools: call appropriate tools based on intent
   - validate_results: check if results are non-empty, check entity existence
   - generate_response: call LLM with graph context ONLY
   - score_confidence: 1.0 if all from graph, 0.7 if reasoning applied, <0.5 triggers disclaimer
   - deliver: return response with citations and confidence

   Support streaming via async generator for WebSocket endpoint

4. intelligence/copilot/memory.py:
   - Redis-backed conversation memory
   - store_message(session_id, role, content)
   - get_history(session_id, limit=20)
   - clear_session(session_id)

5. intelligence/llm_router.py:
   - LLMRouter class with provider abstraction
   - For now, implement only AnthropicProvider (Claude)
   - Provider interface: complete(messages, tools, temperature) → response
   - Streaming support: stream(messages, tools) → AsyncGenerator
   - Per-tenant config: read from Redis or config file
   - Fallback: if Anthropic fails, log error and return "LLM unavailable" message

6. Wire up API endpoints in api/v1/iris.py:
   - POST /api/v1/iris/chat
     Body: { message: str, persona: str, session_id: str }
     Response: { answer: str, citations: list, tools_used: list, confidence: float }
   - WebSocket /api/v1/iris/stream
     Accept: { message, persona, session_id }
     Stream: tokens as they generate
   - GET /api/v1/iris/suggestions
     Based on current context (selected node, active module), return 3-5 suggested questions

7. Write anti-hallucination tests:
   - test_iris_nonexistent_entity: ask about "xyz-nonexistent-service" → must return "not found"
   - test_iris_tool_called: any infrastructure question must trigger at least 1 tool call
   - test_iris_citations: response must contain [entity:...] citations
   - test_iris_confidence: empty graph → confidence < 0.5 → disclaimer message

Verify: POST to /api/v1/iris/chat with "What services exist?" should return entities from the seeded graph.
```

---

## PROMPT 7 — Frontend: Shell, sidebar, topology graph

```
TASK: Build the Prism frontend shell, sidebar, and interactive topology graph

Read DESIGN.md for all design tokens. Use Tailwind utility classes only.

1. src/components/layout/Sidebar.tsx:
   - Width: 240px, collapsible to 56px
   - Dark background (#0B1222)
   - Top: Prism logo "P" badge + "PRISM" text (hidden when collapsed)
   - Below logo: tenant selector <select> dropdown
   - Navigation: 13 module items from this list:
     topology (◎), applens (◉), api (⬡), compliance (◧), vuln (△),
     blast (◎), iris (◈), domain (◬), health (◍), reports (▣),
     change (⟳), onboard (◐), market (⊞)
   - Active: cyan text on cyan/10 background
   - Inactive: slate-400 text
   - Bottom: platform count + entity count summary
   - Click module → navigate via react-router

2. src/components/layout/TopBar.tsx:
   - Height: 52px, white background, bottom border
   - Left: universal search input (Cmd+K hint)
   - Center: filter pills [All, APIs, Services, Repos, Infra]
   - Right: Iris toggle button, persona selector dropdown

3. src/components/layout/Shell.tsx:
   - Assembles sidebar + topbar + main content + Iris panel
   - Uses Zustand chat store for Iris panel visibility
   - Responsive: on small screens, sidebar auto-collapses

4. src/components/graph/TopologyGraph.tsx:
   THIS IS THE HERO COMPONENT. Must be visually impressive.
   - SVG container using D3.js force simulation
   - Fetch data from /api/v1/topology on mount
   - d3.forceSimulation with: forceLink(distance 120), forceManyBody(strength -400),
     forceCenter, forceCollide(radius 35)
   - Nodes: circles colored by entityType (use graph.* colors from tailwind)
   - Node radius: 8-20px proportional to connection count
   - Edges: lines with 0.5px stroke, 0.2 opacity default
   - Selected node: radius increases to 22px, 2px cyan stroke, connected edges go full opacity,
     unconnected nodes/edges dim to 15% opacity
   - Click node → update graphStore.selectedNodeId
   - Click background → clear selection
   - Hover → tooltip with name + platform + type
   - Zoom/pan with d3-zoom (bounded, min 0.3x max 3x)
   - Legend bar: entity type → color mapping

5. src/components/graph/NodeDetail.tsx:
   - Right panel (replaces Iris when node selected and Iris closed)
   - Shows: entity name (mono font), type badge, platform badge, health score,
     compliance status, namespace, environment, last synced
   - Properties table
   - "Open in application lens" button → navigate
   - "Calculate blast radius" button → call API
   - Connected entities list (grouped by relationship type)

6. src/components/dashboard/MetricCard.tsx:
   - Reusable stat card per DESIGN.md spec
   - Props: label, value, trend, trendDirection

7. src/pages/TopologyExplorer.tsx (full page):
   - Top: grid of 6 MetricCards (fetch from /api/v1/health/dashboard)
   - Below: flex row with TopologyGraph (flex-1) + NodeDetail/PlatformStatus (w-56)
   - PlatformStatus: list of 13 platforms with colored status dots + entity counts

Verify: Navigate to localhost:3000, see the full shell with sidebar, topology graph rendering
nodes from the seeded data, clicking nodes shows detail panel.
```

---

## PROMPT 8 — Frontend: Iris chat panel

```
TASK: Build the Iris AI chat panel

1. src/components/iris/IrisPanel.tsx:
   - Right sidebar, 320px width, full height
   - Header: "Iris" with green status dot + active model badge (e.g., "Claude Sonnet")
   - Scrollable message area
   - Persona selector: row of small pills [Dev, PO, SRE, Audit, Exec]
   - Input bar pinned to bottom: text input + send button
   - Connect to WebSocket /api/v1/iris/stream
   - Show streaming response token by token
   - When Iris panel is open and a graph node is selected, show suggested queries

2. src/components/iris/ChatMessage.tsx:
   - User messages: right-aligned, blue-50 background, rounded corners
   - Iris messages: left-aligned, gray-50 background
   - Render markdown (react-markdown) for Iris responses
   - Parse [entity:name] citations → render as clickable badges
     Click → navigate to that entity in topology or application lens
   - Show tools_used as small pills below Iris messages
   - Show confidence score as a subtle indicator (green/amber/red dot)
   - Timestamp on hover

3. src/components/iris/SuggestedQueries.tsx:
   - Show above the input when there are no messages or after Iris responds
   - Context-aware queries:
     If a node is selected:
       "What depends on {node.name}?"
       "Blast radius if {node.name} goes down?"
       "Is {node.name} compliant?"
       "Show me {node.name} in application lens"
     If no node selected:
       "Show me critical vulnerabilities"
       "Give me a platform health summary"
       "Which services have the most dependencies?"
       "Are we PCI-DSS compliant?"
       "What changed in the last 24 hours?"
   - Click suggestion → sends as message

4. src/hooks/useIris.ts:
   - WebSocket connection management
   - Auto-reconnect with exponential backoff
   - sendMessage(text: string, persona: string)
   - Streaming response accumulation
   - Session ID management (generate UUID, persist in localStorage)

5. Also create a full-page Iris view at /iris:
   - Centered chat interface (max-width 720px)
   - Full conversation history
   - Richer message display with more space
   - For users who prefer a dedicated chat experience

Verify: Open Iris panel, type "What services exist?", see streaming response
with citations from the seeded graph data.
```

---

## PROMPT 9 — Application Lens + Compliance views

```
TASK: Build the Application Lens and Compliance Center views

1. src/pages/ApplicationLens.tsx:
   - Route: /app/:id (entity converged_id or name)
   - Fetch full application data from /api/v1/entities/{id}
   - Header section:
     - App avatar (initials circle, colored by entity type)
     - App name (large, mono font), domain badge, owner/team
     - Three score cards inline: Health (green), Compliance (amber), Vulns (red count)
   - Platform footprint: row of platform badges showing which platforms this app touches
   - Dependency chain: tree view showing upstream → app → downstream chains
     Use monospace font, colored entity types, arrows between levels
   - Recent events: timeline of last 10 events (deployments, alerts, scans, compliance checks)
     Each event: timestamp + description + status dot (green/amber/red)
   - "Ask Iris about this app" button → opens Iris with context pre-filled

2. src/pages/ComplianceCenter.tsx:
   - Fetch from /api/v1/compliance/dashboard
   - Top: overall compliance score (large number) + trend
   - Policy cards grid: one card per policy (PCI-DSS, SOC2, HIPAA)
     Each card: policy name, pass/fail count, gap count, severity breakdown
   - Gaps table: list of all compliance gaps
     Columns: entity, platform, policy, severity (badge), gap description, remediation
     Sort by severity (critical first)
   - Filterable by policy, severity, platform

3. Create the backend API endpoints that these pages need:
   - GET /api/v1/entities/{id} → full entity detail with perspectives + dependencies
   - GET /api/v1/compliance/dashboard → overall scores + per-policy breakdown
   - GET /api/v1/compliance/gaps → list of gaps with filtering

4. Backend compliance engine (simplified for MVP):
   - backend/app/intelligence/compliance/engine.py
   - Simple rule-based checker that evaluates entity properties:
     - TLS check: does the entity have tls_enabled=true?
     - Auth check: does the API have oauth_policy set?
     - Branch protection: does the repo have branch_protection=true?
     - Image scanning: does the image have scan_result set?
   - Generate compliance scores from these checks
   - The mock data engine should seed some entities with gaps

Verify: Navigate to /app/payments-api, see the full application lens view.
Navigate to /compliance, see compliance dashboard with gaps from seeded data.
```

---

## PROMPT 10 — Integration, polish, and local deployment verification

```
TASK: Integration testing and local deployment verification

This is the final local prompt. After this, the product should be fully demo-able.

1. Verify the complete flow works end-to-end:
   a. `make dev` starts all containers
   b. `make seed` populates Neo4j with medium profile data
   c. Navigate to localhost:3000
   d. Topology graph loads with nodes and edges
   e. Click a node → detail panel appears
   f. Open Iris → ask "What services depend on payments-api?" → get grounded answer
   g. Navigate to /app/payments-api → application lens loads
   h. Navigate to /compliance → compliance dashboard loads with gaps
   i. Switch tenants in sidebar → data changes

2. Fix any integration issues:
   - CORS headers working between frontend and backend
   - WebSocket connection for Iris streaming works
   - Graph visualization renders correctly with seeded data
   - Entity citations in Iris responses are clickable
   - Search bar returns results

3. Add loading states:
   - Skeleton loaders for topology graph while data loads
   - Skeleton for metric cards
   - "Iris is thinking..." animation while streaming
   - Error states with retry buttons

4. Add a simple landing/login page:
   - src/pages/Login.tsx
   - Tenant selection + "Enter Prism" button
   - In dev mode, auto-login with "demo" tenant
   - Styled per DESIGN.md

5. Performance verification:
   - Topology graph renders 500+ nodes smoothly (D3 force simulation)
   - Iris response starts streaming within 2 seconds
   - Page transitions are instant (no loading between modules)
   - Neo4j queries return within 200ms for common operations

6. Create a demo script in docs/demo-script.md:
   - Step-by-step walkthrough for presenting to a CIO
   - What to click, what to say, what questions to ask Iris
   - Covers: topology exploration, blast radius, compliance gaps, Iris conversation

7. Update README.md with:
   - Screenshot of the running product
   - Full setup instructions
   - Architecture diagram (text-based)
   - "Demo in 5 minutes" quickstart

Verify: The entire product runs locally with `make dev && make seed`.
A non-technical person can follow docs/demo-script.md and give the demo.
```

---

## AWS INFRASTRUCTURE PROMPTS (prism-infra repository)

---

## PROMPT AWS-1 — Infrastructure repository setup

```
TASK: Create the prism-infra repository with Terraform + Helm

This is a SEPARATE repository from prism-core.

1. Initialize the repository structure:
   prism-infra/
   ├── README.md
   ├── AGENTS.md (infra-specific agent instructions)
   ├── terraform/
   │   ├── modules/
   │   ├── environments/
   │   │   ├── dev/
   │   │   ├── staging/
   │   │   └── production/
   │   └── backend.tf
   ├── helm/
   │   └── prism/
   └── .github/workflows/

2. terraform/backend.tf:
   - S3 backend for state (bucket: prism-terraform-state)
   - DynamoDB table for locking (table: prism-terraform-locks)
   - Region: us-east-1 (configurable)

3. terraform/modules/networking/:
   - VPC with CIDR 10.0.0.0/16
   - 3 public subnets (10.0.1.0/24, .2, .3) across 3 AZs
   - 3 private subnets (10.0.10.0/24, .11, .12) across 3 AZs
   - NAT Gateway (single for dev, one per AZ for prod)
   - Internet Gateway
   - Route tables
   - Security groups:
     - eks-cluster-sg: allow inbound 443 from VPC
     - neo4j-sg: allow 7687 from eks-nodes-sg only
     - redis-sg: allow 6379 from eks-nodes-sg only

4. terraform/modules/eks/:
   - EKS cluster version 1.30
   - Managed node group: t3.xlarge, min 2 / desired 3 / max 6
   - EKS addons: CoreDNS, kube-proxy, vpc-cni, ebs-csi-driver
   - IRSA (IAM Roles for Service Accounts) for pod-level permissions
   - Cluster autoscaler IAM role
   - aws-auth configmap for RBAC

5. terraform/modules/neo4j/:
   - EC2 instance: r5.xlarge (dev), r5.2xlarge (prod)
   - EBS gp3 volume: 200GB (dev), 500GB (prod), 3000 IOPS
   - Encrypted with KMS
   - In private subnet
   - User data script: install Neo4j Enterprise, APOC, GDS plugins
   - Nightly EBS snapshot backup, 30-day retention

6. terraform/modules/redis/:
   - ElastiCache Redis 7.x
   - r6g.large (dev: single node, prod: 2-node cluster)
   - In private subnet
   - Encryption in transit and at rest

7. terraform/modules/secrets/:
   - AWS Secrets Manager for: Neo4j credentials, LLM API keys, JWT secret, OIDC config
   - KMS key for encryption (customer-managed)

8. terraform/modules/monitoring/:
   - CloudWatch log groups for EKS, Neo4j, application logs
   - CloudWatch alarms: CPU > 80%, memory > 85%, Neo4j query latency > 500ms, API 5xx > 1%
   - SNS topic for alerts with email subscription

9. terraform/modules/cdn/:
   - S3 bucket for frontend static assets
   - CloudFront distribution with S3 origin
   - Route53 hosted zone + A record (if domain configured)
   - ACM certificate (us-east-1 for CloudFront)

10. terraform/environments/dev/main.tf:
    - Wire all modules together with dev-sized resources
    - Variables file with overridable values
    - Outputs: EKS cluster endpoint, Neo4j private IP, Redis endpoint, CloudFront URL

11. Create deployment workflow .github/workflows/deploy.yml:
    - On PR: terraform plan → comment plan output on PR
    - On merge to main: terraform apply (with manual approval gate)
    - Then: helm upgrade prism ./helm/prism -f helm/prism/values-{env}.yaml

Verify: `terraform init && terraform validate` passes for dev environment.
```

---

## PROMPT AWS-2 — Helm chart for Kubernetes deployment

```
TASK: Create the production Helm chart for Prism

Create helm/prism/:

1. Chart.yaml:
   name: prism
   version: 0.1.0
   appVersion: "0.1.0"
   description: "Prism — Unified Platform Intelligence"

2. values.yaml (defaults for dev):

   global:
     tenant: "demo"
     domain: "prism.local"

   api:
     image: prism-api:latest
     replicas: 2
     resources:
       requests: { cpu: 500m, memory: 512Mi }
       limits: { cpu: 1000m, memory: 1Gi }
     env:
       NEO4J_URI: "bolt://neo4j:7687"
       REDIS_URL: "redis://redis:6379/0"
       LOG_LEVEL: "info"

   frontend:
     image: prism-frontend:latest
     replicas: 2
     resources:
       requests: { cpu: 100m, memory: 128Mi }
       limits: { cpu: 250m, memory: 256Mi }

   neo4j:
     enabled: true  # false if using external Neo4j (e.g., Aura or EC2)
     image: neo4j:5-enterprise
     storage: 50Gi
     storageClass: gp3
     resources:
       requests: { cpu: 1000m, memory: 2Gi }
       limits: { cpu: 2000m, memory: 4Gi }

   redis:
     enabled: true  # false if using ElastiCache
     image: redis:7-alpine
     storage: 5Gi

   ingress:
     enabled: true
     className: nginx
     host: prism.local
     tls: false

   iris:
     defaultProvider: "anthropic"
     defaultModel: "claude-sonnet-4-20250514"

3. Templates:
   - deployment-api.yaml (with readiness/liveness probes on /health)
   - deployment-frontend.yaml (nginx serving static files)
   - statefulset-neo4j.yaml (with PVC for data persistence)
   - deployment-redis.yaml
   - service-api.yaml (ClusterIP, port 8000)
   - service-frontend.yaml (ClusterIP, port 80)
   - service-neo4j.yaml (ClusterIP, ports 7474 + 7687)
   - service-redis.yaml (ClusterIP, port 6379)
   - ingress.yaml (route / to frontend, /api to api)
   - configmap.yaml (non-sensitive environment variables)
   - secret.yaml (base64-encoded sensitive values)
   - job-seed.yaml (one-time seed job: runs `python -m app.seed`)
   - hpa-api.yaml (HPA: min 2, max 8, target CPU 70%)
   - networkpolicy.yaml (restrict: only api → neo4j, only api → redis)
   - serviceaccount.yaml (for IRSA if on EKS)

4. values-production.yaml (overrides for prod):
   api.replicas: 3
   api.resources.limits: { cpu: 2000m, memory: 2Gi }
   neo4j.storage: 500Gi
   neo4j.resources.limits: { cpu: 4000m, memory: 8Gi }
   ingress.tls: true
   ingress.host: "prism.yourdomain.com"

5. NOTES.txt (post-install instructions):
   "Prism has been deployed!
   1. Access the UI: kubectl port-forward svc/prism-frontend 3000:80
   2. Seed demo data: kubectl create job prism-seed --from=job/prism-seed-template
   3. Configure SSO: update the secret with your OIDC provider details
   4. Check status: kubectl get pods -l app.kubernetes.io/name=prism"

Verify: `helm template prism ./helm/prism` renders valid YAML.
`helm lint ./helm/prism` passes without errors.
```

---

## Execution checklist

After running all prompts in order:

| Step | Command | Expected Result |
|------|---------|----------------|
| 1 | `make dev` | All 4 containers start (api, frontend, neo4j, redis) |
| 2 | `curl localhost:8000/health` | `{"status":"ok","version":"0.1.0"}` |
| 3 | `make seed` | "Seeded X entities, Y relationships across 13 platforms" |
| 4 | Open localhost:3000 | Prism UI loads with topology graph |
| 5 | Click a graph node | Detail panel shows entity properties |
| 6 | Open Iris | Chat panel slides in from right |
| 7 | Ask "What depends on payments-api?" | Iris responds with grounded answer + citations |
| 8 | Navigate to /compliance | Compliance dashboard shows gaps |
| 9 | Navigate to /app/payments-api | Application lens shows full 360° view |
| 10 | `helm lint ./helm/prism` | Helm chart validates |

---

## What to do after all prompts complete

1. Record a 3-minute demo video following docs/demo-script.md
2. Push to GitHub (private repo)
3. Set up CI with GitHub Actions (lint + test on PR)
4. Deploy to AWS dev environment with prism-infra terraform
5. Configure a real domain and TLS certificate
6. Book CIO meetings and demo the live product

---

*Prism — See Everything. Understand Everything. Secure Everything.*
*Iris — Your infrastructure speaks. Iris translates.*
