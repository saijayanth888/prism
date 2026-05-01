# PRISM — Technical Implementation Specification

## Version 1.0 | April 2026 | Build Reference for Claude Code / Devin / Codex

---

## Table of contents

1. Repository structure
2. Data engine architecture (tool-agnostic)
3. Neo4j schema design
4. Entity resolution pipeline
5. AI copilot and chatbot architecture
6. LLM router (model-agnostic)
7. API design (FastAPI)
8. Frontend component architecture
9. Claude Code prompts — section by section
10. Synthetic data engine
11. Helm chart and deployment
12. Testing strategy

---

## 1. Repository structure

```
prism/
├── AGENTS.md                          # Claude Code master instructions
├── SKILLS.md                          # Agent skill definitions
├── MEMORY.md                          # Agent context memory
├── docker-compose.yml                 # Local dev environment
├── Makefile                           # Common commands
├── helm/
│   └── prism/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-production.yaml
│       └── templates/
│           ├── deployment-api.yaml
│           ├── deployment-frontend.yaml
│           ├── deployment-neo4j.yaml
│           ├── deployment-redis.yaml
│           ├── configmap.yaml
│           ├── secrets.yaml
│           ├── ingress.yaml
│           └── cronjobs-connectors.yaml
├── backend/
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── alembic/                       # DB migrations (if any relational tables)
│   ├── app/
│   │   ├── main.py                    # FastAPI app entry
│   │   ├── config.py                  # Pydantic settings
│   │   ├── dependencies.py            # DI container
│   │   ├── middleware/
│   │   │   ├── auth.py                # OIDC/SAML + tenant extraction
│   │   │   ├── tenant.py              # Tenant context middleware
│   │   │   └── rate_limit.py
│   │   ├── models/
│   │   │   ├── base.py                # Base entity schema
│   │   │   ├── entities.py            # Node type models
│   │   │   ├── relationships.py       # Edge type models
│   │   │   └── tenant.py              # Tenant config model
│   │   ├── graph/
│   │   │   ├── client.py              # Neo4j driver wrapper
│   │   │   ├── schema.py              # Graph schema definitions
│   │   │   ├── queries.py             # Cypher query library
│   │   │   ├── entity_resolution.py   # Multi-pass entity resolver
│   │   │   ├── algorithms.py          # BFS, PageRank, Louvain wrappers
│   │   │   └── vector_index.py        # Neo4j vector search for RAG
│   │   ├── connectors/
│   │   │   ├── base.py                # Abstract connector interface
│   │   │   ├── registry.py            # Connector registry + factory
│   │   │   ├── mock_engine.py         # Synthetic data generator
│   │   │   ├── kubernetes/
│   │   │   │   ├── connector.py
│   │   │   │   └── mock.py
│   │   │   ├── github/
│   │   │   │   ├── connector.py
│   │   │   │   └── mock.py
│   │   │   ├── apiconnect/
│   │   │   │   ├── connector.py
│   │   │   │   └── mock.py
│   │   │   ├── datadog/
│   │   │   │   ├── connector.py
│   │   │   │   └── mock.py
│   │   │   └── ... (additional connectors)
│   │   ├── intelligence/
│   │   │   ├── llm_router.py          # Model-agnostic LLM provider router
│   │   │   ├── providers/
│   │   │   │   ├── base.py            # Abstract LLM provider
│   │   │   │   ├── openai.py
│   │   │   │   ├── anthropic.py
│   │   │   │   ├── azure_openai.py
│   │   │   │   ├── bedrock.py
│   │   │   │   ├── ollama.py
│   │   │   │   └── prism_llm.py       # Custom fine-tuned model
│   │   │   ├── copilot/
│   │   │   │   ├── agent.py           # LangGraph agent definition
│   │   │   │   ├── tools.py           # Graph query tools for agent
│   │   │   │   ├── prompts.py         # System prompts per persona
│   │   │   │   └── memory.py          # Conversation memory
│   │   │   ├── compliance/
│   │   │   │   ├── engine.py          # Rule evaluation engine
│   │   │   │   ├── rulesets/
│   │   │   │   │   ├── pci_dss.yaml
│   │   │   │   │   ├── soc2.yaml
│   │   │   │   │   └── hipaa.yaml
│   │   │   │   └── scorer.py          # Compliance scoring
│   │   │   └── health/
│   │   │       └── scorer.py          # Composite health scoring
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── entities.py        # CRUD endpoints for entities
│   │   │   │   ├── topology.py        # Graph traversal endpoints
│   │   │   │   ├── search.py          # Universal search
│   │   │   │   ├── copilot.py         # Chat/AI endpoints (WebSocket)
│   │   │   │   ├── compliance.py      # Compliance endpoints
│   │   │   │   ├── connectors.py      # Connector management
│   │   │   │   ├── blast_radius.py    # Impact analysis
│   │   │   │   ├── health.py          # Health scores
│   │   │   │   └── reports.py         # Report generation
│   │   │   └── websocket.py           # WebSocket handler for real-time
│   │   └── tasks/
│   │       ├── sync.py                # Connector sync tasks (Celery)
│   │       └── analytics.py           # Background analytics
│   └── tests/
│       ├── conftest.py
│       ├── test_entity_resolution.py
│       ├── test_graph_algorithms.py
│       ├── test_connectors/
│       └── test_copilot/
├── frontend/
│   ├── package.json
│   ├── Dockerfile
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── stores/                    # Zustand state management
│   │   │   ├── tenant.ts
│   │   │   ├── graph.ts
│   │   │   └── chat.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── TopBar.tsx
│   │   │   │   └── Shell.tsx
│   │   │   ├── graph/
│   │   │   │   ├── TopologyGraph.tsx   # D3.js force-directed graph
│   │   │   │   ├── NodeDetail.tsx
│   │   │   │   └── BlastRadiusOverlay.tsx
│   │   │   ├── copilot/
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   └── SuggestedQueries.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── MetricCard.tsx
│   │   │   │   ├── HealthDashboard.tsx
│   │   │   │   └── PlatformStatus.tsx
│   │   │   ├── compliance/
│   │   │   │   ├── ComplianceCenter.tsx
│   │   │   │   └── PolicyCard.tsx
│   │   │   ├── applens/
│   │   │   │   ├── ApplicationLens.tsx
│   │   │   │   └── DependencyChain.tsx
│   │   │   └── common/
│   │   │       ├── Search.tsx
│   │   │       ├── Badge.tsx
│   │   │       └── Loading.tsx
│   │   ├── hooks/
│   │   │   ├── useGraph.ts
│   │   │   ├── useChat.ts
│   │   │   └── useTenant.ts
│   │   ├── api/
│   │   │   └── client.ts              # Axios/fetch wrapper
│   │   └── types/
│   │       └── index.ts               # TypeScript interfaces
│   └── tests/
└── docs/
    ├── architecture.md
    ├── data-model.md
    ├── connector-sdk.md
    └── deployment-guide.md
```

