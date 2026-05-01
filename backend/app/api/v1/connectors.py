from __future__ import annotations

from fastapi import APIRouter, Request

router = APIRouter()

PLATFORMS = [
    {"id": "kubernetes", "name": "kubernetes", "entityCount": 48, "status": "synced", "lastSynced": "2 min ago"},
    {"id": "github", "name": "github", "entityCount": 32, "status": "synced", "lastSynced": "5 min ago"},
    {"id": "datadog", "name": "datadog", "entityCount": 24, "status": "synced", "lastSynced": "1 min ago"},
    {"id": "apiconnect", "name": "apiconnect", "entityCount": 18, "status": "synced", "lastSynced": "3 min ago"},
    {"id": "argocd", "name": "argocd", "entityCount": 21, "status": "synced", "lastSynced": "4 min ago"},
    {"id": "confluent", "name": "confluent", "entityCount": 15, "status": "synced", "lastSynced": "2 min ago"},
    {"id": "aws", "name": "aws", "entityCount": 29, "status": "syncing", "lastSynced": "12 min ago"},
    {"id": "terraform", "name": "terraform", "entityCount": 11, "status": "synced", "lastSynced": "8 min ago"},
    {"id": "servicenow", "name": "servicenow", "entityCount": 9, "status": "synced", "lastSynced": "15 min ago"},
    {"id": "jira", "name": "jira", "entityCount": 7, "status": "synced", "lastSynced": "10 min ago"},
    {"id": "vault", "name": "vault", "entityCount": 14, "status": "synced", "lastSynced": "6 min ago"},
    {"id": "sonarqube", "name": "sonarqube", "entityCount": 8, "status": "error", "lastSynced": "45 min ago"},
    {"id": "nexus", "name": "nexus", "entityCount": 11, "status": "synced", "lastSynced": "7 min ago"},
]


@router.get("")
async def list_connectors(request: Request):
    return {"platforms": PLATFORMS, "total": len(PLATFORMS)}


@router.get("/{connector_id}/status")
async def connector_status(connector_id: str):
    platform = next((p for p in PLATFORMS if p["id"] == connector_id), None)
    if not platform:
        return {"error": "connector not found"}
    return platform


@router.post("/{connector_id}/sync")
async def trigger_sync(connector_id: str, request: Request):
    platform = next((p for p in PLATFORMS if p["id"] == connector_id), None)
    if not platform:
        return {"error": "connector not found"}
    return {"connector_id": connector_id, "status": "sync_started", "message": f"Sync triggered for {connector_id}"}
