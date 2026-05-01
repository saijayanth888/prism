from __future__ import annotations

from typing import Any, Type

import structlog

from app.connectors.base import BaseConnector

log = structlog.get_logger(__name__)


class ConnectorRegistry:
    """Registry for all available platform connectors."""

    _registry: dict[str, Type[BaseConnector]] = {}

    @classmethod
    def register(cls, name: str, connector_class: Type[BaseConnector]) -> None:
        cls._registry[name] = connector_class
        log.debug("connector.registered", name=name)

    @classmethod
    def create(
        cls, name: str, config: dict[str, Any], tenant_id: str
    ) -> BaseConnector:
        if name not in cls._registry:
            raise KeyError(f"Connector '{name}' not registered. Available: {cls.list_available()}")
        return cls._registry[name](config=config, tenant_id=tenant_id)

    @classmethod
    def list_available(cls) -> list[str]:
        return sorted(cls._registry.keys())

    @classmethod
    def auto_discover(cls) -> None:
        """
        Auto-import all connector subpackages so they can self-register.
        Call once at application startup.
        """
        import importlib
        import pkgutil
        import app.connectors as connectors_pkg

        for finder, module_name, is_pkg in pkgutil.walk_packages(
            connectors_pkg.__path__,
            prefix=connectors_pkg.__name__ + ".",
        ):
            if module_name.endswith(".connector"):
                try:
                    importlib.import_module(module_name)
                except ImportError as exc:
                    log.warning(
                        "connector.auto_discover.failed",
                        module=module_name,
                        error=str(exc),
                    )


# Singleton
registry = ConnectorRegistry()