---

## 2. Data engine architecture (tool-agnostic)

The data engine is the core innovation of Prism. It must be completely agnostic to any specific tool, vendor, or platform. Every connector — whether it talks to Kubernetes, Datadog, GitHub, or a customer's internal tool — must conform to the same interface and produce the same normalized entity types.

### Design principles

**Principle 1: Universal entity model.** Every platform entity (an API, a pod, a repository, a Kafka topic) maps to one of Prism's canonical entity types. The connector is responsible for this mapping. The graph engine never knows or cares where an entity came from.

**Principle 2: Relationship-first.** The value of Prism is in the edges, not the nodes. Every connector must discover not just entities but the relationships between them (depends-on, deployed-to, exposes, consumes, owns).

**Principle 3: Schema-on-write.** Entities are validated against the canonical schema when the connector writes them to the graph. This ensures consistency even as new connectors are added.

**Principle 4: Idempotent sync.** Every sync operation is idempotent. Running it twice produces the same graph state. Connectors use a fingerprint/hash to detect changes and only update what changed.

### Canonical entity types

```
Entity Types (Nodes):
├── Application         # Business application (top-level grouping)
├── Service             # Deployable service/microservice
├── API                 # API endpoint or product
├── Deployment          # Running instance of a service
├── Container           # Container/pod
├── Repository          # Source code repository
├── Pipeline            # CI/CD pipeline
├── Image               # Container image / artifact
├── Namespace           # Logical grouping (K8s namespace, org)
├── Topic               # Message queue topic (Kafka, RabbitMQ)
├── Database            # Database instance
├── Secret              # Secret/credential reference (metadata only)
├── Policy              # Security/compliance policy
├── Vulnerability       # CVE or security finding
├── Environment         # Environment (dev, staging, prod)
├── Domain              # Business domain
└── Team                # Owning team

Relationship Types (Edges):
├── DEPENDS_ON          # Service A depends on Service B
├── DEPLOYED_TO         # Service deployed to Namespace/Environment
├── EXPOSES             # Service exposes API
├── CONSUMES            # Service consumes API
├── BUILT_FROM          # Image built from Repository
├── RUNS_IN             # Container runs in Deployment
├── PUBLISHES_TO        # Service publishes to Topic
├── SUBSCRIBES_TO       # Service subscribes to Topic
├── OWNS                # Team owns Application/Service
├── BELONGS_TO          # Service belongs to Domain
├── SCANNED_BY          # Service scanned by Pipeline
├── HAS_VULNERABILITY   # Image/Service has Vulnerability
├── ENFORCES            # Policy enforces on Service/API
├── STORED_IN           # Data stored in Database
├── USES_SECRET         # Service uses Secret
└── GATEWAY_FOR         # API Gateway for backend Service
```

### Abstract connector interface

```python
# backend/app/connectors/base.py

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class EntityType(str, Enum):
    APPLICATION = "Application"
    SERVICE = "Service"
    API = "API"
    DEPLOYMENT = "Deployment"
    CONTAINER = "Container"
    REPOSITORY = "Repository"
    PIPELINE = "Pipeline"
    IMAGE = "Image"
    NAMESPACE = "Namespace"
    TOPIC = "Topic"
    DATABASE = "Database"
    SECRET = "Secret"
    POLICY = "Policy"
    VULNERABILITY = "Vulnerability"
    ENVIRONMENT = "Environment"
    DOMAIN = "Domain"
    TEAM = "Team"

class RelationshipType(str, Enum):
    DEPENDS_ON = "DEPENDS_ON"
    DEPLOYED_TO = "DEPLOYED_TO"
    EXPOSES = "EXPOSES"
    CONSUMES = "CONSUMES"
    BUILT_FROM = "BUILT_FROM"
    RUNS_IN = "RUNS_IN"
    PUBLISHES_TO = "PUBLISHES_TO"
    SUBSCRIBES_TO = "SUBSCRIBES_TO"
    OWNS = "OWNS"
    BELONGS_TO = "BELONGS_TO"
    SCANNED_BY = "SCANNED_BY"
    HAS_VULNERABILITY = "HAS_VULNERABILITY"
    ENFORCES = "ENFORCES"
    STORED_IN = "STORED_IN"
    USES_SECRET = "USES_SECRET"
    GATEWAY_FOR = "GATEWAY_FOR"

class NormalizedEntity(BaseModel):
    """Universal entity that every connector must produce."""
    entity_id: str              # Unique ID within this connector
    entity_type: EntityType
    name: str                   # Display name
    normalized_name: str        # Lowercase, stripped, for matching
    platform: str               # Source platform name
    platform_url: Optional[str] # Deep link back to source
    namespace: Optional[str]    # Logical grouping
    environment: Optional[str]  # dev/staging/prod
    labels: Dict[str, str]      # Key-value metadata
    properties: Dict[str, Any]  # Platform-specific properties
    fingerprint: str            # Hash for change detection
    discovered_at: datetime
    
class NormalizedRelationship(BaseModel):
    """Universal relationship between two entities."""
    source_id: str
    target_id: str
    relationship_type: RelationshipType
    platform: str
    properties: Dict[str, Any] = {}
    confidence: float = 1.0     # 0-1 confidence score

class SyncResult(BaseModel):
    """Result of a connector sync operation."""
    connector_name: str
    platform: str
    entities_discovered: int
    entities_created: int
    entities_updated: int
    entities_deleted: int
    relationships_discovered: int
    errors: List[str]
    duration_seconds: float
    synced_at: datetime

class ConnectorConfig(BaseModel):
    """Configuration for a connector instance."""
    name: str
    platform: str
    enabled: bool = True
    sync_interval_minutes: int = 15
    auth: Dict[str, Any] = {}   # Credentials (from Vault/Secrets)
    filters: Dict[str, Any] = {} # What to include/exclude
    options: Dict[str, Any] = {} # Connector-specific options

class BaseConnector(ABC):
    """
    Abstract base class for all Prism connectors.
    Every platform integration must implement this interface.
    The data engine only interacts with connectors through this contract.
    """
    
    def __init__(self, config: ConnectorConfig, tenant_id: str):
        self.config = config
        self.tenant_id = tenant_id
    
    @abstractmethod
    async def healthcheck(self) -> bool:
        """Verify API connectivity and credentials."""
        pass
    
    @abstractmethod
    async def discover(self) -> List[NormalizedEntity]:
        """Discover all entities in the target platform."""
        pass
    
    @abstractmethod
    async def discover_relationships(
        self, entities: List[NormalizedEntity]
    ) -> List[NormalizedRelationship]:
        """Discover relationships between entities."""
        pass
    
    @abstractmethod
    async def sync(self) -> SyncResult:
        """Full sync: discover entities + relationships, update graph."""
        pass
    
    @abstractmethod
    def generate_mock_data(
        self, profile: str = "medium"
    ) -> tuple[List[NormalizedEntity], List[NormalizedRelationship]]:
        """Generate realistic synthetic data for this connector type."""
        pass
    
    def normalize_name(self, name: str) -> str:
        """Standard name normalization for entity matching."""
        import re
        name = name.lower().strip()
        name = re.sub(r'[-_./\\]', '-', name)
        name = re.sub(r'-+', '-', name)
        name = name.strip('-')
        return name
    
    def compute_fingerprint(self, entity: dict) -> str:
        """Compute hash fingerprint for change detection."""
        import hashlib, json
        content = json.dumps(entity, sort_keys=True, default=str)
        return hashlib.sha256(content.encode()).hexdigest()[:16]
```

