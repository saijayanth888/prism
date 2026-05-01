from abc import ABC, abstractmethod
from typing import Any

from app.cpt.models import Perspective


class BaseConnector(ABC):
    """Abstract base class for all platform connectors."""

    platform_name: str = ""

    def __init__(self, config: dict[str, Any], tenant_id: str):
        self.config = config
        self.tenant_id = tenant_id

    @abstractmethod
    async def produce_perspective(self) -> Perspective:
        """Produce a complete perspective from this platform."""

    @abstractmethod
    def generate_mock_perspective(self, profile: str = "medium") -> Perspective:
        """
        Generate synthetic perspective for demos.
        profile: "small" (10 apps), "medium" (50 apps), "large" (200 apps)
        """

    @abstractmethod
    async def healthcheck(self) -> bool:
        """Return True if the connector can reach its platform."""

    @property
    def name(self) -> str:
        return self.platform_name or self.__class__.__name__.lower().replace("connector", "")
