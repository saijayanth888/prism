"""
Seed script: generates synthetic data and loads it into Neo4j.
Usage: python -m app.seed --profile medium --tenant demo
"""
import argparse
import asyncio
import sys

import structlog

from app.config import get_settings
from app.connectors.mock_engine import MockDataEngine
from app.cpt.convergence import ConvergenceEngine
from app.logging_config import configure_logging

configure_logging()
log = structlog.get_logger(__name__)


async def seed(profile: str, tenant: str) -> None:
    settings = get_settings()

    log.info("seed.start", profile=profile, tenant=tenant)

    # Step 1: Generate perspectives
    engine = MockDataEngine(seed=42)
    perspectives = engine.generate_all_perspectives(profile=profile, tenant_id=tenant)

    total_entities = sum(len(p.entities) for p in perspectives)
    total_edges = sum(len(p.relationships) for p in perspectives)
    log.info(
        "seed.perspectives_generated",
        platforms=len(perspectives),
        entities=total_entities,
        relationships=total_edges,
    )

    # Step 2: Run CPT convergence
    cpt = ConvergenceEngine(confidence_threshold=0.65)
    converged = await cpt.converge(perspectives)
    log.info("seed.convergence_complete", converged_entities=len(converged))

    # Step 3: Write to Neo4j (if available)
    try:
        from neo4j import AsyncGraphDatabase

        driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
        await driver.verify_connectivity()
        log.info("seed.neo4j_connected")

        async with driver.session(database="neo4j") as session:
            # Clear existing data for this tenant
            await session.run("MATCH (n) WHERE n.tenant_id = $tenant DETACH DELETE n", tenant=tenant)

            # Create constraints and indexes
            await _ensure_schema(session)

            # Write converged entities
            for ce in converged:
                # Create the primary converged node
                await session.run(
                    """
                    MERGE (e:Entity {converged_id: $id})
                    SET e.name = $name,
                        e.entity_type = $entity_type,
                        e.confidence = $confidence,
                        e.tenant_id = $tenant,
                        e.platforms = $platforms,
                        e.health_score = $health_score,
                        e.compliance_score = $compliance_score
                    """,
                    id=ce.converged_id,
                    name=ce.canonical_name,
                    entity_type=ce.entity_type.value,
                    confidence=ce.confidence,
                    tenant=tenant,
                    platforms=list(ce.perspectives.keys()),
                    health_score=ce.properties.get("health_score", 80),
                    compliance_score=ce.properties.get("compliance_score", 85),
                )

            # Write relationships from perspectives
            entity_name_to_id: dict[str, str] = {}
            for ce in converged:
                for entity in ce.perspectives.values():
                    entity_name_to_id[entity.entity_id] = ce.converged_id

            edge_count = 0
            for p in perspectives:
                for edge in p.relationships:
                    src_id = entity_name_to_id.get(edge.source_id)
                    tgt_id = entity_name_to_id.get(edge.target_id)
                    if src_id and tgt_id and src_id != tgt_id:
                        await session.run(
                            f"""
                            MATCH (a:Entity {{converged_id: $src}})
                            MATCH (b:Entity {{converged_id: $tgt}})
                            MERGE (a)-[r:{edge.relationship_type.value}]->(b)
                            SET r.platform = $platform, r.tenant_id = $tenant
                            """,
                            src=src_id,
                            tgt=tgt_id,
                            platform=edge.platform,
                            tenant=tenant,
                        )
                        edge_count += 1

        await driver.close()

        log.info(
            "seed.complete",
            entities=len(converged),
            relationships=edge_count,
            platforms=len(perspectives),
        )
        print(
            f"\n✓ Seeded {len(converged)} entities, {edge_count} relationships "
            f"across {len(perspectives)} platforms\n"
            f"  Neo4j browser: http://localhost:7474\n"
        )

    except Exception as exc:
        log.warning("seed.neo4j_unavailable", error=str(exc))
        print(
            f"\n⚠ Neo4j not available — converged {len(converged)} entities in memory.\n"
            f"  Start Docker with `make dev` then re-run `make seed`\n"
        )


async def _ensure_schema(session) -> None:
    constraints = [
        "CREATE CONSTRAINT IF NOT EXISTS FOR (e:Entity) REQUIRE e.converged_id IS UNIQUE",
    ]
    indexes = [
        "CREATE INDEX IF NOT EXISTS FOR (e:Entity) ON (e.name)",
        "CREATE INDEX IF NOT EXISTS FOR (e:Entity) ON (e.entity_type)",
        "CREATE INDEX IF NOT EXISTS FOR (e:Entity) ON (e.tenant_id)",
    ]
    for stmt in constraints + indexes:
        try:
            await session.run(stmt)
        except Exception:
            pass  # May already exist


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Prism with synthetic data")
    parser.add_argument(
        "--profile",
        choices=["small", "medium", "large"],
        default="medium",
        help="Data profile: small (10 apps), medium (50 apps), large (200 apps)",
    )
    parser.add_argument(
        "--tenant",
        default="demo",
        help="Tenant ID to seed data into",
    )
    args = parser.parse_args()
    asyncio.run(seed(args.profile, args.tenant))


if __name__ == "__main__":
    main()