### How tool-agnosticism works

The key insight is that the graph engine and all downstream systems (copilot, compliance, blast radius, UI) never interact with platform-specific code. They only work with `NormalizedEntity` and `NormalizedRelationship` objects. The connector is the translation boundary.

```
Platform API (Kubernetes, GitHub, Datadog, etc.)
    │
    ▼
┌─────────────────────────────┐
│  Connector (Platform-Specific) │  ← Only this layer knows about the platform
│  - Speaks platform API         │
│  - Maps to canonical types     │
│  - Normalizes names            │
│  - Computes fingerprints       │
└─────────────────────────────┘
    │
    ▼  NormalizedEntity + NormalizedRelationship
┌─────────────────────────────┐
│  Entity Resolution Pipeline    │  ← Tool-agnostic
│  - Exact match                 │
│  - Normalized name match       │
│  - Fuzzy match                 │
│  - ML similarity scoring       │
└─────────────────────────────┘
    │
    ▼  Resolved entities (merged nodes)
┌─────────────────────────────┐
│  Neo4j Knowledge Graph         │  ← Tool-agnostic
│  - Canonical schema            │
│  - Cross-platform edges        │
│  - Graph algorithms            │
└─────────────────────────────┘
    │
    ▼  Cypher queries
┌─────────────────────────────┐
│  Intelligence Layer            │  ← Tool-agnostic
│  - AI Copilot (LangGraph)      │
│  - Compliance Engine           │
│  - Health Scoring              │
│  - Blast Radius                │
└─────────────────────────────┘
    │
    ▼  REST/WebSocket API
┌─────────────────────────────┐
│  React Frontend                │  ← Tool-agnostic
│  - Topology Graph (D3.js)      │
│  - Dashboards                  │
│  - Chat UI                     │
└─────────────────────────────┘
```

To add support for a new tool, you ONLY write a new connector class that implements `BaseConnector`. Nothing else changes. This is what makes Prism tool-agnostic.

---

## 3. Neo4j schema design

```cypher
// --- Constraints (per-tenant database) ---
CREATE CONSTRAINT entity_unique IF NOT EXISTS
FOR (e:Entity) REQUIRE (e.platform, e.entity_id) IS UNIQUE;

CREATE INDEX entity_name IF NOT EXISTS FOR (e:Entity) ON (e.normalized_name);
CREATE INDEX entity_type IF NOT EXISTS FOR (e:Entity) ON (e.entity_type);
CREATE INDEX entity_platform IF NOT EXISTS FOR (e:Entity) ON (e.platform);
CREATE INDEX entity_environment IF NOT EXISTS FOR (e:Entity) ON (e.environment);

// --- Node labels (all entities use :Entity base + type label) ---
// :Entity:Service
// :Entity:API
// :Entity:Deployment
// etc.

// --- Example node ---
CREATE (s:Entity:Service {
  entity_id: "ocp-payments-svc-001",
  entity_type: "Service",
  name: "payments-svc",
  normalized_name: "payments-svc",
  platform: "OpenShift",
  platform_url: "https://console.ocp.acme.com/k8s/ns/payments/deployments/payments-svc",
  namespace: "payments",
  environment: "production",
  labels: {app: "payments", team: "platform-alpha", tier: "backend"},
  fingerprint: "a1b2c3d4e5f6g7h8",
  discovered_at: datetime(),
  health_score: 94,
  compliance_score: 87
})

// --- Example relationships ---
MATCH (api:Entity:API {normalized_name: "payments-api"})
MATCH (svc:Entity:Service {normalized_name: "payments-svc"})
CREATE (api)-[:GATEWAY_FOR {
  platform: "API Connect",
  confidence: 1.0,
  discovered_at: datetime()
}]->(svc)

// --- Vector index for RAG ---
CREATE VECTOR INDEX entity_embeddings IF NOT EXISTS
FOR (e:Entity) ON (e.embedding)
OPTIONS {indexConfig: {
  `vector.dimensions`: 1536,
  `vector.similarity_function`: 'cosine'
}}
```

---

## 4. Entity resolution pipeline

Entity resolution is how Prism merges "payments-api" from API Connect with "payments-svc" from OpenShift and "payments-api-repo" from GitHub into a coherent application view. This is the hardest technical problem in Prism.

```
Pass 1: Exact match
  - Same normalized_name + same namespace → auto-merge (confidence 1.0)

Pass 2: Normalized match
  - Strip version suffixes (-v1, -v2), environment prefixes (prod-, stg-)
  - Match on base name + namespace → merge (confidence 0.9)

Pass 3: Label-based match
  - Entities sharing 3+ matching labels (app, team, domain) → merge (confidence 0.8)

Pass 4: Fuzzy match
  - Levenshtein distance < 3 on normalized names within same namespace → candidate (confidence 0.6)
  - Requires human review or ML confirmation

Pass 5: ML similarity (Phase 2+)
  - Embed entity names + properties using sentence transformer
  - Cosine similarity > 0.85 → candidate for merge
  - Train on confirmed merges to improve over time
```

---

## 5. AI copilot and chatbot architecture

The chatbot is built as a LangGraph agent with tool-calling capabilities over the Neo4j knowledge graph. It serves every persona differently based on their role.

### Agent architecture

