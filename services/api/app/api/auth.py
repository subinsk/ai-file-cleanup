"""Authentication endpoints"""
import logging
from fastapi import APIRouter, HTTPException, Response, Cookie, Depends
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import hash_password, verify_password, create_access_token
from app.middleware.auth import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        """Sanitize name input"""
        if v:
            # Remove potential XSS characters
            import re
            v = re.sub(r'[<>\"\'&]', '', v)
            if len(v) > 100:
                raise ValueError('Name must be less than 100 characters')
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    created_at: str


@router.post("/register", response_model=UserResponse)
async def register(request: RegisterRequest, session: AsyncSession = Depends(get_session)):
    """Register a new user"""
    try:
        # Check if user exists
        result = await session.execute(select(User).where(User.email == request.email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        password_hash = hash_password(request.password)
        
        # Create user
        user = User(
            email=request.email,
            password_hash=password_hash,
            name=request.name,
        )
        session.add(user)
        await session.flush()  # Flush to get the ID
        
        logger.info(f"User registered: {user.email}")
        
        return UserResponse(
            id=str(user.id),
            email=user.email,
            name=user.name,
            created_at=user.created_at.isoformat(),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login")
async def login(request: LoginRequest, response: Response, session: AsyncSession = Depends(get_session)):
    """Login user and return JWT token"""
    try:
        # Find user
        result = await session.execute(select(User).where(User.email == request.email))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        # Set httpOnly cookie
        from app.core.config import settings
        is_production = settings.NODE_ENV == "production"
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,  # Prevent XSS attacks
            secure=is_production,  # HTTPS only in production
            samesite="strict" if is_production else "lax",  # Strict in production
            max_age=60 * 60 * 24 * 7,  # 7 days
            path="/",  # Ensure cookie is sent for all paths
        )
        
        logger.info(f"User logged in: {user.email}")
        
        return {
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse(
                id=str(user.id),
                email=user.email,
                name=user.name,
                created_at=user.created_at.isoformat(),
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
async def get_current_user_info(user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        created_at=user.created_at.isoformat(),
    )
