.PHONY: dev down logs seed test-backend test-frontend lint clean shell-api shell-neo4j demo

# ─── Local development ──────────────────────────────────────────────────────

dev:
	docker-compose up --build

dev-detached:
	docker-compose up --build -d

down:
	docker-compose down

logs:
	docker-compose logs -f

# ─── Data ───────────────────────────────────────────────────────────────────

seed:
	docker-compose exec api python -m app.seed --profile medium --tenant demo

seed-small:
	docker-compose exec api python -m app.seed --profile small --tenant demo

seed-large:
	docker-compose exec api python -m app.seed --profile large --tenant demo

# ─── Testing ────────────────────────────────────────────────────────────────

test-backend:
	docker-compose exec api pytest

test-backend-coverage:
	docker-compose exec api pytest --cov=app --cov-report=term-missing

test-frontend:
	docker-compose exec frontend npm test

test:
	$(MAKE) test-backend
	$(MAKE) test-frontend

# ─── Linting & formatting ───────────────────────────────────────────────────

lint:
	docker-compose exec api ruff check app/
	docker-compose exec api ruff format --check app/
	docker-compose exec frontend npm run lint

format:
	docker-compose exec api ruff format app/
	docker-compose exec api ruff check --fix app/

# ─── Cleanup ────────────────────────────────────────────────────────────────

clean:
	docker-compose down -v

clean-all:
	docker-compose down -v --remove-orphans
	docker system prune -f

# ─── Shell access ───────────────────────────────────────────────────────────

shell-api:
	docker-compose exec api bash

shell-neo4j:
	docker-compose exec neo4j cypher-shell -u neo4j -p prism-local-dev

shell-redis:
	docker-compose exec redis redis-cli

# ─── Demo ───────────────────────────────────────────────────────────────────

demo: dev-detached seed
	@echo ""
	@echo "✓ Prism is running. Open http://localhost:3000 to explore."
	@echo ""
	@echo "Demo flow:"
	@echo "  1. Topology Explorer — 200+ nodes, 13 platforms"
	@echo "  2. Click payments-svc → Application Lens"
	@echo "  3. Ask Iris: 'What breaks if payments-api goes down?'"
	@echo "  4. Compliance Center → PCI-DSS gaps"
	@echo ""