```python
# Simplified LangGraph agent structure

from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

# Tools the agent can call
tools = [
    search_entities,        # Find entities by name, type, platform
    get_entity_detail,      # Get full detail for a specific entity  
    traverse_dependencies,  # Walk dependency chain (upstream/downstream)
    calculate_blast_radius, # BFS blast radius with depth
    check_compliance,       # Run compliance check on entity/application
    get_health_score,       # Get composite health score
    run_cypher_query,       # Execute arbitrary Cypher (with guardrails)
    list_vulnerabilities,   # Get vulns for entity/application
    compare_entities,       # Compare two entities side-by-side
    get_platform_status,    # Check connector sync status
]

# Persona-aware system prompts
SYSTEM_PROMPTS = {
    "developer": """You are Prism AI, the infrastructure intelligence copilot.
    The user is a developer. Focus on: service dependencies, API contracts,
    deployment status, repository links, and how to find what they need.
    Always include deep links back to source platforms.""",
    
    "product_owner": """You are Prism AI, the infrastructure intelligence copilot.
    The user is a product owner. Focus on: business capabilities, API functionality,
    service health, feature coverage, and business domain mapping.
    Translate technical details into business impact.""",
    
    "sre": """You are Prism AI, the infrastructure intelligence copilot.
    The user is an SRE/platform engineer. Focus on: blast radius, dependency chains,
    health metrics, incident scoping, and remediation paths.
    Be precise with technical details.""",
    
    "auditor": """You are Prism AI, the infrastructure intelligence copilot.
    The user is a compliance auditor. Focus on: policy compliance, gaps,
    evidence collection, remediation timelines, and audit-ready reports.
    Cite specific policies and controls.""",
    
    "executive": """You are Prism AI, the infrastructure intelligence copilot.
    The user is a VP/Director/CTO. Focus on: portfolio health, risk posture,
    platform adoption, team ownership, and strategic metrics.
    Summarize, don't detail.""",
}
```

### Example chatbot interactions by persona

**Developer asks:** "What APIs does payments-svc expose?"
→ Agent calls `search_entities(name="payments-svc", type="Service")`
→ Agent calls `traverse_dependencies(entity_id=..., direction="outbound", relationship="EXPOSES")`
→ Returns: "payments-svc exposes 3 APIs: payments-api (v2.1), refunds-api (v1.3), chargebacks-api (v1.0). All are registered in API Connect with OAuth2 policies active."

**Product owner asks:** "What functionality does the Payments domain cover?"
→ Agent calls `search_entities(type="Domain", name="Payments")`
→ Agent calls `traverse_dependencies(entity_id=..., direction="outbound", relationship="BELONGS_TO")`
→ Returns: "The Payments domain includes 12 services covering: payment processing, refund management, chargeback handling, fraud detection, and settlement. These services expose 8 APIs consumed by 23 downstream services across 4 other domains."

**SRE asks:** "If kafka-payments goes down, what's the blast radius?"
→ Agent calls `calculate_blast_radius(entity_name="kafka-payments", depth=3)`
→ Returns: "Blast radius: 8 services across 3 platforms. Critical path: kafka-payments → payments-svc → payments-api (142 active consumers). fraud-detector would lose real-time data. notification-svc would stop processing alerts. Estimated customer impact: payment processing delays for all channels."

---

## 6. LLM router (model-agnostic)

```python
# backend/app/intelligence/llm_router.py

class LLMRouter:
    """
    Model-agnostic LLM routing layer.
    Each tenant configures their preferred provider.
    Supports: OpenAI, Anthropic, Azure OpenAI, AWS Bedrock,
              Google Vertex, Ollama (local), Prism LLM (custom).
    """
    
    providers = {
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "azure_openai": AzureOpenAIProvider,
        "bedrock": BedrockProvider,
        "vertex": VertexProvider,
        "ollama": OllamaProvider,
        "prism": PrismLLMProvider,
    }
    
    async def route(self, tenant_id: str, messages: list, 
                    tools: list = None) -> LLMResponse:
        config = await self.get_tenant_llm_config(tenant_id)
        provider = self.providers[config.provider](config)
        
        try:
            return await provider.complete(messages, tools)
        except ProviderError:
            # Fallback chain
            for fallback in config.fallback_providers:
                try:
                    fb_provider = self.providers[fallback](config)
                    return await fb_provider.complete(messages, tools)
                except ProviderError:
                    continue
            raise AllProvidersFailedError()
```

---

## 7. API design (FastAPI)

### Core API endpoints

```
# Entity operations
GET    /api/v1/entities                    # List/search entities
GET    /api/v1/entities/{id}               # Get entity detail
GET    /api/v1/entities/{id}/dependencies   # Get dependency tree
GET    /api/v1/entities/{id}/blast-radius   # Calculate blast radius
GET    /api/v1/entities/{id}/compliance     # Compliance status

# Topology
GET    /api/v1/topology                    # Full graph for visualization
GET    /api/v1/topology/subgraph/{id}      # Subgraph around entity

# Search
GET    /api/v1/search?q=...               # Universal search
GET    /api/v1/search/semantic?q=...       # AI-powered semantic search

# Copilot
POST   /api/v1/copilot/chat               # Send message, get response
WS     /api/v1/copilot/stream             # WebSocket for streaming
GET    /api/v1/copilot/suggestions         # Context-aware suggestions

# Compliance
GET    /api/v1/compliance/dashboard        # Compliance overview
GET    /api/v1/compliance/gaps             # All compliance gaps
GET    /api/v1/compliance/policies         # Available policies

# Health
GET    /api/v1/health/dashboard            # Health overview
GET    /api/v1/health/applications         # Per-app health scores

# Connectors
GET    /api/v1/connectors                  # List connectors
POST   /api/v1/connectors/{id}/sync        # Trigger sync
GET    /api/v1/connectors/{id}/status      # Sync status

# Reports
POST   /api/v1/reports/generate            # Generate report
GET    /api/v1/reports/{id}/download        # Download report

# Admin
GET    /api/v1/admin/tenants               # List tenants
POST   /api/v1/admin/tenants               # Create tenant
GET    /api/v1/admin/system/health          # System health check
```

---

## 8. Frontend component architecture

### Key components and their data flow

```
App.tsx
├── Shell.tsx (layout wrapper)
│   ├── Sidebar.tsx
│   │   ├── TenantSelector (Zustand: tenantStore)
│   │   ├── ModuleNav (13 modules)
│   │   └── PlatformStatusMini
│   ├── TopBar.tsx
│   │   ├── UniversalSearch (debounced, calls /api/v1/search)
│   │   ├── FilterPills (entity type filters)
│   │   └── CopilotToggle
│   ├── MainContent (route-based)
│   │   ├── TopologyExplorer
│   │   │   ├── MetricCards (calls /api/v1/health/dashboard)
│   │   │   ├── TopologyGraph.tsx (D3.js force-directed)
│   │   │   │   ├── Uses: d3-force, d3-zoom, d3-selection
│   │   │   │   ├── Data: /api/v1/topology
│   │   │   │   ├── Click node → NodeDetail panel
│   │   │   │   └── Highlight edges on hover/select
│   │   │   └── NodeDetail / PlatformStatus (right panel)
│   │   ├── ApplicationLens
│   │   │   ├── AppHeader (name, domain, owner, scores)
│   │   │   ├── PlatformFootprint (badges)
│   │   │   ├── DependencyChain (tree view)
│   │   │   └── EventTimeline
│   │   ├── ComplianceCenter
│   │   ├── VulnerabilityIntel
│   │   ├── BlastRadius
│   │   ├── HealthDashboard
│   │   └── ... (other modules)
│   └── CopilotPanel.tsx (right sidebar)
│       ├── ChatMessages (scrollable)
│       ├── SuggestedQueries (context-aware)
│       └── ChatInput (WebSocket to /api/v1/copilot/stream)
```

