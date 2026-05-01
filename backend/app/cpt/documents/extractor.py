"""LLM-powered entity extraction from parsed documents.

4-stage pipeline:
  1. Classify — detect document type and domain
  2. Chunk   — split into context windows
  3. Extract — LLM identifies entities + relationships per chunk
  4. Merge   — deduplicate across chunks, resolve to existing graph entities
"""
from __future__ import annotations

import json
import logging
import re
import time
import uuid
from typing import Any

from app.cpt.documents.models import (
    DocumentChunk,
    DocumentType,
    ExtractedEntity,
    ExtractionResult,
    IngestedDocument,
)
from app.cpt.documents.parser import ParsedDocument

log = logging.getLogger(__name__)

CHUNK_SIZE_TOKENS = 1800
CHUNK_OVERLAP_TOKENS = 200

ENTITY_TYPES = [
    "Service", "API", "Database", "Application", "Repository",
    "Pipeline", "Container", "Topic", "Deployment", "Namespace",
    "Domain", "Team", "Policy", "Vulnerability", "Secret", "Environment",
]

CLASSIFICATION_PROMPT = """You are analyzing a document to classify it for an enterprise infrastructure knowledge graph.

Document filename: {filename}
Document excerpt (first 600 chars): {excerpt}

Classify this document and respond with ONLY valid JSON:
{{
  "doc_type": "one of: ARCHITECTURE_DOC, API_SPECIFICATION, RUNBOOK, INCIDENT_REPORT, CMDB_EXPORT, DEPENDENCY_MAP, DEPLOYMENT_GUIDE, COMPLIANCE_POLICY, OPENAPI_SPEC, GENERAL",
  "domain": "brief domain description (1-5 words)",
  "confidence": 0.0-1.0
}}"""

EXTRACTION_PROMPT = """You are extracting infrastructure entities from a document chunk for an enterprise knowledge graph.

Document type: {doc_type}
Chunk text:
---
{chunk_text}
---

Extract ALL infrastructure entities (services, APIs, databases, teams, deployments, etc.) and their relationships.
Respond with ONLY valid JSON:
{{
  "entities": [
    {{
      "name": "entity name",
      "entity_type": "Service|API|Database|Application|Repository|Pipeline|Container|Topic|Deployment|Namespace|Domain|Team|Policy",
      "namespace": "optional namespace/org",
      "environment": "prod|staging|dev|null",
      "description": "brief description from context",
      "confidence": 0.0-1.0,
      "relationships": [
        {{"type": "DEPENDS_ON|EXPOSES|CONSUMES|DEPLOYS_TO|OWNS|PUBLISHES_TO", "target": "target entity name"}}
      ]
    }}
  ],
  "summary": "1-2 sentence summary of this chunk's infrastructure content"
}}

Return empty arrays if no infrastructure entities are found. Never invent entities not in the text."""


def _approx_tokens(text: str) -> int:
    return len(text) // 4


def _chunk_text(text: str, chunk_tokens: int = CHUNK_SIZE_TOKENS, overlap: int = CHUNK_OVERLAP_TOKENS) -> list[str]:
    """Split text into overlapping chunks by approximate token count."""
    words = text.split()
    words_per_chunk = chunk_tokens * 4  # ~4 chars per word
    overlap_words = overlap * 4
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + words_per_chunk, len(words))
        chunks.append(" ".join(words[start:end]))
        if end >= len(words):
            break
        start = end - overlap_words
    return chunks if chunks else [text]


class DocumentEntityExtractor:
    """Calls the LLM to classify and extract entities from parsed documents."""

    def __init__(self, llm_router):
        self._llm = llm_router

    async def extract(self, doc: IngestedDocument, parsed: ParsedDocument) -> ExtractionResult:
        start = time.monotonic()
        total_tokens = 0

        try:
            doc_type, classify_tokens = await self._classify(doc.filename, parsed.text[:600])
            total_tokens += classify_tokens
        except Exception as e:
            log.warning("classification_failed", doc_id=doc.id, error=str(e))
            doc_type = DocumentType.GENERAL

        chunks_text = _chunk_text(parsed.text)
        chunks = [
            DocumentChunk(
                document_id=doc.id,
                chunk_index=i,
                text=c,
                token_count=_approx_tokens(c),
            )
            for i, c in enumerate(chunks_text)
        ]

        all_entities: list[ExtractedEntity] = []
        all_summaries: list[str] = []

        for chunk in chunks:
            try:
                entities, summary, tokens = await self._extract_chunk(doc_type, chunk)
                all_entities.extend(entities)
                if summary:
                    all_summaries.append(summary)
                total_tokens += tokens
            except Exception as e:
                log.warning("chunk_extraction_failed", doc_id=doc.id, chunk=chunk.chunk_index, error=str(e))

        deduped = _deduplicate_entities(all_entities)
        elapsed_ms = int((time.monotonic() - start) * 1000)

        return ExtractionResult(
            document_id=doc.id,
            entities=deduped,
            doc_type_detected=doc_type,
            summary="\n".join(all_summaries[:3]),
            confidence=sum(e.confidence for e in deduped) / max(len(deduped), 1),
            processing_time_ms=elapsed_ms,
            llm_tokens_used=total_tokens,
        )

    async def _classify(self, filename: str, excerpt: str) -> tuple[DocumentType, int]:
        prompt = CLASSIFICATION_PROMPT.format(filename=filename, excerpt=excerpt)
        response = await self._llm.complete(prompt, max_tokens=80)
        tokens = _approx_tokens(prompt) + 80
        try:
            data = _extract_json(response)
            return DocumentType(data.get("doc_type", "GENERAL")), tokens
        except Exception:
            return DocumentType.GENERAL, tokens

    async def _extract_chunk(
        self, doc_type: DocumentType, chunk: DocumentChunk
    ) -> tuple[list[ExtractedEntity], str, int]:
        prompt = EXTRACTION_PROMPT.format(doc_type=doc_type.value, chunk_text=chunk.text)
        response = await self._llm.complete(prompt, max_tokens=1200)
        tokens = _approx_tokens(prompt) + 1200
        try:
            data = _extract_json(response)
            entities = [
                ExtractedEntity(
                    name=e.get("name", ""),
                    entity_type=e.get("entity_type", "Service"),
                    namespace=e.get("namespace"),
                    environment=e.get("environment"),
                    description=e.get("description"),
                    confidence=float(e.get("confidence", 0.8)),
                    relationships=e.get("relationships", []),
                    source_chunk_id=chunk.id,
                )
                for e in data.get("entities", [])
                if e.get("name")
            ]
            summary = data.get("summary", "")
            return entities, summary, tokens
        except Exception as e:
            log.warning("extraction_parse_error", error=str(e), response=response[:200])
            return [], "", tokens


def _extract_json(text: str) -> dict[str, Any]:
    """Extract the first JSON object from an LLM response."""
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        return json.loads(match.group())
    return json.loads(text)


def _deduplicate_entities(entities: list[ExtractedEntity]) -> list[ExtractedEntity]:
    """Merge entities with the same normalized name+type."""
    seen: dict[str, ExtractedEntity] = {}
    for entity in entities:
        key = f"{entity.name.lower().strip()}::{entity.entity_type.lower()}"
        if key in seen:
            existing = seen[key]
            if entity.confidence > existing.confidence:
                seen[key] = entity
            else:
                existing.relationships.extend(entity.relationships)
        else:
            seen[key] = entity
    return list(seen.values())
