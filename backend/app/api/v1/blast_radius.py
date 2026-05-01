from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def placeholder():
    return {"module": "blast_radius", "status": "placeholder"}