### D3.js topology graph specification

```typescript
// Key D3 force simulation config for the topology graph
const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(edges).id(d => d.id).distance(100))
  .force("charge", d3.forceManyBody().strength(-300))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("collision", d3.forceCollide().radius(30));

// Node sizing: proportional to connection count (PageRank)
// Node color: mapped to entity_type (same palette as UI)
// Edge opacity: 0.2 default, 1.0 when source/target selected
// Click: select node, highlight connected edges, show detail panel
// Double-click: expand node to show sub-entities
// Drag: reposition node
// Scroll: zoom
// Filter: by platform, entity_type, environment, domain
```

---

## 9. Claude Code prompts — section by section

These are the exact prompts to feed into Claude Code (or Devin/Codex) to build each section of Prism. Each prompt is self-contained and builds on the repository structure defined above.

---

### Prompt 1: Project scaffolding

```
TASK: Initialize the Prism monorepo

Create the following project structure:

BACKEND (Python):
- Create backend/ directory with pyproject.toml
- Dependencies: fastapi, uvicorn, neo4j, pydantic, celery, redis, 
  langchain, langgraph, httpx, python-jose (JWT), python-multipart
- Create app/main.py with FastAPI app, CORS middleware, health endpoint
- Create app/config.py with Pydantic Settings (env-based config):
  NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, REDIS_URL, 
  JWT_SECRET, TENANT_HEADER, LLM_PROVIDER, LLM_API_KEY
- Create Dockerfile (python:3.12-slim, pip install, uvicorn entrypoint)

FRONTEND (React + TypeScript):
- Create frontend/ with Vite + React + TypeScript template
- Install: tailwindcss, @tanstack/react-query, zustand, d3, 
  react-router-dom, lucide-react, axios
- Configure tailwind.config.js with custom Prism color palette:
  prism-dark: #0F172A, prism-blue: #378ADD, prism-green: #1D9E75,
  prism-amber: #EF9F27, prism-red: #E24B4A, prism-purple: #7F77DD
- Create Dockerfile (node:20-alpine, npm build, serve with nginx)

INFRASTRUCTURE:
- Create docker-compose.yml with services:
  - api (backend, port 8000)
  - frontend (port 3000)
  - neo4j (port 7474/7687, with APOC plugins)
  - redis (port 6379)
- Create Makefile with targets: dev, build, test, lint, seed-data

Verify the entire stack starts with `docker-compose up` and the 
API health endpoint returns {"status": "ok", "version": "0.1.0"}.
```

---

### Prompt 2: Data engine and connector base

```
TASK: Build the tool-agnostic data engine

Working in backend/app/connectors/:

1. Create base.py with these exact classes (copy from spec):
   - EntityType (enum of 17 canonical types)
   - RelationshipType (enum of 16 canonical relationship types)
   - NormalizedEntity (Pydantic model)
   - NormalizedRelationship (Pydantic model)
   - SyncResult (Pydantic model)
   - ConnectorConfig (Pydantic model)
   - BaseConnector (abstract class with methods:
     healthcheck, discover, discover_relationships, sync, 
     generate_mock_data, normalize_name, compute_fingerprint)

2. Create registry.py:
   - ConnectorRegistry class that stores connector classes by name
   - register(name, connector_class) method
   - create(name, config, tenant_id) factory method
   - list_available() returns all registered connectors
   - Auto-discovery: scan connectors/ subpackages on startup

3. Create mock_engine.py:
   - MockDataEngine class with generate_enterprise(profile) method
   - Profiles: "small" (50 apps), "medium" (200 apps), "large" (1000 apps)
   - Generates internally consistent data:
     - Applications with realistic names (payments-svc, auth-gateway, etc.)
     - Services with correct naming per platform conventions
     - Cross-platform relationships (API in gateway → service in K8s → 
       repo in GitHub → image in registry)
     - Realistic vulnerability distributions (70% medium, 20% high, 10% critical)
     - Compliance gaps (15% of services have at least one gap)
   - Uses Faker library for realistic names, dates, versions

4. Write comprehensive tests in tests/test_connectors/:
   - Test entity normalization
   - Test fingerprint computation
   - Test mock data generation (validate referential integrity)
   - Test connector registry
```

---

### Prompt 3: Neo4j graph engine

```
TASK: Build the Neo4j graph engine layer

Working in backend/app/graph/:

1. Create client.py:
   - Neo4jClient class wrapping the neo4j Python driver
   - __init__(uri, user, password, database) — database param enables 
     multi-tenancy (each tenant gets a separate Neo4j database)
   - async execute_query(cypher, params) → list of records
   - async execute_write(cypher, params) → summary
   - Context manager for session/transaction handling
   - Connection pool configuration (max 50 connections)

2. Create schema.py:
   - apply_schema(client) function that creates:
     - Uniqueness constraint on (platform, entity_id)
     - Indexes on normalized_name, entity_type, platform, environment
     - Vector index on embedding property (1536 dimensions, cosine)
   - Schema is idempotent (IF NOT EXISTS on all operations)

3. Create queries.py — a library of reusable Cypher queries:
   - upsert_entity(entity: NormalizedEntity) — MERGE on platform+entity_id
   - upsert_relationship(rel: NormalizedRelationship)
   - search_entities(query, entity_type, platform, limit)
   - get_entity_by_id(entity_id, platform)
   - get_dependencies(entity_id, direction, depth, rel_types)
   - get_full_topology(limit) — for graph visualization
   - delete_stale_entities(platform, current_ids) — cleanup

4. Create algorithms.py:
   - blast_radius(entity_id, max_depth=3) → BFS traversal returning 
     all affected entities with hop distance
   - critical_nodes() → PageRank to find most connected entities
   - domain_clusters() → Louvain community detection
   - shortest_path(from_id, to_id) → shortest dependency path
   - All algorithms use APOC or GDS library procedures

5. Create entity_resolution.py:
   - EntityResolver class with resolve(entities) method
   - Five-pass pipeline as specified in section 4
   - Returns list of MergeCandidate(entity_a, entity_b, confidence, method)
   - auto_merge(candidates, threshold=0.8) — merges above threshold
   - Logs low-confidence candidates for human review

6. Create vector_index.py:
   - embed_entity(entity) → generate embedding using sentence-transformers
   - store_embedding(entity_id, embedding)
   - semantic_search(query, top_k=10) → nearest entities by embedding

Write tests for each module, especially:
- Test BFS blast radius with known graph topology
- Test entity resolution across platforms (same service, different names)
- Test idempotent upsert (run twice, same result)
```

