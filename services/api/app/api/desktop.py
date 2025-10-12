"""Desktop app endpoints (placeholder)"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/activate")
async def activate_desktop():
    """Desktop activation - placeholder"""
    return {"message": "Desktop endpoints coming soon"}
