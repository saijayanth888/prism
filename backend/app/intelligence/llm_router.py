"""
Model-agnostic LLM router. Default: Anthropic Claude.
"""
from __future__ import annotations

import json
from typing import Any, AsyncGenerator

import structlog

log = structlog.get_logger(__name__)


class LLMRouter:
    def __init__(self, provider: str = "anthropic", api_key: str | None = None, model: str | None = None):
        self.provider = provider
        self.api_key = api_key
        self.model = model or self._default_model(provider)

    def _default_model(self, provider: str) -> str:
        defaults = {
            "anthropic": "claude-sonnet-4-20250514",
            "openai": "gpt-4o",
            "ollama": "llama3",
        }
        return defaults.get(provider, "claude-sonnet-4-20250514")

    async def complete(
        self,
        messages: list[dict[str, Any]],
        system: str = "",
        tools: list[dict] | None = None,
        temperature: float = 0.1,
    ) -> dict[str, Any]:
        if self.provider == "anthropic":
            return await self._anthropic_complete(messages, system, tools, temperature)
        raise NotImplementedError(f"Provider '{self.provider}' not implemented yet")

    async def stream(
        self,
        messages: list[dict[str, Any]],
        system: str = "",
        tools: list[dict] | None = None,
    ) -> AsyncGenerator[str, None]:
        if self.provider == "anthropic":
            async for chunk in self._anthropic_stream(messages, system, tools):
                yield chunk
        else:
            raise NotImplementedError(f"Streaming not implemented for provider '{self.provider}'")

    async def _anthropic_complete(
        self,
        messages: list[dict[str, Any]],
        system: str,
        tools: list[dict] | None,
        temperature: float,
    ) -> dict[str, Any]:
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=self.api_key)
            kwargs: dict[str, Any] = {
                "model": self.model,
                "max_tokens": 4096,
                "temperature": temperature,
                "messages": messages,
            }
            if system:
                kwargs["system"] = system
            if tools:
                kwargs["tools"] = tools

            response = await client.messages.create(**kwargs)
            return {"response": response, "provider": "anthropic"}
        except ImportError:
            log.error("llm_router.anthropic_not_installed")
            return {"error": "anthropic package not installed", "provider": "anthropic"}
        except Exception as exc:
            log.error("llm_router.anthropic_error", error=str(exc))
            return {"error": str(exc), "provider": "anthropic"}

    async def _anthropic_stream(
        self,
        messages: list[dict[str, Any]],
        system: str,
        tools: list[dict] | None,
    ) -> AsyncGenerator[str, None]:
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=self.api_key)
            kwargs: dict[str, Any] = {
                "model": self.model,
                "max_tokens": 4096,
                "messages": messages,
            }
            if system:
                kwargs["system"] = system
            if tools:
                kwargs["tools"] = tools

            async with client.messages.stream(**kwargs) as stream:
                async for text in stream.text_stream:
                    yield text
        except ImportError:
            yield "ERROR: anthropic package not installed"
        except Exception as exc:
            log.error("llm_router.stream_error", error=str(exc))
            yield f"ERROR: {exc}"
