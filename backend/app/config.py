from functools import lru_cache
from typing import Optional

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class PrismSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "prism-local-dev"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Application
    environment: str = "development"
    log_level: str = "debug"
    cors_origins: str = (
        "http://localhost:3000,http://localhost:3001,http://localhost:3002,"
        "http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:3001,"
        "http://127.0.0.1:3002"
    )

    # Auth
    jwt_secret: str = "prism-dev-secret-change-in-production"

    # Multi-tenancy
    default_tenant: str = "demo"

    # LLM (ANTHROPIC_API_KEY and LLM_API_KEY are accepted via validation_alias)
    llm_provider: str = "anthropic"
    llm_api_key: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices(
            "llm_api_key",
            "ANTHROPIC_API_KEY",
            "LLM_API_KEY",
        ),
    )
    llm_model: str = "claude-sonnet-4-20250514"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> PrismSettings:
    return PrismSettings()
