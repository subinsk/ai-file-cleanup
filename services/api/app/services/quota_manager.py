"""
User quota management service
"""
import logging
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.models.upload import Upload
from app.models.file import File

logger = logging.getLogger(__name__)


class QuotaManager:
    """Manage user storage and upload quotas"""
    
    async def check_user_storage_quota(self, user_id: str, additional_size_bytes: int) -> bool:
        """
        Check if user has enough storage quota for additional data
        
        Args:
            user_id: User ID
            additional_size_bytes: Size of data to add in bytes
            
        Returns:
            True if user has enough quota, False otherwise
        """
        try:
            # Convert string ID to UUID
            try:
                user_uuid = UUID(user_id)
            except (ValueError, AttributeError):
                logger.error(f"Invalid user ID format: {user_id}")
                return False
            
            async with AsyncSessionLocal() as session:
                # Get user's total file size
                result = await session.execute(
                    select(Upload)
                    .where(Upload.user_id == user_uuid)
                    .options(selectinload(Upload.files))
                )
                user_uploads = result.scalars().all()
                
                total_size = 0
                for upload in user_uploads:
                    for file in upload.files:
                        total_size += file.size_bytes or 0
                
                # Check if adding new data would exceed quota
                max_bytes = settings.MAX_STORAGE_PER_USER_MB * 1024 * 1024
                if total_size + additional_size_bytes > max_bytes:
                    logger.warning(f"User {user_id} exceeded storage quota: {total_size + additional_size_bytes} > {max_bytes}")
                    return False
                
                return True
            
        except Exception as e:
            logger.error(f"Error checking storage quota: {e}")
            # Default to allowing if quota check fails
            return True
    
    async def check_user_upload_count(self, user_id: str) -> bool:
        """
        Check if user has reached maximum upload count
        
        Args:
            user_id: User ID
            
        Returns:
            True if user can upload more, False otherwise
        """
        try:
            # Convert string ID to UUID
            try:
                user_uuid = UUID(user_id)
            except (ValueError, AttributeError):
                logger.error(f"Invalid user ID format: {user_id}")
                return False
            
            async with AsyncSessionLocal() as session:
                # Count user's uploads
                result = await session.execute(
                    select(func.count()).select_from(Upload).where(Upload.user_id == user_uuid)
                )
                upload_count = result.scalar() or 0
                
                if upload_count >= settings.MAX_UPLOADS_PER_USER:
                    logger.warning(f"User {user_id} reached upload limit: {upload_count}")
                    return False
                
                return True
            
        except Exception as e:
            logger.error(f"Error checking upload count: {e}")
            # Default to allowing if check fails
            return True
    
    async def get_user_quota_info(self, user_id: str) -> dict:
        """
        Get user's quota usage information
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with quota information
        """
        try:
            # Convert string ID to UUID
            try:
                user_uuid = UUID(user_id)
            except (ValueError, AttributeError):
                logger.error(f"Invalid user ID format: {user_id}")
                return self._get_empty_quota_info()
            
            async with AsyncSessionLocal() as session:
                # Get user's uploads and files
                result = await session.execute(
                    select(Upload)
                    .where(Upload.user_id == user_uuid)
                    .options(selectinload(Upload.files))
                )
                user_uploads = result.scalars().all()
                
                total_size = 0
                total_files = 0
                for upload in user_uploads:
                    for file in upload.files:
                        total_size += file.size_bytes or 0
                        total_files += 1
                
                max_storage_bytes = settings.MAX_STORAGE_PER_USER_MB * 1024 * 1024
                max_uploads = settings.MAX_UPLOADS_PER_USER
                
                return {
                    'storage_used_bytes': total_size,
                    'storage_limit_bytes': max_storage_bytes,
                    'storage_used_mb': round(total_size / (1024 * 1024), 2),
                    'storage_limit_mb': settings.MAX_STORAGE_PER_USER_MB,
                    'storage_percentage': round((total_size / max_storage_bytes) * 100, 2) if max_storage_bytes > 0 else 0,
                    'uploads_count': len(user_uploads),
                    'uploads_limit': max_uploads,
                    'files_count': total_files,
                }
            
        except Exception as e:
            logger.error(f"Error getting quota info: {e}")
            return self._get_empty_quota_info()
    
    def _get_empty_quota_info(self) -> dict:
        """Return empty quota info structure"""
        return {
            'storage_used_bytes': 0,
            'storage_limit_bytes': 0,
            'storage_used_mb': 0,
            'storage_limit_mb': 0,
            'storage_percentage': 0,
            'uploads_count': 0,
            'uploads_limit': 0,
            'files_count': 0,
        }


# Global quota manager instance
quota_manager = QuotaManager()