---

### Prompt 4: AI copilot (LangGraph agent)

```
TASK: Build the AI copilot chatbot using LangGraph

Working in backend/app/intelligence/copilot/:

1. Create tools.py — tools the AI agent can call:
   Each tool is a Python function decorated with @tool that:
   - Takes natural language or structured params
   - Executes Cypher against Neo4j
   - Returns formatted results
   
   Tools to implement:
   a. search_entities(query: str, entity_type: str = None) 
      → Search graph by name/type
   b. get_entity_detail(entity_name: str) 
      → Full detail + connected entities
   c. traverse_dependencies(entity_name: str, direction: str, depth: int)
      → Walk dependency chain
   d. calculate_blast_radius(entity_name: str, max_depth: int = 3)
      → BFS impact analysis with affected services list
   e. check_compliance(entity_name: str = None, policy: str = None)
      → Run compliance check, return gaps
   f. get_health_score(entity_name: str = None)
      → Composite health score with breakdown
   g. list_vulnerabilities(severity: str = None, entity_name: str = None)
      → CVEs with workload correlation
   h. get_platform_overview()
      → Summary of all platforms, entity counts, sync status
   i. compare_entities(entity_a: str, entity_b: str)
      → Side-by-side comparison
   j. explain_relationship(entity_a: str, entity_b: str)
      → How two entities are connected (all paths)

2. Create prompts.py — system prompts per persona:
   - DEVELOPER_PROMPT: focus on dependencies, APIs, repos, deployment
   - PRODUCT_OWNER_PROMPT: focus on business capabilities, features, domain
   - SRE_PROMPT: focus on blast radius, incidents, health, remediation
   - AUDITOR_PROMPT: focus on compliance, evidence, policies, gaps
   - EXECUTIVE_PROMPT: focus on portfolio health, risk, adoption, metrics
   - DEFAULT_PROMPT: general-purpose infrastructure assistant
   
   Each prompt includes:
   - Role definition
   - Available tool descriptions
   - Response formatting guidelines (use markdown, cite entities)
   - Guardrails (never fabricate data, always query the graph)

3. Create agent.py — LangGraph agent:
   - Define state schema: messages, persona, tenant_id, context
   - Create tool node with all tools from tools.py
   - Create agent node that calls LLM via LLMRouter
   - Graph: agent → should_use_tool? → tool_node → agent → respond
   - Support streaming responses via async generator
   - Include conversation memory (last 20 messages per session)
   
4. Create memory.py:
   - ConversationMemory class backed by Redis
   - store_message(session_id, role, content)
   - get_history(session_id, limit=20)
   - clear_session(session_id)

5. Wire up the API endpoint in api/v1/copilot.py:
   - POST /api/v1/copilot/chat — synchronous chat
   - WebSocket /api/v1/copilot/stream — streaming chat
   - Both endpoints:
     - Extract tenant_id from JWT
     - Load persona from user profile (or accept as param)
     - Route to LangGraph agent
     - Return structured response with:
       - answer (markdown text)
       - sources (list of entity IDs referenced)
       - tools_used (which tools were called)
       - confidence (0-1 how confident the answer is)

Test the copilot with these scenarios:
- "What services depend on payments-api?" (traversal)
- "Show me all critical vulnerabilities" (filter)
- "What's the blast radius if kafka-payments goes down?" (BFS)
- "Are we PCI-DSS compliant?" (compliance check)
- "Give me an executive summary of platform health" (aggregation)
```

---

### Prompt 5: LLM router (model-agnostic)

```
TASK: Build the model-agnostic LLM router

Working in backend/app/intelligence/:

1. Create providers/base.py:
   - Abstract LLMProvider class with:
     - async complete(messages, tools, temperature, max_tokens) → LLMResponse
     - async stream(messages, tools) → AsyncGenerator[str]
     - get_model_info() → dict (name, context_window, cost_per_token)

2. Implement providers:
   a. providers/openai.py — OpenAI API (GPT-4o, o3)
   b. providers/anthropic.py — Anthropic API (Claude Sonnet, Opus)
   c. providers/azure_openai.py — Azure OpenAI endpoint
   d. providers/bedrock.py — AWS Bedrock (multi-model)
   e. providers/ollama.py — Local Ollama endpoint (llama3, mistral, etc.)
   f. providers/prism_llm.py — Custom Prism model endpoint (future)
   
   Each provider:
   - Normalizes messages to provider-specific format
   - Handles tool-calling format differences
   - Maps errors to common ProviderError types
   - Supports streaming

3. Create llm_router.py:
   - LLMRouter class with:
     - Per-tenant configuration (stored in Redis/DB):
       {provider, model, api_key, endpoint, fallback_providers,
        token_budget_daily, temperature_default}
     - route(tenant_id, messages, tools) → provider selection → call
     - Fallback chain: if primary fails, try fallbacks in order
     - Token tracking: log usage per tenant for billing
     - Rate limiting: per-tenant token budget enforcement
   
4. Create API endpoint api/v1/admin/llm.py:
   - GET /api/v1/admin/llm/config — get tenant LLM config
   - PUT /api/v1/admin/llm/config — update LLM provider/model
   - GET /api/v1/admin/llm/usage — token usage analytics
   - POST /api/v1/admin/llm/test — test provider connectivity

The tenant admin UI allows customers to:
- Select their LLM provider from a dropdown
- Enter their own API key (encrypted at rest)
- Choose model within that provider
- Set daily token budget
- Configure fallback providers
- Test connectivity before saving
```

---

### Prompt 6: Frontend — shell, sidebar, and topology

