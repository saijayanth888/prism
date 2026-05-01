from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Request

from app.config import PrismSettings, get_settings


def get_tenant_id(request: Request) -> str:
    return getattr(request.state, "tenant_id", get_settings().default_tenant)


SettingsDep = Annotated[PrismSettings, Depends(get_settings)]
TenantDep = Annotated[str, Depends(get_tenant_id)]
