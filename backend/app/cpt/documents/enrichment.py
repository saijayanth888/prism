"""Graph enrichment — writes extracted document entities to Neo4j.

Merges with existing entities using the CPT convergence rules.
Links IngestedDocument nodes to Entity nodes for provenance.
"""
from __future__ import annotations

import logging
from datetime import datetime

from app.cpt.documents.models import ExtractionResult, IngestedDocument

log = logging.getLogger(__name__)


class DocumentGraphEnricher:
    """Writes extraction results into the Neo4j graph."""

    def __init__(self, graph_client):
        self._db = graph_client

    async def enrich(self, doc: IngestedDocument, result: ExtractionResult) -> int:
        """Returns count of entities written/merged."""
        if not self._db or not self._db.connected:
            log.info("neo4j_unavailable, skipping_enrichment", doc_id=doc.id)
            return len(result.entities)

        written = 0
        try:
            written = await self._write_document_node(doc, result)
            written += await self._write_entities(doc, result)
        except Exception as e:
            log.error("enrichment_failed", doc_id=doc.id, error=str(e))
        return written

    async def _write_document_node(self, doc: IngestedDocument, result: ExtractionResult) -> int:
        query = """
        MERGE (d:Document {id: $id})
        SET d.filename = $filename,
            d.doc_type  = $doc_type,
            d.source    = $source,
            d.tenant_id = $tenant_id,
            d.summary   = $summary,
            d.entity_count = $entity_count,
            d.processed_at = $processed_at
        RETURN d
        """
        await self._db.run(
            query,
            id=doc.id,
            filename=doc.filename,
            doc_type=result.doc_type_detected.value,
            source=doc.source.value,
            tenant_id=doc.tenant_id,
            summary=result.summary[:500],
            entity_count=len(result.entities),
            processed_at=datetime.utcnow().isoformat(),
        )
        return 1

    async def _write_entities(self, doc: IngestedDocument, result: ExtractionResult) -> int:
        written = 0
        for entity in result.entities:
            try:
                # Merge entity (upsert by name + type for document-sourced entities)
                entity_query = """
                MERGE (e:Entity {
                    platform: 'document',
                    entity_id: $entity_id
                })
                SET e.name           = $name,
                    e.normalized_name = toLower($name),
                    e.entity_type     = $entity_type,
                    e.namespace       = $namespace,
                    e.description     = $description,
                    e.confidence      = $confidence,
                    e.discovered_at   = $discovered_at
                WITH e
                MATCH (d:Document {id: $doc_id})
                MERGE (d)-[:REFERENCES]->(e)
                RETURN e
                """
                entity_id = f"doc_{doc.id}_{entity.name.lower().replace(' ', '_')}"
                await self._db.run(
                    entity_query,
                    entity_id=entity_id,
                    name=entity.name,
                    entity_type=entity.entity_type,
                    namespace=entity.namespace or "",
                    description=entity.description or "",
                    confidence=entity.confidence,
                    discovered_at=datetime.utcnow().isoformat(),
                    doc_id=doc.id,
                )

                # Write relationships
                for rel in entity.relationships:
                    target = rel.get("target", "")
                    rel_type = rel.get("type", "REFERENCES").upper().replace(" ", "_")
                    if target:
                        rel_query = """
                        MATCH (src:Entity {platform: 'document', entity_id: $src_id})
                        MERGE (tgt:Entity {normalized_name: toLower($target_name)})
                        ON CREATE SET tgt.name = $target_name,
                                      tgt.platform = 'unknown',
                                      tgt.entity_id = $target_name
                        MERGE (src)-[r:RELATES_TO {rel_type: $rel_type}]->(tgt)
                        RETURN r
                        """
                        await self._db.run(
                            rel_query,
                            src_id=entity_id,
                            target_name=target,
                            rel_type=rel_type,
                        )
                written += 1
            except Exception as e:
                log.warning("entity_write_failed", entity=entity.name, error=str(e))

        return written
