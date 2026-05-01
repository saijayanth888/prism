import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import get_settings

log = structlog.get_logger(__name__)

SKIP_TENANT_PATHS = {"/health", "/api/v1/health", "/docs", "/openapi.json", "/redoc"}


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in SKIP_TENANT_PATHS:
            return await call_next(request)

        tenant_id = request.headers.get("X-Tenant-ID")

        if not tenant_id:
            settings = get_settings()
            tenant_id = settings.default_tenant

        request.state.tenant_id = tenant_id
        structlog.contextvars.bind_contextvars(tenant_id=tenant_id)

        response = await call_next(request)
        return response
