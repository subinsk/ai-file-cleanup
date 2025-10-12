"""Database connection using Prisma (Neon PostgreSQL)"""
import logging
from prisma import Prisma

logger = logging.getLogger(__name__)

# Global Prisma client
db = Prisma()


async def init_db():
    """Initialize database connection"""
    try:
        await db.connect()
        logger.info("✅ Database connected (Neon PostgreSQL)")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise


async def close_db():
    """Close database connection"""
    try:
        await db.disconnect()
        logger.info("Database disconnected")
    except Exception as e:
        logger.error(f"Database disconnect failed: {e}")


def get_db() -> Prisma:
    """Get database instance"""
    return db
