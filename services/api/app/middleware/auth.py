"""Authentication middleware"""
import logging
from fastapi import Depends, HTTPException, Cookie
from typing import Optional

from app.core.database import get_db
from app.core.security import decode_access_token

logger = logging.getLogger(__name__)


async def get_current_user(access_token: Optional[str] = Cookie(None)):
    """Get current user from JWT token in cookie"""
    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Decode token
    payload = decode_access_token(access_token)
    
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    db = get_db()
    user = await db.user.find_unique(where={"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user