```
TASK: Build the Prism frontend shell and topology view

Working in frontend/src/:

1. Create the app shell (components/layout/):
   a. Shell.tsx — main layout with sidebar, topbar, content area, copilot panel
   b. Sidebar.tsx:
      - Collapsible (icon-only vs full)
      - Prism logo + branding
      - Tenant selector dropdown
      - 13 module navigation items with icons and badges
      - Platform status summary at bottom
      - Active module highlighted
   c. TopBar.tsx:
      - Universal search input (debounced 300ms)
      - Entity type filter pills (All, APIs, Services, Repos, Infra)
      - Copilot toggle button
      - User avatar / settings

2. Create the topology graph (components/graph/):
   a. TopologyGraph.tsx:
      - D3.js force-directed graph rendered in SVG
      - Fetch data from /api/v1/topology
      - Node circles colored by entity_type
      - Node size proportional to connection count
      - Edges as lines with directional arrows
      - Click node → select, highlight connected edges, dim others
      - Click background → deselect
      - Hover node → tooltip with name, platform, type
      - Zoom + pan with d3-zoom
      - Legend showing entity type → color mapping
      - Filter controls: by platform, type, environment
   b. NodeDetail.tsx:
      - Right panel showing selected node details
      - Properties table (type, platform, environment, etc.)
      - "Open in Application Lens" button
      - "Calculate Blast Radius" button
      - Connected entities list
   c. BlastRadiusOverlay.tsx:
      - When blast radius is calculated, overlay affected nodes
      - Color affected nodes by hop distance (darker = closer)
      - Show affected count badge

3. Create dashboard components (components/dashboard/):
   a. MetricCard.tsx — reusable stat card
   b. HealthDashboard.tsx — grid of metric cards
   c. PlatformStatus.tsx — list of connected platforms with sync status

4. Set up routing:
   - / → TopologyExplorer (default view)
   - /app/:id → ApplicationLens
   - /compliance → ComplianceCenter
   - /vulnerabilities → VulnerabilityIntel
   - /blast-radius → BlastRadius
   - /health → HealthDashboard
   - (other modules as placeholder pages)

5. Create Zustand stores (stores/):
   a. tenant.ts — current tenant, available tenants
   b. graph.ts — selected node, graph data, filters
   c. chat.ts — messages, session ID, copilot open/closed

Use Tailwind CSS throughout. No custom CSS files.
Follow the Prism color palette defined in tailwind.config.js.
Dark theme with light content areas.
```

---

### Prompt 7: Frontend — AI copilot chat panel

```
TASK: Build the AI copilot chat panel

Working in frontend/src/components/copilot/:

1. ChatPanel.tsx:
   - Right sidebar panel (300px width, full height)
   - Header: "Prism AI copilot" with status dot + active model name
   - Scrollable message area
   - Input area with send button
   - Connects to WebSocket /api/v1/copilot/stream
   - Shows streaming responses token-by-token
   - Persona selector (Developer, PO, SRE, Auditor, Executive)
   
2. ChatMessage.tsx:
   - User messages: right-aligned, blue background
   - Assistant messages: left-aligned, gray background
   - Support markdown rendering (code blocks, lists, bold)
   - Entity references are clickable → navigate to that entity
   - Show "tools used" badge below assistant messages
   - Timestamp on hover
   
3. SuggestedQueries.tsx:
   - Context-aware query suggestions
   - When a node is selected in topology:
     "What depends on {node.name}?"
     "Blast radius if {node.name} goes down?"
     "Is {node.name} compliant?"
   - When no node selected:
     "Show me critical vulnerabilities"
     "Give me a platform health summary"
     "Which services have the most dependencies?"
   - Click suggestion → sends as message

4. Create hooks/useChat.ts:
   - WebSocket connection management
   - Message state (zustand)
   - sendMessage(text, persona) function
   - Streaming response handler
   - Reconnection logic with backoff
   - Session management
```

---

### Prompt 8: Synthetic data seeding

```
TASK: Build the synthetic data seeding system

This is critical for demos and development. The seed data must be 
realistic enough to impress a CTO in a demo.

Working in backend/app/connectors/mock_engine.py:

Generate a "large enterprise" profile with these interconnected systems:

APPLICATIONS (20 business applications):
  payments, lending, accounts, cards, fraud, kyc, onboarding,
  notifications, reporting, analytics, authentication, authorization,
  api-gateway, mobile-bff, web-bff, batch-processing, data-pipeline,
  compliance-engine, risk-scoring, customer-360

For each application, generate:
- 3-8 services (e.g., payments-api, payments-processor, payments-worker)
- 1-3 APIs per service (in API Connect with OAuth policies)
- 1 deployment per service per environment (dev, staging, prod)
- 1 GitHub repo per service
- Container images with version tags
- Kafka topics where relevant
- Database connections

PLATFORMS to simulate:
- OpenShift: namespaces, deployments, pods, services, routes
- GitHub: repos, branches, GHAS findings, pipelines
- API Connect: products, plans, APIs, subscriptions, policies
- Datadog: APM services, monitors, SLOs
- ArgoCD: applications, sync status, health
- Confluent Kafka: topics, consumer groups, schemas
- AWS: EKS clusters, RDS instances, S3 buckets, Lambda functions
- Terraform: state files, resource counts
- ServiceNow: CIs, change requests
- Jira: projects, epics
- Vault: secret paths (metadata only)
- SonarQube: quality gates, findings
- Nexus: artifacts, images

RELATIONSHIPS to generate:
- API Gateway → Backend Service (GATEWAY_FOR)
- Service → Service (DEPENDS_ON) with realistic dependency graphs
- Service → Database (STORED_IN)
- Service → Kafka Topic (PUBLISHES_TO / SUBSCRIBES_TO)
- Image → Repository (BUILT_FROM)
- Service → Deployment (RUNS_IN)
- Team → Application (OWNS)
- Application → Domain (BELONGS_TO)
- Pipeline → Service (SCANNED_BY)
- Generate 10-15 CVEs with realistic CVSS scores

Create a CLI command: `python -m app.seed --profile large --tenant acme`
This should:
1. Create a Neo4j database for the tenant
2. Apply schema
3. Generate all synthetic data
4. Load into graph with entity resolution
5. Generate embeddings for vector search
6. Print summary statistics
```

---

### Prompt 9: Helm chart for self-hosted deployment

