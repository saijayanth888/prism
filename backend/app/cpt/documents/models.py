"""Data models for Document Intelligence."""
from __future__ import annotations

import hashlib
import uuid
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    ARCHITECTURE_DOC = "ARCHITECTURE_DOC"
    API_SPECIFICATION = "API_SPECIFICATION"
    RUNBOOK = "RUNBOOK"
    INCIDENT_REPORT = "INCIDENT_REPORT"
    CMDB_EXPORT = "CMDB_EXPORT"
    DEPENDENCY_MAP = "DEPENDENCY_MAP"
    DEPLOYMENT_GUIDE = "DEPLOYMENT_GUIDE"
    COMPLIANCE_POLICY = "COMPLIANCE_POLICY"
    CHANGE_REQUEST = "CHANGE_REQUEST"
    SHAREPOINT_DOC = "SHAREPOINT_DOC"
    CONFLUENCE_PAGE = "CONFLUENCE_PAGE"
    SPREADSHEET = "SPREADSHEET"
    OPENAPI_SPEC = "OPENAPI_SPEC"
    INFRASTRUCTURE_CODE = "INFRASTRUCTURE_CODE"
    GENERAL = "GENERAL"


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PARSING = "parsing"
    EXTRACTING = "extracting"
    ENRICHING = "enriching"
    COMPLETE = "complete"
    FAILED = "failed"


class DocumentSource(str, Enum):
    UPLOAD = "upload"
    SHAREPOINT = "sharepoint"
    CONFLUENCE = "confluence"
    URL = "url"


class IngestedDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    mime_type: str = "application/octet-stream"
    size_bytes: int = 0
    doc_type: DocumentType = DocumentType.GENERAL
    source: DocumentSource = DocumentSource.UPLOAD
    source_url: str | None = None
    tenant_id: str = "demo"
    status: DocumentStatus = DocumentStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: datetime | None = None
    entity_count: int = 0
    chunk_count: int = 0
    error: str | None = None
    content_hash: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def hash_content(cls, content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()


class DocumentChunk(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    chunk_index: int
    text: str
    token_count: int = 0
    embedding: list[float] | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ExtractedEntity(BaseModel):
    name: str
    entity_type: str
    platform: str = "document"
    namespace: str | None = None
    environment: str | None = None
    description: str | None = None
    relationships: list[dict[str, str]] = Field(default_factory=list)
    properties: dict[str, Any] = Field(default_factory=dict)
    confidence: float = 0.8
    source_chunk_id: str | None = None
    citation: str | None = None


class ExtractionResult(BaseModel):
    document_id: str
    entities: list[ExtractedEntity] = Field(default_factory=list)
    relationships: list[dict[str, Any]] = Field(default_factory=list)
    summary: str = ""
    doc_type_detected: DocumentType = DocumentType.GENERAL
    confidence: float = 0.0
    processing_time_ms: int = 0
    llm_tokens_used: int = 0
