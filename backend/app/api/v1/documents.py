"""Document Intelligence API — upload, process, list, delete documents.

POST /api/v1/documents/upload   — multipart file upload, triggers async processing
GET  /api/v1/documents          — list all documents for tenant
GET  /api/v1/documents/{id}     — get document status + metadata
DELETE /api/v1/documents/{id}   — remove document
GET  /api/v1/documents/{id}/entities — extracted entities from document
POST /api/v1/documents/ingest-url    — ingest from Confluence/SharePoint URL
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app.cpt.documents.models import (
    DocumentSource,
    DocumentStatus,
    DocumentType,
    ExtractionResult,
    IngestedDocument,
)
from app.cpt.documents.parser import ParserFactory
from app.cpt.documents import store as doc_store

router = APIRouter()
log = logging.getLogger(__name__)

# In-memory extraction results cache (doc_id → ExtractionResult)
_results: dict[str, ExtractionResult] = {}

MIME_BY_EXT = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".yaml": "text/yaml", ".yml": "text/yaml",
    ".json": "application/json",
    ".md": "text/markdown",
    ".csv": "text/csv",
    ".txt": "text/plain",
}


async def _process_document(doc_id: str, content: bytes, request: Request):
    """Background task: parse → extract → enrich."""
    from pathlib import Path
    doc = doc_store.get(doc_id)
    if not doc:
        return

    try:
        # Stage 1: Parse
        doc_store.update_status(doc_id, DocumentStatus.PARSING)
        ext = Path(doc.filename).suffix.lower()
        mime = MIME_BY_EXT.get(ext, "application/octet-stream")
        parsed = ParserFactory.parse(content, doc.filename, mime)

        if not parsed.text.strip():
            doc_store.update_status(doc_id, DocumentStatus.FAILED, error="Document appears to be empty or unreadable")
            return

        # Stage 2: LLM Extract
        doc_store.update_status(doc_id, DocumentStatus.EXTRACTING)
        try:
            from app.intelligence.llm_router import LLMRouter
            from app.cpt.documents.extractor import DocumentEntityExtractor
            from app.config import get_settings
            settings = get_settings()
            llm = LLMRouter(settings)
            extractor = DocumentEntityExtractor(llm)
            result = await extractor.extract(doc, parsed)
        except Exception as e:
            log.warning(f"llm_extraction_failed, using_mock error={e}")
            result = _mock_extraction(doc, parsed)

        _results[doc_id] = result

        # Stage 3: Enrich graph
        doc_store.update_status(doc_id, DocumentStatus.ENRICHING)
        try:
            graph = getattr(request.app.state, "neo4j_driver", None)
            if graph:
                from app.cpt.documents.enrichment import DocumentGraphEnricher
                from app.graph.client import Neo4jClient
                client = Neo4jClient(graph)
                enricher = DocumentGraphEnricher(client)
                await enricher.enrich(doc, result)
        except Exception as e:
            log.warning(f"graph_enrichment_failed error={e}")

        doc_store.update_status(
            doc_id,
            DocumentStatus.COMPLETE,
            processed_at=datetime.utcnow(),
            entity_count=len(result.entities),
            chunk_count=len(_chunk_text_count(parsed.text)),
        )
        log.info(f"document_processed doc_id={doc_id} entities={len(result.entities)}")

    except Exception as e:
        log.error(f"document_processing_failed doc_id={doc_id} error={e}")
        doc_store.update_status(doc_id, DocumentStatus.FAILED, error=str(e))


def _chunk_text_count(text: str) -> list:
    words = text.split()
    return [words[i:i+1800] for i in range(0, len(words), 1800)]


def _mock_extraction(doc: IngestedDocument, parsed) -> ExtractionResult:
    """Fallback extraction when LLM unavailable — regex-based heuristic."""
    import re
    from app.cpt.documents.models import ExtractedEntity
    entities = []
    # Heuristic: find service-looking names (CamelCase or hyphenated)
    service_pattern = re.compile(r"\b([A-Z][a-z]+(?:[A-Z][a-z]+)+|[a-z]+-[a-z]+-(?:svc|api|db|service))\b")
    found = set(service_pattern.findall(parsed.text[:5000]))
    for name in list(found)[:10]:
        entity_type = "Database" if any(x in name.lower() for x in ["db", "database", "store"]) else \
                      "API" if any(x in name.lower() for x in ["api", "gateway"]) else "Service"
        entities.append(ExtractedEntity(name=name, entity_type=entity_type, confidence=0.6))
    return ExtractionResult(
        document_id=doc.id,
        entities=entities,
        summary=f"Extracted {len(entities)} entities via heuristic (LLM unavailable)",
        doc_type_detected=DocumentType.GENERAL,
        confidence=0.6,
    )


@router.post("/upload")
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    request: Request,
    tenant_id: Optional[str] = "demo",
):
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(400, "File is empty")
    if len(content) > 50 * 1024 * 1024:  # 50 MB limit
        raise HTTPException(413, "File too large (max 50 MB)")

    supported = ParserFactory.supported_extensions()
    from pathlib import Path
    ext = Path(file.filename or "").suffix.lower()
    if ext and ext not in supported:
        raise HTTPException(415, f"Unsupported file type: {ext}. Supported: {', '.join(supported)}")

    doc = IngestedDocument(
        filename=file.filename or "unknown",
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        content_hash=IngestedDocument.hash_content(content),
        tenant_id=tenant_id or "demo",
    )
    doc_store.save(doc)
    background_tasks.add_task(_process_document, doc.id, content, request)

    return {"id": doc.id, "filename": doc.filename, "status": doc.status, "message": "Processing started"}


@router.get("")
async def list_documents(request: Request, tenant_id: str = "demo"):
    docs = doc_store.list_docs(tenant_id)
    return {
        "documents": [
            {
                "id": d.id, "filename": d.filename, "status": d.status,
                "doc_type": d.doc_type, "entity_count": d.entity_count,
                "size_bytes": d.size_bytes, "created_at": d.created_at.isoformat(),
                "processed_at": d.processed_at.isoformat() if d.processed_at else None,
            }
            for d in docs
        ],
        "total": len(docs),
    }


@router.get("/{doc_id}")
async def get_document(doc_id: str):
    doc = doc_store.get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc.model_dump()


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    if not doc_store.delete(doc_id):
        raise HTTPException(404, "Document not found")
    _results.pop(doc_id, None)
    return {"deleted": True, "id": doc_id}


@router.get("/{doc_id}/entities")
async def get_document_entities(doc_id: str):
    doc = doc_store.get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.status != DocumentStatus.COMPLETE:
        return {"status": doc.status, "entities": [], "message": f"Document is {doc.status}"}
    result = _results.get(doc_id)
    if not result:
        return {"status": "complete", "entities": [], "message": "No entities extracted"}
    return {
        "status": "complete",
        "doc_type": result.doc_type_detected,
        "entity_count": len(result.entities),
        "entities": [e.model_dump() for e in result.entities],
        "summary": result.summary,
        "confidence": result.confidence,
        "llm_tokens_used": result.llm_tokens_used,
    }


@router.get("/supported-formats")
async def supported_formats():
    return {"extensions": ParserFactory.supported_extensions()}
