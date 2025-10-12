"""
Health check endpoints
"""
from fastapi import APIRouter
from app.core.models import are_models_loaded

router = APIRouter()


@router.get("/")
async def health_check():
    """
    Health check endpoint
    """
    models_loaded = are_models_loaded()
    
    return {
        "status": "healthy" if models_loaded else "initializing",
        "models_loaded": models_loaded,
        "service": "ml-service",
    }


@router.get("/ready")
async def readiness_check():
    """
    Readiness check endpoint
    """
    if not are_models_loaded():
        return {"ready": False, "message": "Models not loaded"}
    
    return {"ready": True, "message": "Service ready"}

