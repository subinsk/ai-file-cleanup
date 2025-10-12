"""Security utilities: JWT, password hashing"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode JWT token"""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


def generate_license_key(user_id: str, license_type: str) -> str:
    """Generate license key"""
    import secrets
    import hashlib
    
    data = f"{user_id}:{license_type}:{secrets.token_hex(16)}"
    hash_obj = hashlib.sha256(data.encode())
    hex_digest = hash_obj.hexdigest()[:16].upper()
    return '-'.join([hex_digest[i:i+4] for i in range(0, 16, 4)])


def validate_license_key_format(key: str) -> bool:
    """Validate license key format"""
    import re
    return bool(re.match(r'^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$', key))
