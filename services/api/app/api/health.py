"""Health check endpoints"""
from fastapi import APIRouter
from app.core.database import get_db

router = APIRouter()


@router.get("/")
async def health_check():
    """Health check endpoint"""
    db = get_db()
    db_connected = db.is_connected()
    
    return {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
        "service": "api",
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint"""
    db = get_db()
    
    if not db.is_connected():
        return {"ready": False, "message": "Database not connected"}
    
    return {"ready": True, "message": "Service ready"}
