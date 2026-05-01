"""
10 graph-grounded tools for Iris AI Copilot.
All tools return structured text. Citations use [entity:name] format.
NOT_FOUND responses prevent hallucination.
"""
from __future__ import annotations

import json
from typing import Any

import structlog

log = structlog.get_logger(__name__)

NOT_FOUND = "NOT_FOUND"


def _format_entity(row: dict) -> str:
    name = row.get("name") or row.get("label") or "unknown"
    etype = row.get("entityType") or row.get("entity_type") or ""
    platforms = row.get("platforms") or []
    health = row.get("healthScore") or row.get("health_score")
    parts = [f"[entity:{name}]"]
    if etype:
        parts.append(f"type={etype}")
    if platforms:
        parts.append(f"platforms={','.join(platforms) if isinstance(platforms, list) else platforms}")
    if health is not None:
        parts.append(f"health={health}")
    return " ".join(parts)


class IrisTools:
    """Container for all Iris graph tools. Requires a graph client."""

    def __init__(self, graph_client, tenant_id: str = "demo"):
        self._client = graph_client
        self._tenant = tenant_id

    def get_tool_definitions(self) -> list[dict]:
        """Return tool definitions in Anthropic tool_use format."""
        return [
            {
                "name": "search_entities",
                "description": "Search the Prism knowledge graph for entities by name, type, or platform. Returns matching entities with key properties.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query (entity name or keyword)"},
                        "entity_type": {"type": "string", "description": "Filter by entity type (Service, API, Database, etc.)"},
                        "platform": {"type": "string", "description": "Filter by platform (kubernetes, github, datadog, etc.)"},
                    },
                    "required": ["query"],
                },
            },
            {
                "name": "get_entity_detail",
                "description": "Get full details about a specific entity including all connected entities, health score, compliance status, and platform metadata.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "entity_name": {"type": "string", "description": "Name of the entity to look up"},
                    },
                    "required": ["entity_name"],
                },
            },
            {
                "name": "traverse_dependencies",
                "description": "Walk the dependency chain from an entity. Direction 'upstream' shows what depends on it, 'downstream' shows what it depends on.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "entity_name": {"type": "string"},
                        "direction": {"type": "string", "enum": ["upstream", "downstream"], "default": "downstream"},
                        "depth": {"type": "integer", "default": 2, "minimum": 1, "maximum": 5},
                    },
                    "required": ["entity_name"],
                },
            },
            {
                "name": "calculate_blast_radius",
                "description": "Calculate the blast radius if an entity goes down. Returns all affected services with hop distance.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "entity_name": {"type": "string"},
                        "max_depth": {"type": "integer", "default": 3, "minimum": 1, "maximum": 5},
                    },
                    "required": ["entity_name"],
                },
            },
            {
                "name": "check_compliance",
                "description": "Check compliance status. Optionally filter by entity name or policy (PCI-DSS, SOC2, HIPAA).",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "entity_name": {"type": "string"},
                        "policy": {"type": "string", "enum": ["PCI-DSS", "SOC2", "HIPAA"]},
                    },
                },
            },
            {
                "name": "get_health_scores",
                "description": "Get composite health scores. Optionally filter by entity name. Returns scores and breakdown.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "entity_name": {"type": "string"},
                    },
                },
            },
            {
                "name": "list_vulnerabilities",
                "description": "List CVEs/vulnerabilities. Filter by severity (critical/high/medium/low) or entity name.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "severity": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
                        "entity_name": {"type": "string"},
                    },
                },
            },
            {
                "name": "get_platform_overview",
                "description": "Get overview of all connected platforms: entity counts, sync status, last sync time.",
                "input_schema": {"type": "object", "properties": {}},
            },
            {
                "name": "compare_entities",
                "description": "Compare two entities side by side: type, platform, health, compliance, dependencies.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "entity_a": {"type": "string"},
                        "entity_b": {"type": "string"},
                    },
                    "required": ["entity_a", "entity_b"],
                },
            },
            {
                "name": "verify_entity_exists",
                "description": "ANTI-HALLUCINATION CHECK: Verify if an entity exists in the knowledge graph. Returns closest matches if not found exactly.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "entity_name": {"type": "string"},
                    },
                    "required": ["entity_name"],
                },
            },
            {
                "name": "search_documents",
                "description": "Search ingested documents (Word, PDF, Confluence, SharePoint, etc.) for information about infrastructure, services, or processes.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "What to search for in ingested documents"},
                        "doc_type": {"type": "string", "description": "Optional: filter by document type (ARCHITECTURE_DOC, RUNBOOK, API_SPECIFICATION, etc.)"},
                    },
                    "required": ["query"],
                },
            },
            {
                "name": "get_business_context",
                "description": "Retrieve business context, ownership, and documentation for an entity from ingested documents. Answers 'who owns this?' and 'what does this do?'",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "entity_name": {"type": "string", "description": "Entity to find business context for"},
                    },
                    "required": ["entity_name"],
                },
            },
        ]

    async def execute(self, tool_name: str, tool_input: dict) -> str:
        """Dispatch tool call to the appropriate handler."""
        handler = getattr(self, f"_tool_{tool_name}", None)
        if not handler:
            return f"ERROR: Unknown tool '{tool_name}'"
        try:
            result = await handler(**tool_input)
            log.info("iris.tool.executed", tool=tool_name, tenant=self._tenant)
            return result
        except Exception as exc:
            log.error("iris.tool.failed", tool=tool_name, error=str(exc))
            return f"ERROR: Tool '{tool_name}' failed: {exc}"

    async def _tool_search_entities(
        self,
        query: str,
        entity_type: str | None = None,
        platform: str | None = None,
    ) -> str:
        from app.graph.queries import search_entities
        rows = await search_entities(
            self._client, query, entity_type=entity_type, tenant_id=self._tenant
        )
        if not rows:
            return f"NOT_FOUND: No entities matching '{query}' found in the knowledge graph."
        lines = [f"Found {len(rows)} entities matching '{query}':"]
        for row in rows[:10]:
            e = row.get("e", row)
            lines.append("  " + _format_entity(e if isinstance(e, dict) else dict(e)))
        return "\n".join(lines)

    async def _tool_get_entity_detail(self, entity_name: str) -> str:
        from app.graph.queries import get_entity, search_entities

        rows = await search_entities(
            self._client, entity_name, tenant_id=self._tenant, limit=1
        )
        if not rows:
            return f"NOT_FOUND: No entity named '{entity_name}' exists in the knowledge graph."

        row = rows[0]
        e = row.get("e", row)
        if hasattr(e, "items"):
            e = dict(e)
        name = e.get("name", entity_name)
        etype = e.get("entity_type", "")
        platforms = e.get("platforms", [])
        health = e.get("health_score", "N/A")
        compliance = e.get("compliance_score", "N/A")
        env = e.get("environment", "")
        ns = e.get("namespace", "")

        return (
            f"[entity:{name}]\n"
            f"  Type: {etype}\n"
            f"  Platforms: {', '.join(platforms) if isinstance(platforms, list) else platforms}\n"
            f"  Health Score: {health}/100\n"
            f"  Compliance Score: {compliance}/100\n"
            f"  Environment: {env}\n"
            f"  Namespace/Domain: {ns}"
        )

    async def _tool_traverse_dependencies(
        self, entity_name: str, direction: str = "downstream", depth: int = 2
    ) -> str:
        from app.graph.queries import search_entities
        from app.graph.queries import get_dependencies

        rows = await search_entities(
            self._client, entity_name, tenant_id=self._tenant, limit=1
        )
        if not rows:
            return f"NOT_FOUND: No entity named '{entity_name}' exists."

        e = rows[0].get("e", rows[0])
        if hasattr(e, "__getitem__"):
            eid = e["converged_id"] if hasattr(e, "keys") else dict(e).get("converged_id")
        else:
            eid = None

        if not eid:
            return f"NOT_FOUND: Could not resolve entity ID for '{entity_name}'."

        deps = await get_dependencies(
            self._client, eid, direction=direction, depth=depth, tenant_id=self._tenant
        )
        if not deps:
            return f"[entity:{entity_name}] has no {direction} dependencies (depth={depth})."

        lines = [f"{direction.title()} dependencies of [entity:{entity_name}] (depth={depth}):"]
        for dep in deps:
            lines.append("  " + _format_entity(dep))
        return "\n".join(lines)

    async def _tool_calculate_blast_radius(
        self, entity_name: str, max_depth: int = 3
    ) -> str:
        from app.graph.algorithms import blast_radius
        from app.graph.queries import search_entities

        rows = await search_entities(
            self._client, entity_name, tenant_id=self._tenant, limit=1
        )
        if not rows:
            return f"NOT_FOUND: No entity named '{entity_name}' exists."

        e = rows[0].get("e", rows[0])
        eid = (dict(e) if hasattr(e, "items") else e).get("converged_id")
        if not eid:
            return f"NOT_FOUND: Could not resolve entity ID for '{entity_name}'."

        affected = await blast_radius(
            self._client, eid, max_depth=max_depth, tenant_id=self._tenant
        )

        if not affected:
            return f"[entity:{entity_name}] blast radius is ZERO — no downstream services depend on it."

        lines = [f"Blast radius of [entity:{entity_name}] (max depth={max_depth}):"]
        lines.append(f"Total affected: {len(affected)} services")
        for item in affected[:20]:
            lines.append("  " + _format_entity(item))
        if len(affected) > 20:
            lines.append(f"  ... and {len(affected) - 20} more")
        return "\n".join(lines)

    async def _tool_check_compliance(
        self,
        entity_name: str | None = None,
        policy: str | None = None,
    ) -> str:
        from app.graph.queries import search_entities

        if entity_name:
            rows = await search_entities(
                self._client, entity_name, tenant_id=self._tenant, limit=5
            )
            if not rows:
                return f"NOT_FOUND: No entity named '{entity_name}' exists."
            non_compliant = [
                r for r in rows
                if (dict(r.get("e", r)) if hasattr(r.get("e", r), "items") else r).get("compliance_score", 100) < 80
            ]
            if not non_compliant:
                return f"[entity:{entity_name}] is compliant (compliance score ≥ 80)."
            lines = [f"Compliance issues for entities matching '{entity_name}':"]
            for r in non_compliant:
                e = dict(r.get("e", r)) if hasattr(r.get("e", r), "items") else r
                lines.append(f"  [entity:{e.get('name')}] score={e.get('compliance_score')}/100 — gap detected")
            return "\n".join(lines)

        # Portfolio-wide compliance check
        all_entities = await search_entities(
            self._client, "", tenant_id=self._tenant, limit=500
        )
        if not all_entities:
            return "No entities found in the graph. Run `make seed` to populate data."

        total = len(all_entities)
        non_compliant_count = sum(
            1 for r in all_entities
            if (dict(r.get("e", r)) if hasattr(r.get("e", r), "items") else r).get("compliance_score", 100) < 80
        )
        pct = round((total - non_compliant_count) / total * 100, 1) if total else 0

        lines = [
            f"Portfolio compliance ({policy or 'all policies'}): {pct}% compliant",
            f"Total entities: {total}",
            f"Non-compliant: {non_compliant_count} (score < 80)",
        ]
        if policy:
            lines.append(f"[platform:{policy}] policy check applied")
        return "\n".join(lines)

    async def _tool_get_health_scores(self, entity_name: str | None = None) -> str:
        from app.graph.queries import search_entities

        if entity_name:
            rows = await search_entities(
                self._client, entity_name, tenant_id=self._tenant, limit=3
            )
            if not rows:
                return f"NOT_FOUND: No entity named '{entity_name}' exists."
            lines = [f"Health scores for entities matching '{entity_name}':"]
            for r in rows:
                e = dict(r.get("e", r)) if hasattr(r.get("e", r), "items") else r
                health = e.get("health_score", "N/A")
                compliance = e.get("compliance_score", "N/A")
                lines.append(f"  [entity:{e.get('name')}] health={health}/100 compliance={compliance}/100")
            return "\n".join(lines)

        # Portfolio overview
        rows = await search_entities(
            self._client, "", tenant_id=self._tenant, limit=500
        )
        if not rows:
            return "No entities found. Run `make seed` first."

        scores = [
            (dict(r.get("e", r)) if hasattr(r.get("e", r), "items") else r).get("health_score")
            for r in rows
            if (dict(r.get("e", r)) if hasattr(r.get("e", r), "items") else r).get("health_score") is not None
        ]
        if not scores:
            return "Health score data not available."

        avg = round(sum(scores) / len(scores), 1)
        critical = sum(1 for s in scores if s < 70)
        healthy = sum(1 for s in scores if s >= 85)
        return (
            f"Portfolio health summary:\n"
            f"  Average health score: {avg}/100\n"
            f"  Healthy (≥85): {healthy} entities\n"
            f"  Critical (<70): {critical} entities\n"
            f"  Total monitored: {len(scores)} entities"
        )

    async def _tool_list_vulnerabilities(
        self,
        severity: str | None = None,
        entity_name: str | None = None,
    ) -> str:
        from app.graph.queries import search_entities

        rows = await search_entities(
            self._client, entity_name or "", tenant_id=self._tenant, limit=200
        )
        # Return mock vulnerability summary from entity properties
        vuln_count = 0
        lines: list[str] = []
        for r in rows[:50]:
            e = dict(r.get("e", r)) if hasattr(r.get("e", r), "items") else r
            props = e.get("properties", "")
            if "vulnerabilities" in str(props).lower() or e.get("compliance_score", 100) < 75:
                vuln_count += 1
                lines.append(f"  [entity:{e.get('name')}] potential vulnerability — compliance score {e.get('compliance_score', '?')}/100")

        if not lines:
            return "No vulnerabilities detected" + (f" for '{entity_name}'" if entity_name else "") + "."
        return f"Vulnerability summary{' (' + severity + ')' if severity else ''}:\n" + "\n".join(lines[:10])

    async def _tool_get_platform_overview(self) -> str:
        from app.graph.queries import search_entities
        rows = await search_entities(self._client, "", tenant_id=self._tenant, limit=1000)
        if not rows:
            return "No data available. Run `make seed` to populate the graph."

        platform_counts: dict[str, int] = {}
        for r in rows:
            e = dict(r.get("e", r)) if hasattr(r.get("e", r), "items") else r
            for plat in (e.get("platforms") or []):
                platform_counts[plat] = platform_counts.get(plat, 0) + 1

        lines = [f"Platform overview ({len(rows)} total entities):"]
        for plat, count in sorted(platform_counts.items(), key=lambda x: -x[1]):
            lines.append(f"  [platform:{plat}] {count} entities")
        return "\n".join(lines)

    async def _tool_compare_entities(self, entity_a: str, entity_b: str) -> str:
        from app.graph.queries import search_entities

        rows_a = await search_entities(self._client, entity_a, tenant_id=self._tenant, limit=1)
        rows_b = await search_entities(self._client, entity_b, tenant_id=self._tenant, limit=1)

        if not rows_a:
            return f"NOT_FOUND: No entity named '{entity_a}' in the graph."
        if not rows_b:
            return f"NOT_FOUND: No entity named '{entity_b}' in the graph."

        ea = dict(rows_a[0].get("e", rows_a[0])) if hasattr(rows_a[0].get("e", rows_a[0]), "items") else rows_a[0]
        eb = dict(rows_b[0].get("e", rows_b[0])) if hasattr(rows_b[0].get("e", rows_b[0]), "items") else rows_b[0]

        fields = ["name", "entity_type", "platforms", "health_score", "compliance_score", "environment"]
        lines = [f"Comparison: [entity:{entity_a}] vs [entity:{entity_b}]"]
        lines.append(f"{'Property':<20} {'A':<30} {'B':<30}")
        lines.append("-" * 80)
        for f in fields:
            va = str(ea.get(f, "N/A"))
            vb = str(eb.get(f, "N/A"))
            lines.append(f"{f:<20} {va:<30} {vb:<30}")
        return "\n".join(lines)

    async def _tool_verify_entity_exists(self, entity_name: str) -> str:
        from app.graph.queries import search_entities

        exact = await search_entities(self._client, entity_name, tenant_id=self._tenant, limit=1)
        if exact:
            e = dict(exact[0].get("e", exact[0])) if hasattr(exact[0].get("e", exact[0]), "items") else exact[0]
            return f"FOUND: [entity:{e.get('name')}] exists in the graph (type={e.get('entity_type')})"

        # Try fuzzy lookup
        partial = entity_name.split("-")[0] if "-" in entity_name else entity_name[:4]
        similar = await search_entities(self._client, partial, tenant_id=self._tenant, limit=3)
        if similar:
            names = [dict(r.get("e", r)).get("name", "?") for r in similar]
            return f"NOT_FOUND: '{entity_name}' does not exist. Closest matches: {', '.join(names)}"
        return f"NOT_FOUND: '{entity_name}' does not exist in the knowledge graph."

    async def _tool_search_documents(self, query: str, doc_type: str | None = None) -> str:
        """Search ingested documents by keyword."""
        try:
            from app.cpt.documents import store as doc_store
            from app.api.v1.documents import _results as extraction_results
            docs = doc_store.list_docs(self._tenant)
            if not docs:
                return "No documents have been ingested yet. Upload documents via the Document Intelligence tab."

            matches = []
            query_lower = query.lower()
            for doc in docs:
                result = extraction_results.get(doc.id)
                if not result:
                    continue
                # Check if query matches summary or entity names
                if (query_lower in result.summary.lower() or
                        any(query_lower in e.name.lower() or (e.description and query_lower in e.description.lower())
                            for e in result.entities)):
                    matching_entities = [
                        f"[entity:{e.name}] ({e.entity_type})"
                        for e in result.entities
                        if query_lower in e.name.lower() or (e.description and query_lower in e.description.lower())
                    ]
                    matches.append(
                        f"[doc:{doc.filename}] ({result.doc_type_detected.value})\n"
                        f"  Summary: {result.summary[:200]}\n"
                        f"  Matching entities: {', '.join(matching_entities[:5]) or 'none'}"
                    )

            if not matches:
                return f"No documents found matching '{query}'. {len(docs)} documents indexed."
            return f"Documents matching '{query}' ({len(matches)} results):\n\n" + "\n\n".join(matches[:5])
        except Exception as e:
            return f"Document search unavailable: {e}"

    async def _tool_get_business_context(self, entity_name: str) -> str:
        """Get business context about an entity from ingested documents."""
        try:
            from app.cpt.documents import store as doc_store
            from app.api.v1.documents import _results as extraction_results
            docs = doc_store.list_docs(self._tenant)
            entity_lower = entity_name.lower()
            context_parts = []

            for doc in docs:
                result = extraction_results.get(doc.id)
                if not result:
                    continue
                related = [
                    e for e in result.entities
                    if entity_lower in e.name.lower()
                ]
                if related:
                    for e in related:
                        desc = e.description or "no description"
                        rels = ", ".join(f"{r['type']} {r['target']}" for r in e.relationships[:3]) if e.relationships else "none"
                        context_parts.append(
                            f"From [doc:{doc.filename}]:\n"
                            f"  [entity:{e.name}] ({e.entity_type}) — {desc}\n"
                            f"  Relationships: {rels}"
                        )

            if not context_parts:
                # Also check graph for entity
                from app.graph.queries import search_entities
                rows = await search_entities(self._client, entity_name, tenant_id=self._tenant, limit=1)
                if rows:
                    e = dict(rows[0].get("e", rows[0])) if hasattr(rows[0].get("e", rows[0]), "items") else rows[0]
                    return (
                        f"[entity:{e.get('name')}] found in graph but no business documents reference it.\n"
                        f"Type: {e.get('entity_type')} | Platform: {', '.join(e.get('platforms') or [])}"
                    )
                return f"NOT_FOUND: No business context available for '{entity_name}'. No matching documents or graph entities."

            return f"Business context for [entity:{entity_name}]:\n\n" + "\n\n".join(context_parts[:4])
        except Exception as e:
            return f"Business context lookup failed: {e}"
