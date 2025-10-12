"""
Main FastAPI application for ML inference
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.models import load_models
from app.api import embeddings, health

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events
    """
    # Startup: Load ML models
    logger.info("🤖 Initializing ML models...")
    logger.info("📦 Downloading models (this may take a few minutes on first run)...")
    
    await load_models()
    
    logger.info("✅ ML models loaded successfully!")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down ML service...")


# Create FastAPI app
app = FastAPI(
    title="AI File Cleanup - ML Service",
    description="Machine Learning inference service for file deduplication",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(embeddings.router, prefix="/embeddings", tags=["embeddings"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI File Cleanup ML Service",
        "version": "1.0.0",
        "status": "running",
    }

