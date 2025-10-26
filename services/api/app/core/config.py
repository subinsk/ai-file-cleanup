"""Configuration settings optimized for Render deployment"""
import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings"""
    
    # Environment
    NODE_ENV: str = "development"
    PORT: int = 3001  # Render uses $PORT
    HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "INFO"
    
    # Database (Neon PostgreSQL)
    DATABASE_URL: str
    
    # Security
    SESSION_SECRET: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 10080  # 7 days
    
    # CORS - Allow all origins for development
    CORS_ORIGINS: Union[List[str], str] = "*"
    ALLOWED_HOSTS: List[str] = ["*"]
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from comma-separated string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    # File Upload
    MAX_FILE_SIZE_MB: int = 10
    MAX_TOTAL_UPLOAD_SIZE_MB: int = 100
    MAX_FILES_PER_UPLOAD: int = 100
    UPLOAD_DIR: str = "/tmp/uploads"  # Render uses /tmp for temp storage
    
    # Similarity Thresholds
    EXACT_MATCH_THRESHOLD: float = 0.98
    HIGH_SIMILARITY_THRESHOLD: float = 0.9
    MEDIUM_SIMILARITY_THRESHOLD: float = 0.85
    
    # Rate Limiting
    RATE_LIMIT_MAX: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 900
    
    # ML Service URL (Render internal URL)
    ML_SERVICE_URL: str = "http://localhost:3002"
    ML_SERVICE_TIMEOUT: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env that aren't in Settings


settings = Settings()

# Create upload directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Derived values
MAX_FILE_SIZE_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024
MAX_TOTAL_UPLOAD_SIZE_BYTES = settings.MAX_TOTAL_UPLOAD_SIZE_MB * 1024 * 1024
