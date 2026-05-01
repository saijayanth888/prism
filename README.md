# Prism — Platform Intelligence

> The Bloomberg Terminal for infrastructure. Unified visibility across your entire technology estate, powered by an AI that understands the topology and never hallucinates.

## Quick Start

```bash
git clone <repo-url> && cd prism
cp .env.example .env          # add your ANTHROPIC_API_KEY
make dev                       # starts api + frontend + neo4j + redis
make seed                      # populates demo data (13 platforms, 200+ entities)
open http://localhost:3000
```

**Prerequisites**: Docker, Docker Compose

## What it does

Prism connects to 13+ platforms (Kubernetes, GitHub, Datadog, Kafka, ArgoCD, and more) and resolves all their entities — even when the same service is named `payments-svc` in K8s, `payments-api-v2` in API Gateway, and `prod-payments` in Datadog — into a single unified knowledge graph.

On top of that graph, Prism runs **Iris**, an AI copilot that answers questions exclusively from graph data (no hallucination) with source citations on every claim.

## Architecture

React frontend → FastAPI backend → Neo4j graph database + Redis cache. The core innovation is the **CPT Engine** (Convergent Perspective Topology), a patent-pending topological fingerprinting algorithm that resolves cross-platform entity identity without relying on names.

See [AGENTS.md](AGENTS.md) for the full developer guide, architecture reference, and code conventions.

## Common commands

| Command | Description |
|---------|-------------|
| `make dev` | Start all services with hot-reload |
| `make seed` | Populate Neo4j with 50-app demo dataset |
| `make seed-large` | Populate with 200-app dataset |
| `make test` | Run backend + frontend tests |
| `make lint` | Lint backend (ruff) + frontend (eslint) |
| `make logs` | Tail all service logs |
| `make clean` | Tear down + delete volumes |
| `make shell-api` | Shell into the API container |
| `make shell-neo4j` | Cypher shell into Neo4j |
| `make demo` | Start + seed in one command |
