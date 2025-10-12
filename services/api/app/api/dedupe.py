"""Deduplication endpoints (placeholder)"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/preview")
async def preview_duplicates():
    """Preview duplicates - placeholder"""
    return {"message": "Deduplication endpoints coming soon"}
