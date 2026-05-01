from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as api_v1_router
from app.config import get_settings
from app.logging_config import configure_logging
from app.middleware.tenant import TenantMiddleware

configure_logging()
log = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    # Startup: connect Neo4j
    try:
        from neo4j import AsyncGraphDatabase
        app.state.neo4j_driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
        await app.state.neo4j_driver.verify_connectivity()
        app.state.neo4j_connected = True
        log.info("neo4j.connected", uri=settings.neo4j_uri)
    except Exception as exc:
        app.state.neo4j_connected = False
        log.warning("neo4j.unavailable", error=str(exc))

    # Startup: connect Redis
    try:
        import redis.asyncio as aioredis
        app.state.redis = aioredis.from_url(settings.redis_url, decode_responses=True)
        await app.state.redis.ping()
        app.state.redis_connected = True
        log.info("redis.connected", url=settings.redis_url)
    except Exception as exc:
        app.state.redis_connected = False
        log.warning("redis.unavailable", error=str(exc))

    yield

    # Shutdown
    if hasattr(app.state, "neo4j_driver") and app.state.neo4j_driver:
        await app.state.neo4j_driver.close()
        log.info("neo4j.closed")

    if hasattr(app.state, "redis") and app.state.redis:
        await app.state.redis.aclose()
        log.info("redis.closed")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Prism API",
        version="0.1.0",
        description="Platform Intelligence API — unified knowledge graph over your technology estate",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(TenantMiddleware)

    app.include_router(api_v1_router)

    return app


app = create_app()
