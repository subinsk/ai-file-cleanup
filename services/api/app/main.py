"""
Main FastAPI application
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api import auth, license, dedupe, desktop, health, files

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("🚀 Starting API service...")
    await init_db()
    logger.info("✅ Database initialized")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down API service...")
    await close_db()


# Create FastAPI app
app = FastAPI(
    title="AI File Cleanup API",
    description="REST API for AI-powered file deduplication",
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

# Security middleware (production only)
if settings.NODE_ENV == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS,
    )

# Register routes
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(license.router, prefix="/license", tags=["license"])
app.include_router(dedupe.router, prefix="/dedupe", tags=["dedupe"])
app.include_router(files.router, prefix="/files", tags=["files"])
app.include_router(desktop.router, prefix="/desktop", tags=["desktop"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI File Cleanup API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }
