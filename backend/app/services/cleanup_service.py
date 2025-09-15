"""
Cleanup service for file management operations
"""

import os
import shutil
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime
import uuid

from app.models.file import File
from app.models.duplicate import Duplicate
from app.schemas.cleanup import CleanupRequest, CleanupRule, CleanupAction
from app.core.websocket_manager import websocket_manager


class CleanupService:
    """Service for executing cleanup operations"""
    
    def __init__(self):
        self.trash_dir = "./trash"  # Directory for moved files
        self.archive_dir = "./archive"  # Directory for archived files
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Ensure cleanup directories exist"""
        os.makedirs(self.trash_dir, exist_ok=True)
        os.makedirs(self.archive_dir, exist_ok=True)
    
    async def execute_cleanup(
        self, 
        cleanup_id: str, 
        request: CleanupRequest, 
        db: AsyncSession
    ):
        """Execute cleanup operations based on rules"""
        try:
            # Send start notification
            await websocket_manager.broadcast_cleanup_status(
                cleanup_id, {
                    "status": "running",
                    "progress": 0.0,
                    "files_processed": 0,
                    "files_removed": 0,
                    "space_freed": 0
                }
            )
            
            total_operations = 0
            files_processed = 0
            files_removed = 0
            space_freed = 0
            
            # Process each cleanup rule
            for rule in request.rules:
                if rule.action == CleanupAction.DELETE_DUPLICATES:
                    result = await self._delete_duplicates(rule, db)
                    total_operations += result["operations"]
                    files_processed += result["files_processed"]
                    files_removed += result["files_removed"]
                    space_freed += result["space_freed"]
                
                elif rule.action == CleanupAction.MOVE_TO_TRASH:
                    result = await self._move_to_trash(rule, db)
                    total_operations += result["operations"]
                    files_processed += result["files_processed"]
                    files_removed += result["files_removed"]
                    space_freed += result["space_freed"]
                
                elif rule.action == CleanupAction.ARCHIVE_OLD:
                    result = await self._archive_old_files(rule, db)
                    total_operations += result["operations"]
                    files_processed += result["files_processed"]
                    files_removed += result["files_removed"]
                    space_freed += result["space_freed"]
                
                elif rule.action == CleanupAction.ORGANIZE_BY_TYPE:
                    result = await self._organize_by_type(rule, db)
                    total_operations += result["operations"]
                    files_processed += result["files_processed"]
                    files_removed += result["files_removed"]
                    space_freed += result["space_freed"]
                
                # Send progress update
                progress = (files_processed / total_operations * 100) if total_operations > 0 else 100
                await websocket_manager.broadcast_cleanup_status(
                    cleanup_id, {
                        "status": "running",
                        "progress": progress,
                        "files_processed": files_processed,
                        "files_removed": files_removed,
                        "space_freed": space_freed
                    }
                )
            
            # Send completion notification
            await websocket_manager.broadcast_cleanup_status(
                cleanup_id, {
                    "status": "completed",
                    "progress": 100.0,
                    "files_processed": files_processed,
                    "files_removed": files_removed,
                    "space_freed": space_freed
                }
            )
            
        except Exception as e:
            # Send error notification
            await websocket_manager.broadcast_cleanup_status(
                cleanup_id, {
                    "status": "failed",
                    "progress": 0.0,
                    "files_processed": 0,
                    "files_removed": 0,
                    "space_freed": 0,
                    "error_message": str(e)
                }
            )
            print(f"Cleanup failed: {e}")
    
    async def _delete_duplicates(self, rule: CleanupRule, db: AsyncSession) -> Dict[str, int]:
        """Delete duplicate files based on rule"""
        try:
            operations = 0
            files_processed = 0
            files_removed = 0
            space_freed = 0
            
            # Get duplicate groups to process
            if rule.target_duplicate_groups:
                # Process specific groups
                query = select(Duplicate).where(
                    Duplicate.duplicate_group_id.in_(rule.target_duplicate_groups)
                )
            else:
                # Process all duplicates above similarity threshold
                query = select(Duplicate).where(
                    Duplicate.similarity_score >= rule.min_similarity_score
                )
            
            result = await db.execute(query)
            duplicates = result.scalars().all()
            
            # Group by duplicate group
            groups = {}
            for dup in duplicates:
                group_id = dup.duplicate_group_id
                if group_id not in groups:
                    groups[group_id] = []
                groups[group_id].append(dup)
            
            # Process each group
            for group_id, group_duplicates in groups.items():
                if rule.keep_primary:
                    # Keep the primary file, delete others
                    primary_dups = [d for d in group_duplicates if d.is_primary]
                    if primary_dups:
                        primary_dup = primary_dups[0]
                        # Delete all non-primary files
                        for dup in group_duplicates:
                            if not dup.is_primary:
                                success = await self._delete_file(dup.duplicate_file_id, db)
                                if success:
                                    files_removed += 1
                                    # Get file size for space calculation
                                    file_query = select(File).where(File.id == dup.duplicate_file_id)
                                    file_result = await db.execute(file_query)
                                    file = file_result.scalar_one_or_none()
                                    if file and file.size:
                                        space_freed += file.size
                                    operations += 1
                else:
                    # Delete all but one file in group
                    for i, dup in enumerate(group_duplicates):
                        if i > 0:  # Keep first file, delete rest
                            success = await self._delete_file(dup.duplicate_file_id, db)
                            if success:
                                files_removed += 1
                                # Get file size for space calculation
                                file_query = select(File).where(File.id == dup.duplicate_file_id)
                                file_result = await db.execute(file_query)
                                file = file_result.scalar_one_or_none()
                                if file and file.size:
                                    space_freed += file.size
                                operations += 1
                
                files_processed += len(group_duplicates)
            
            return {
                "operations": operations,
                "files_processed": files_processed,
                "files_removed": files_removed,
                "space_freed": space_freed
            }
            
        except Exception as e:
            print(f"Error deleting duplicates: {e}")
            return {"operations": 0, "files_processed": 0, "files_removed": 0, "space_freed": 0}
    
    async def _move_to_trash(self, rule: CleanupRule, db: AsyncSession) -> Dict[str, int]:
        """Move files to trash directory"""
        try:
            operations = 0
            files_processed = 0
            files_removed = 0
            space_freed = 0
            
            # Get files to move based on rule
            query = select(File)
            if rule.file_types:
                query = query.where(File.file_type.in_(rule.file_types))
            
            result = await db.execute(query)
            files = result.scalars().all()
            
            for file in files:
                try:
                    # Move file to trash
                    trash_path = os.path.join(self.trash_dir, file.name)
                    shutil.move(file.path, trash_path)
                    
                    # Update file path in database
                    file.path = trash_path
                    await db.commit()
                    
                    files_processed += 1
                    operations += 1
                    
                except Exception as e:
                    print(f"Error moving file {file.path} to trash: {e}")
                    continue
            
            return {
                "operations": operations,
                "files_processed": files_processed,
                "files_removed": files_removed,
                "space_freed": space_freed
            }
            
        except Exception as e:
            print(f"Error moving files to trash: {e}")
            return {"operations": 0, "files_processed": 0, "files_removed": 0, "space_freed": 0}
    
    async def _archive_old_files(self, rule: CleanupRule, db: AsyncSession) -> Dict[str, int]:
        """Archive old files"""
        try:
            operations = 0
            files_processed = 0
            files_removed = 0
            space_freed = 0
            
            # This would implement archiving logic based on file age
            # For now, return empty result
            
            return {
                "operations": operations,
                "files_processed": files_processed,
                "files_removed": files_removed,
                "space_freed": space_freed
            }
            
        except Exception as e:
            print(f"Error archiving old files: {e}")
            return {"operations": 0, "files_processed": 0, "files_removed": 0, "space_freed": 0}
    
    async def _organize_by_type(self, rule: CleanupRule, db: AsyncSession) -> Dict[str, int]:
        """Organize files by type"""
        try:
            operations = 0
            files_processed = 0
            files_removed = 0
            space_freed = 0
            
            # This would implement file organization logic
            # For now, return empty result
            
            return {
                "operations": operations,
                "files_processed": files_processed,
                "files_removed": files_removed,
                "space_freed": space_freed
            }
            
        except Exception as e:
            print(f"Error organizing files by type: {e}")
            return {"operations": 0, "files_processed": 0, "files_removed": 0, "space_freed": 0}
    
    async def _delete_file(self, file_id: str, db: AsyncSession) -> bool:
        """Delete a file from filesystem and database"""
        try:
            # Get file record
            file_query = select(File).where(File.id == file_id)
            file_result = await db.execute(file_query)
            file = file_result.scalar_one_or_none()
            
            if not file:
                return False
            
            # Delete from filesystem
            if os.path.exists(file.path):
                os.remove(file.path)
            
            # Delete from database
            delete_query = delete(File).where(File.id == file_id)
            await db.execute(delete_query)
            await db.commit()
            
            return True
            
        except Exception as e:
            print(f"Error deleting file {file_id}: {e}")
            return False
