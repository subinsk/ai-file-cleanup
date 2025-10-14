"""Authentication endpoints"""
import logging
from fastapi import APIRouter, HTTPException, Response, Cookie
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from fastapi import Depends
from app.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    created_at: str


@router.post("/register", response_model=UserResponse)
async def register(request: RegisterRequest):
    """Register a new user"""
    db = get_db()
    
    try:
        # Check if user exists
        existing_user = await db.user.find_first(where={"email": request.email})
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        password_hash = hash_password(request.password)
        
        # Create user
        user = await db.user.create(
            data={
                "email": request.email,
                "passwordHash": password_hash,
                "name": request.name,
            }
        )
        
        logger.info(f"User registered: {user.email}")
        
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            created_at=user.createdAt.isoformat(),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login")
async def login(request: LoginRequest, response: Response):
    """Login user and return JWT token"""
    db = get_db()
    
    try:
        # Find user
        user = await db.user.find_first(where={"email": request.email})
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not verify_password(request.password, user.passwordHash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create access token
        access_token = create_access_token(data={"sub": user.id})
        
        # Set httpOnly cookie
        from app.core.config import settings
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=False,  # Allow JS access for SPA
            secure=False,  # Set to False for local development (True in production)
            samesite="lax",
            max_age=60 * 60 * 24 * 7,  # 7 days
            path="/",  # Ensure cookie is sent for all paths
        )
        
        logger.info(f"User logged in: {user.email}")
        
        return {
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                created_at=user.createdAt.isoformat(),
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/logout")
async def logout(response: Response):
    """Logout user"""
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(user=Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        created_at=user.createdAt.isoformat(),
    )
