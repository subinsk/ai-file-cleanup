"""
Main FastAPI application
"""
import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api import auth, license, dedupe, desktop, health, files, sessions
from app.services.background_worker import background_worker

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
    
    # Setup directories
    import subprocess
    try:
        subprocess.run([sys.executable, "setup_directories.py"], check=True, cwd=".")
        logger.info("✅ Directories setup complete")
    except Exception as e:
        logger.warning(f"⚠️ Directory setup failed: {e}")
    
    await init_db()
    logger.info("✅ Database initialized")
    
    # Start background worker
    logger.info("🔄 Starting background worker...")
    worker_task = asyncio.create_task(background_worker.start())
    logger.info("✅ Background worker started")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down API service...")
    await background_worker.stop()
    worker_task.cancel()
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
app.include_router(sessions.router, prefix="/uploads", tags=["uploads"])
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
