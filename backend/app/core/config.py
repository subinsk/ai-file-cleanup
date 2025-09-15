"""
Configuration settings for the AI File Management System
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/ai_file_cleanup"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Security
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # File processing
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    supported_file_types: list = [
        "pdf", "doc", "docx", "txt", "rtf",
        "jpg", "jpeg", "png", "gif", "bmp", "tiff",
        "mp4", "avi", "mov", "wmv", "flv",
        "mp3", "wav", "flac", "aac",
        "py", "js", "ts", "java", "cpp", "c", "h"
    ]
    
    # ML Models
    model_cache_dir: str = "./ml_models"
    enable_gpu: bool = False
    
    # API
    api_v1_prefix: str = "/api/v1"
    project_name: str = "AI File Management System"
    
    # CORS
    backend_cors_origins: list = [
        "http://localhost:3000",
        "http://frontend:3000"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()