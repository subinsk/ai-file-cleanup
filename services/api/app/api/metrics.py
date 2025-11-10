"""
Metrics endpoint for monitoring
"""
from fastapi import APIRouter
from app.core.logging import metrics_collector

router = APIRouter()


@router.get("/metrics")
async def get_metrics():
    """Get API metrics"""
    return metrics_collector.get_metrics()


@router.post("/metrics/reset")
async def reset_metrics():
    """Reset metrics (admin only)"""
    metrics_collector.reset()
    return {"message": "Metrics reset"}

