"""In-process document registry.

Holds IngestedDocument records in memory during the session.
In production this would be backed by Postgres or Neo4j.
"""
from __future__ import annotations

from app.cpt.documents.models import DocumentStatus, DocumentType, IngestedDocument

_docs: dict[str, IngestedDocument] = {}


def save(doc: IngestedDocument) -> None:
    _docs[doc.id] = doc


def get(doc_id: str) -> IngestedDocument | None:
    return _docs.get(doc_id)


def list_docs(tenant_id: str = "demo") -> list[IngestedDocument]:
    return [d for d in _docs.values() if d.tenant_id == tenant_id]


def delete(doc_id: str) -> bool:
    if doc_id in _docs:
        del _docs[doc_id]
        return True
    return False


def update_status(doc_id: str, status: DocumentStatus, **kwargs) -> None:
    doc = _docs.get(doc_id)
    if doc:
        doc.status = status
        for k, v in kwargs.items():
            if hasattr(doc, k):
                setattr(doc, k, v)


def seed_demo_data() -> None:
    """Populate store with representative demo documents. No-op if data already exists."""
    if _docs:
        return

    from datetime import datetime, timedelta

    now = datetime.utcnow()

    seeds = [
        IngestedDocument(
            id="doc-demo-001",
            filename="payments-service-architecture.md",
            mime_type="text/markdown",
            size_bytes=26_214,
            doc_type=DocumentType.ARCHITECTURE_DOC,
            status=DocumentStatus.COMPLETE,
            tenant_id="demo",
            created_at=now - timedelta(days=6),
            processed_at=now - timedelta(days=6),
            entity_count=14,
            chunk_count=9,
            metadata={"source": "Confluence · Engineering", "author": "payments-team"},
        ),
        IngestedDocument(
            id="doc-demo-002",
            filename="soc2-compliance-runbook.pdf",
            mime_type="application/pdf",
            size_bytes=512_000,
            doc_type=DocumentType.COMPLIANCE_POLICY,
            status=DocumentStatus.COMPLETE,
            tenant_id="demo",
            created_at=now - timedelta(days=14),
            processed_at=now - timedelta(days=14),
            entity_count=8,
            chunk_count=22,
            metadata={"source": "Google Drive · Security", "author": "security-team"},
        ),
        IngestedDocument(
            id="doc-demo-003",
            filename="orders-api-openapi.yaml",
            mime_type="text/yaml",
            size_bytes=18_432,
            doc_type=DocumentType.OPENAPI_SPEC,
            status=DocumentStatus.COMPLETE,
            tenant_id="demo",
            created_at=now - timedelta(days=3),
            processed_at=now - timedelta(days=3),
            entity_count=22,
            chunk_count=6,
            metadata={"source": "GitHub · orders-svc", "author": "ci-bot"},
        ),
        IngestedDocument(
            id="doc-demo-004",
            filename="incident-2024-01-payments-outage.md",
            mime_type="text/markdown",
            size_bytes=9_830,
            doc_type=DocumentType.INCIDENT_REPORT,
            status=DocumentStatus.COMPLETE,
            tenant_id="demo",
            created_at=now - timedelta(days=45),
            processed_at=now - timedelta(days=45),
            entity_count=6,
            chunk_count=4,
            metadata={"source": "PagerDuty · Incidents", "author": "sre-oncall"},
        ),
        IngestedDocument(
            id="doc-demo-005",
            filename="infrastructure-cmdb-export.xlsx",
            mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            size_bytes=204_800,
            doc_type=DocumentType.CMDB_EXPORT,
            status=DocumentStatus.COMPLETE,
            tenant_id="demo",
            created_at=now - timedelta(days=2),
            processed_at=now - timedelta(days=2),
            entity_count=47,
            chunk_count=18,
            metadata={"source": "ServiceNow · CMDB", "author": "platform-team"},
        ),
        IngestedDocument(
            id="doc-demo-006",
            filename="k8s-deployment-guide.md",
            mime_type="text/markdown",
            size_bytes=14_336,
            doc_type=DocumentType.DEPLOYMENT_GUIDE,
            status=DocumentStatus.EXTRACTING,
            tenant_id="demo",
            created_at=now - timedelta(minutes=8),
            processed_at=None,
            entity_count=0,
            chunk_count=0,
            metadata={"source": "Confluence · DevOps", "author": "platform-team"},
        ),
        IngestedDocument(
            id="doc-demo-007",
            filename="pci-dss-gap-analysis.pdf",
            mime_type="application/pdf",
            size_bytes=389_120,
            doc_type=DocumentType.COMPLIANCE_POLICY,
            status=DocumentStatus.COMPLETE,
            tenant_id="demo",
            created_at=now - timedelta(days=21),
            processed_at=now - timedelta(days=21),
            entity_count=11,
            chunk_count=16,
            metadata={"source": "SharePoint · Compliance", "author": "audit-team"},
        ),
    ]

    for doc in seeds:
        _docs[doc.id] = doc


# Auto-seed when this module is first imported
seed_demo_data()
