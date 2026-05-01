from fastapi import APIRouter

from app.api.v1 import (
    blast_radius,
    compliance,
    connectors,
    copilot,
    cpt,
    documents,
    entities,
    health,
    reports,
    search,
    topology,
)

router = APIRouter(prefix="/api/v1")

router.include_router(health.router, tags=["health"])
router.include_router(entities.router, prefix="/entities", tags=["entities"])
router.include_router(topology.router, prefix="/topology", tags=["topology"])
router.include_router(search.router, prefix="/search", tags=["search"])
router.include_router(copilot.router, prefix="/copilot", tags=["copilot"])
router.include_router(compliance.router, prefix="/compliance", tags=["compliance"])
router.include_router(connectors.router, prefix="/connectors", tags=["connectors"])
router.include_router(blast_radius.router, prefix="/blast-radius", tags=["blast_radius"])
router.include_router(reports.router, prefix="/reports", tags=["reports"])
router.include_router(documents.router, prefix="/documents", tags=["documents"])
router.include_router(cpt.router, prefix="/cpt", tags=["cpt"])
