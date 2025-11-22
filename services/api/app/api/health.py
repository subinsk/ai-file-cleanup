"""Health check endpoints"""
from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import engine

router = APIRouter()


@router.get("/")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False
    
    return {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
        "service": "api",
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint"""
    try:
        # Test database connection
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return {"ready": True, "message": "Service ready"}
    except Exception as e:
        return {"ready": False, "message": f"Database not connected: {str(e)}"}
