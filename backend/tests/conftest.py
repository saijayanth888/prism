import pytest
from fastapi.testclient import TestClient

from app.config import PrismSettings
from app.main import create_app


@pytest.fixture
def test_settings():
    return PrismSettings(
        neo4j_uri="bolt://localhost:7687",
        neo4j_user="neo4j",
        neo4j_password="test",
        redis_url="redis://localhost:6379/1",
        environment="development",
        log_level="debug",
        default_tenant="test-tenant",
    )


@pytest.fixture
def client():
    app = create_app()
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
