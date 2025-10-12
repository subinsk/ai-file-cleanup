"""
Configuration settings for ML service
"""
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 3002
    LOG_LEVEL: str = "INFO"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Models
    TEXT_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    IMAGE_MODEL_NAME: str = "openai/clip-vit-base-patch32"
    MODEL_CACHE_DIR: str = "./models_cache"
    
    # Processing
    MAX_BATCH_SIZE: int = 32
    DEVICE: str = "cpu"  # or "cuda" for GPU
    
    # Memory
    MAX_MEMORY_MB: int = 2048
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Create cache directory if it doesn't exist
os.makedirs(settings.MODEL_CACHE_DIR, exist_ok=True)

