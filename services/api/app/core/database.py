"""Database connection using SQLAlchemy (Neon PostgreSQL)"""
import logging
import re
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

# Prepare database URL for asyncpg
# Convert postgresql:// to postgresql+asyncpg://
database_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Remove sslmode parameter (asyncpg doesn't support it, uses connect_args instead)
database_url = re.sub(r'[?&]sslmode=[^&]*&?', '', database_url)
# Clean up any trailing ? or &
database_url = re.sub(r'[?&]$', '', database_url)

# Create async engine with SSL for Neon
# Neon requires SSL, so we pass it via connect_args
engine = create_async_engine(
    database_url,
    echo=False,  # Set to True for SQL logging in development
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before using them
    connect_args={"ssl": "require"} if "neon.tech" in settings.DATABASE_URL or "amazonaws.com" in settings.DATABASE_URL else {},
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db():
    """Initialize database connection"""
    try:
        # Test connection
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("✅ Database connected (Neon PostgreSQL)")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise


async def close_db():
    """Close database connection"""
    try:
        await engine.dispose()
        logger.info("Database connection closed")
    except Exception as e:
        logger.error(f"Database disconnect failed: {e}")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting async database session
    
    Usage in FastAPI:
        async def my_endpoint(session: AsyncSession = Depends(get_session)):
            result = await session.execute(select(User))
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