```
TASK: Create production-ready Helm chart for Prism

Working in helm/prism/:

1. Chart.yaml:
   - name: prism
   - version: 0.1.0
   - appVersion: 0.1.0
   - description: "Prism - Unified Platform Intelligence"

2. values.yaml with defaults for:
   - api: image, replicas, resources, env vars
   - frontend: image, replicas, resources
   - neo4j: image (neo4j:5-enterprise), storage (50Gi), plugins (apoc, gds)
   - redis: image, storage (5Gi)
   - ingress: enabled, hostname, tls
   - auth: oidc issuer URL, client ID, allowed groups
   - llm: default provider, model
   - connectors: list of enabled connectors with configs
   - persistence: storage class

3. Templates:
   a. deployment-api.yaml — FastAPI backend
   b. deployment-frontend.yaml — React frontend (nginx)
   c. statefulset-neo4j.yaml — Neo4j with persistent volume
   d. deployment-redis.yaml — Redis cache
   e. service-*.yaml — ClusterIP services for each
   f. ingress.yaml — Ingress with TLS
   g. configmap.yaml — Non-sensitive config
   h. secret.yaml — Sensitive config (base64)
   i. cronjob-sync.yaml — Connector sync schedules
   j. job-seed.yaml — One-time data seeding job
   k. networkpolicy.yaml — Restrict inter-pod traffic
   l. serviceaccount.yaml — RBAC for K8s connector
   m. hpa.yaml — Horizontal pod autoscaler for API

4. values-production.yaml overrides:
   - 3 API replicas, higher resource limits
   - Neo4j enterprise with backup schedule
   - TLS everywhere
   - Network policies enabled

5. NOTES.txt:
   - Post-install instructions
   - How to access the UI
   - How to seed demo data
   - How to configure SSO
```

---

## 10. Synthetic data engine details

The synthetic data engine generates data using configurable profiles. Each profile produces a complete, internally-consistent technology estate.

### Profile configurations

| Profile | Applications | Services | APIs | Repos | Platforms | Relationships | Total Entities |
|---------|-------------|----------|------|-------|-----------|---------------|----------------|
| Small   | 10          | 50       | 30   | 50    | 5         | ~400          | ~500           |
| Medium  | 50          | 250      | 150  | 250   | 9         | ~2,000        | ~2,500         |
| Large   | 200         | 1,000    | 600  | 1,000 | 13        | ~10,000       | ~12,000        |
| Enterprise | 500      | 5,000    | 3,000| 5,000 | 13+       | ~50,000       | ~60,000        |

### Naming conventions by platform

- OpenShift: `{app}-{component}` (e.g., `payments-processor`)
- GitHub: `{org}/{app}-{component}` (e.g., `acme/payments-processor`)
- API Connect: `{app}-api-v{version}` (e.g., `payments-api-v2`)
- Datadog: `{app}.{component}` (e.g., `payments.processor`)
- ArgoCD: `{env}-{app}-{component}` (e.g., `prod-payments-processor`)

The entity resolution engine must be able to recognize that all of these refer to the same underlying service.

---

## 11. Deployment architecture

### Self-hosted (primary)

```
Customer Kubernetes Cluster
├── namespace: prism-system
│   ├── prism-api (Deployment, 2-3 replicas)
│   ├── prism-frontend (Deployment, 2 replicas)
│   ├── prism-neo4j (StatefulSet, 1 replica + persistent volume)
│   ├── prism-redis (Deployment, 1 replica)
│   ├── prism-celery-worker (Deployment, 2 replicas)
│   ├── connector-sync-cronjobs (CronJob per connector)
│   └── prism-ingress (Ingress + TLS)
```

### AWS SaaS (Phase 3)

```
AWS Account
├── EKS Cluster
│   ├── prism-api (Fargate pods, auto-scaling)
│   ├── prism-frontend (Fargate + CloudFront CDN)
│   └── prism-celery (Fargate pods)
├── Neo4j Aura Enterprise (managed graph DB)
├── ElastiCache Redis (managed cache)
├── S3 (report storage, compliance artifacts)
├── Cognito (auth) + customer IdP federation
├── CloudWatch (monitoring)
├── WAF (web application firewall)
└── Route 53 (DNS) + ACM (TLS certificates)
```

---

## 12. Testing strategy

### Test pyramid

```
Unit Tests (70%)
├── Entity normalization
├── Fingerprint computation
├── Cypher query generation
├── Entity resolution logic
├── Compliance rule evaluation
├── Health scoring formulas
├── LLM router provider selection
└── Mock data validation

Integration Tests (20%)
├── Neo4j read/write operations
├── Entity resolution pipeline (end-to-end)
├── Connector sync cycle (mock mode)
├── Copilot tool execution
├── API endpoint contracts
└── WebSocket streaming

End-to-End Tests (10%)
├── Full demo flow: seed → explore → query → report
├── Multi-tenant isolation verification
├── SSO login → tenant routing → data access
└── Copilot conversation scenarios
```

### Key test scenarios

1. **Entity resolution accuracy**: Seed two connectors with overlapping entities using different naming conventions. Verify resolution correctly merges them.

2. **Blast radius correctness**: Create a known graph topology, calculate blast radius, verify the affected set matches the expected result.

3. **Tenant isolation**: Create two tenants, seed different data, verify tenant A cannot see tenant B's entities.

4. **Copilot groundedness**: Ask the copilot about entities that don't exist. Verify it says "not found" instead of hallucinating.

5. **Connector idempotency**: Run sync twice with same data. Verify entity count doesn't change.

---

## AGENTS.md (for Claude Code)

Place this at the root of the repository as `AGENTS.md`:

```markdown
# Prism — Agent Instructions

## Project overview
Prism is a platform intelligence product that creates a unified knowledge 
graph over an enterprise's technology estate. It connects to multiple 
platform tools (Kubernetes, GitHub, Datadog, API gateways, etc.) via 
pluggable connectors, resolves entities across platforms, and provides 
an AI copilot for querying the graph.

## Tech stack
- Backend: Python 3.12, FastAPI, Neo4j 5.x, Redis, Celery, LangGraph
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, D3.js, Zustand
- Infrastructure: Docker Compose (dev), Helm (prod), Kubernetes
- AI: LangGraph agent, model-agnostic LLM router

## Key architectural decisions
1. ALL platform-specific code lives in connectors/. Nothing else knows 
   about specific tools.
2. Entity resolution is a separate pipeline that runs after connectors 
   sync. It uses a five-pass approach (exact → normalized → label → 
   fuzzy → ML).
3. Multi-tenancy uses separate Neo4j databases per tenant.
4. The LLM router supports any provider. Customers bring their own LLM.
5. Every connector includes a mock data generator for demos.

## Code conventions
- Python: PEP 8, type hints everywhere, async/await for I/O
- TypeScript: strict mode, functional components, hooks
- Tests: pytest (backend), vitest (frontend)
- Commits: conventional commits (feat:, fix:, docs:, etc.)

## When adding a new connector
1. Create backend/app/connectors/{platform}/ directory
2. Implement connector.py extending BaseConnector
3. Implement mock.py with generate_mock_data()
4. Register in ConnectorRegistry
5. Add tests in tests/test_connectors/
6. Add to Helm values.yaml connector list

## When adding a new copilot tool
1. Add function to backend/app/intelligence/copilot/tools.py
2. Decorate with @tool and include docstring
3. Add to tools list in agent.py
4. Update system prompts if needed
5. Add test scenarios
```

---

*End of Technical Implementation Specification*
