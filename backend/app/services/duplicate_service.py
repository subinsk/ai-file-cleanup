"""
Duplicate detection service
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import hashlib
from collections import defaultdict

from app.models.file import File
from app.models.duplicate import Duplicate
from app.schemas.duplicate import DuplicateGroup, DuplicateStats, FileInfo


class DuplicateService:
    """Service for detecting and managing duplicate files"""
    
    def __init__(self):
        self.similarity_threshold = 0.8
    
    async def get_duplicate_groups(
        self, 
        session_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
        db: AsyncSession
    ) -> List[DuplicateGroup]:
        """Get duplicate file groups"""
        try:
            # Query duplicate groups
            query = select(Duplicate).offset(offset).limit(limit)
            if session_id:
                # Filter by session if provided
                pass  # Would need to join with scan sessions
            
            result = await db.execute(query)
            duplicates = result.scalars().all()
            
            # Group duplicates by group_id
            groups = defaultdict(list)
            for dup in duplicates:
                groups[dup.duplicate_group_id].append(dup)
            
            # Convert to DuplicateGroup objects
            duplicate_groups = []
            for group_id, group_duplicates in groups.items():
                if len(group_duplicates) > 1:  # Only groups with actual duplicates
                    duplicate_groups.append(
                        await self._create_duplicate_group(group_id, group_duplicates, db)
                    )
            
            return duplicate_groups
            
        except Exception as e:
            print(f"Error getting duplicate groups: {e}")
            return []
    
    async def _create_duplicate_group(
        self, 
        group_id: str, 
        duplicates: List[Duplicate], 
        db: AsyncSession
    ) -> DuplicateGroup:
        """Create a DuplicateGroup from duplicate records"""
        try:
            # Get file information for all files in group
            file_ids = [dup.file_id for dup in duplicates] + [dup.duplicate_file_id for dup in duplicates]
            file_ids = list(set(file_ids))  # Remove duplicates
            
            files_query = select(File).where(File.id.in_(file_ids))
            files_result = await db.execute(files_query)
            files = files_result.scalars().all()
            
            # Convert to FileInfo objects
            file_infos = [self._file_to_info(f) for f in files]
            
            # Find primary file (largest or first)
            primary_file = max(files, key=lambda f: f.size or 0)
            primary_file_info = self._file_to_info(primary_file)
            
            # Calculate total size and space wasted
            total_size = sum(f.size or 0 for f in files)
            space_wasted = total_size - (primary_file.size or 0)
            
            # Get similarity scores
            similarity_scores = [dup.similarity_score for dup in duplicates]
            
            return DuplicateGroup(
                group_id=str(group_id),
                files=file_infos,
                primary_file=primary_file_info,
                similarity_scores=similarity_scores,
                total_size=total_size,
                space_wasted=space_wasted,
                created_at=duplicates[0].created_at
            )
            
        except Exception as e:
            print(f"Error creating duplicate group: {e}")
            return None
    
    def _file_to_info(self, file: File) -> FileInfo:
        """Convert File model to FileInfo schema"""
        return FileInfo(
            id=str(file.id),
            name=file.name,
            path=file.path,
            size=file.size,
            file_type=file.file_type,
            category=file.category,
            created_at=file.created_at,
            modified_at=file.modified_at
        )
    
    async def get_duplicate_stats(self, db: AsyncSession) -> DuplicateStats:
        """Get duplicate statistics"""
        try:
            # Count duplicate groups
            groups_query = select(func.count(func.distinct(Duplicate.duplicate_group_id)))
            groups_result = await db.execute(groups_query)
            total_groups = groups_result.scalar() or 0
            
            # Count duplicate files
            files_query = select(func.count(Duplicate.id))
            files_result = await db.execute(files_query)
            total_files = files_result.scalar() or 0
            
            # Calculate space wasted
            space_query = select(func.sum(File.size)).join(Duplicate, File.id == Duplicate.duplicate_file_id)
            space_result = await db.execute(space_query)
            space_wasted = space_result.scalar() or 0
            
            return DuplicateStats(
                total_duplicate_groups=total_groups,
                total_duplicate_files=total_files,
                total_space_wasted=space_wasted,
                space_wasted_mb=space_wasted / (1024 * 1024),
                space_wasted_gb=space_wasted / (1024 * 1024 * 1024),
                most_common_type=None,  # Would need additional query
                largest_group_size=0  # Would need additional query
            )
            
        except Exception as e:
            print(f"Error getting duplicate stats: {e}")
            return DuplicateStats()
    
    async def detect_duplicates_for_file(self, file_id: str, db: AsyncSession) -> List[Duplicate]:
        """Detect duplicates for a specific file"""
        try:
            # Get file information
            file_query = select(File).where(File.id == file_id)
            file_result = await db.execute(file_query)
            file = file_result.scalar_one_or_none()
            
            if not file:
                return []
            
            # Find potential duplicates using different methods
            duplicates = []
            
            # 1. Hash-based duplicates (exact matches)
            hash_duplicates = await self._find_hash_duplicates(file, db)
            duplicates.extend(hash_duplicates)
            
            # 2. Perceptual hash duplicates (for images)
            if file.file_type and file.file_type.startswith('image/'):
                perceptual_duplicates = await self._find_perceptual_duplicates(file, db)
                duplicates.extend(perceptual_duplicates)
            
            # 3. Content-based duplicates (for text files)
            if file.file_type and file.file_type.startswith('text/'):
                content_duplicates = await self._find_content_duplicates(file, db)
                duplicates.extend(content_duplicates)
            
            return duplicates
            
        except Exception as e:
            print(f"Error detecting duplicates for file {file_id}: {e}")
            return []
    
    async def _find_hash_duplicates(self, file: File, db: AsyncSession) -> List[Duplicate]:
        """Find exact hash duplicates"""
        try:
            if not file.hash_md5:
                return []
            
            # Find files with same MD5 hash
            query = select(File).where(
                File.hash_md5 == file.hash_md5,
                File.id != file.id
            )
            result = await db.execute(query)
            duplicate_files = result.scalars().all()
            
            duplicates = []
            for dup_file in duplicate_files:
                duplicate = Duplicate(
                    file_id=file.id,
                    duplicate_file_id=dup_file.id,
                    duplicate_group_id=file.id,  # Use file ID as group ID
                    similarity_score=1.0,
                    detection_method="hash",
                    is_primary=True
                )
                duplicates.append(duplicate)
            
            return duplicates
            
        except Exception as e:
            print(f"Error finding hash duplicates: {e}")
            return []
    
    async def _find_perceptual_duplicates(self, file: File, db: AsyncSession) -> List[Duplicate]:
        """Find perceptual hash duplicates for images"""
        try:
            # This would implement perceptual hashing for images
            # For now, return empty list
            return []
        except Exception as e:
            print(f"Error finding perceptual duplicates: {e}")
            return []
    
    async def _find_content_duplicates(self, file: File, db: AsyncSession) -> List[Duplicate]:
        """Find content-based duplicates for text files"""
        try:
            # This would implement content similarity detection
            # For now, return empty list
            return []
        except Exception as e:
            print(f"Error finding content duplicates: {e}")
            return []
