"""
User quota management endpoints
"""
import logging
from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user
from app.services.quota_manager import quota_manager

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def get_user_quota(user=Depends(get_current_user)):
    """
    Get current user's quota usage information
    
    Returns quota usage statistics including storage used, file counts, etc.
    """
    try:
        quota_info = await quota_manager.get_user_quota_info(user.id)
        
        return {
            "user_id": user.id,
            "email": user.email,
            "quota": quota_info
        }
        
    except Exception as e:
        logger.error(f"Error fetching quota info: {e}", exc_info=True)
        raise

