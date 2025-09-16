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
from app.models.scan_session import ScanSession  # Import needed for relationship resolution
from app.schemas.duplicate import DuplicateGroup, DuplicateStats, FileInfo


class DuplicateService:
    """Service for detecting and managing duplicate files"""
    
    def __init__(self):
        self.similarity_threshold = 0.8
    
    async def get_duplicate_groups(
        self, 
        db: AsyncSession,
        session_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[DuplicateGroup]:
        """Get duplicate file groups"""
        try:
            print(f"🔍 Getting duplicate groups (session_id: {session_id}, limit: {limit}, offset: {offset})")
            
            # Filter duplicates by session ID if provided
            if session_id:
                try:
                    import uuid
                    session_uuid = uuid.UUID(session_id)
                    
                    # Join with File table to filter by scan_session_id
                    # Check both file_id and duplicate_file_id to ensure we get all duplicates for this session
                    query = select(Duplicate).join(
                        File, 
                        (File.id == Duplicate.file_id) | (File.id == Duplicate.duplicate_file_id)
                    ).where(
                        File.scan_session_id == session_uuid
                    ).offset(offset).limit(limit)
                    
                    print(f"📊 Filtering duplicates by session_id: {session_id}")
                except (ValueError, TypeError):
                    print(f"❌ Invalid session_id format: {session_id}, returning all duplicates")
                    query = select(Duplicate).offset(offset).limit(limit)
            else:
                # Return all duplicates if no session filter
                query = select(Duplicate).offset(offset).limit(limit)
            
            result = await db.execute(query)
            duplicates = result.scalars().all()
            print(f"📊 Found {len(duplicates)} duplicate records for session {session_id}")
            
            # Group duplicates by group_id
            groups = defaultdict(list)
            for dup in duplicates:
                groups[dup.duplicate_group_id].append(dup)
            
            print(f"📊 Grouped into {len(groups)} duplicate groups")
            
            # Convert to DuplicateGroup objects
            duplicate_groups = []
            for group_id, group_duplicates in groups.items():
                try:
                    group = await self._create_duplicate_group(group_id, group_duplicates, db)
                    if group:  # Only add if creation was successful
                        duplicate_groups.append(group)
                except Exception as e:
                    print(f"Warning: Failed to create duplicate group {group_id}: {e}")
                    continue
            
            print(f"✅ Returning {len(duplicate_groups)} duplicate groups")
            return duplicate_groups
            
        except Exception as e:
            print(f"Error getting duplicate groups: {e}")
            import traceback
            traceback.print_exc()
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
    
    async def get_duplicate_stats(self, db: AsyncSession, session_id: Optional[str] = None) -> DuplicateStats:
        """Get duplicate statistics"""
        try:
            print(f"🔍 Getting duplicate stats (session_id: {session_id})")
            
            # Convert session_id to UUID for database queries
            if not session_id:
                print("⚠️ No session_id provided, returning empty stats")
                return DuplicateStats(
                    total_duplicate_groups=0,
                    total_duplicate_files=0,
                    total_space_wasted=0,
                    space_wasted_mb=0,
                    space_wasted_gb=0,
                    most_common_type=None,
                    largest_group_size=0
                )
            
            try:
                import uuid
                session_uuid = uuid.UUID(session_id)
            except (ValueError, TypeError):
                print(f"❌ Invalid session_id format: {session_id}")
                return DuplicateStats(
                    total_duplicate_groups=0,
                    total_duplicate_files=0,
                    total_space_wasted=0,
                    space_wasted_mb=0,
                    space_wasted_gb=0,
                    most_common_type=None,
                    largest_group_size=0
                )
            
            # Count duplicate groups for this specific session
            groups_query = select(func.count(func.distinct(Duplicate.duplicate_group_id))).join(
                File, 
                (File.id == Duplicate.file_id) | (File.id == Duplicate.duplicate_file_id)
            ).where(File.scan_session_id == session_uuid)
            groups_result = await db.execute(groups_query)
            total_groups = groups_result.scalar() or 0
            print(f"📊 Total duplicate groups for session {session_id}: {total_groups}")
            
            # Count duplicate files for this specific session
            files_query = select(func.count(Duplicate.id)).join(
                File, 
                (File.id == Duplicate.file_id) | (File.id == Duplicate.duplicate_file_id)
            ).where(File.scan_session_id == session_uuid)
            files_result = await db.execute(files_query)
            total_files = files_result.scalar() or 0
            print(f"📊 Total duplicate files for session {session_id}: {total_files}")
            
            # Calculate space wasted (only count non-primary duplicate files) for this session
            space_query = select(func.sum(File.size)).join(
                Duplicate, 
                (File.id == Duplicate.file_id) | (File.id == Duplicate.duplicate_file_id)
            ).where(
                (Duplicate.is_primary == 'false') & 
                (File.scan_session_id == session_uuid)
            )
            space_result = await db.execute(space_query)
            space_wasted = space_result.scalar() or 0
            print(f"📊 Space wasted for session {session_id}: {space_wasted} bytes")
            
            # Get most common file type among duplicates for this session
            most_common_type = None
            try:
                type_query = select(File.file_type, func.count(File.file_type)).join(
                    Duplicate, 
                    (File.id == Duplicate.file_id) | (File.id == Duplicate.duplicate_file_id)
                ).where(
                    (File.file_type.isnot(None)) & 
                    (File.scan_session_id == session_uuid)
                ).group_by(File.file_type).order_by(func.count(File.file_type).desc()).limit(1)
                type_result = await db.execute(type_query)
                type_row = type_result.first()
                if type_row:
                    most_common_type = type_row[0]
                print(f"📊 Most common type for session {session_id}: {most_common_type}")
            except Exception as e:
                print(f"Warning: Could not get most common type: {e}")
            
            # Get largest group size for this session
            largest_group_size = 0
            try:
                group_size_query = select(
                    Duplicate.duplicate_group_id,
                    func.count(Duplicate.id)
                ).join(
                    File, 
                    (File.id == Duplicate.file_id) | (File.id == Duplicate.duplicate_file_id)
                ).where(
                    File.scan_session_id == session_uuid
                ).group_by(Duplicate.duplicate_group_id).order_by(func.count(Duplicate.id).desc()).limit(1)
                group_size_result = await db.execute(group_size_query)
                group_size_row = group_size_result.first()
                if group_size_row:
                    largest_group_size = group_size_row[1]
                print(f"📊 Largest group size for session {session_id}: {largest_group_size}")
            except Exception as e:
                print(f"Warning: Could not get largest group size: {e}")
            
            stats = DuplicateStats(
                total_duplicate_groups=total_groups,
                total_duplicate_files=total_files,
                total_space_wasted=space_wasted if space_wasted else 0,
                space_wasted_mb=(space_wasted / (1024 * 1024)) if space_wasted else 0,
                space_wasted_gb=(space_wasted / (1024 * 1024 * 1024)) if space_wasted else 0,
                most_common_type=most_common_type,
                largest_group_size=largest_group_size
            )
            
            return stats
            
        except Exception as e:
            print(f"Error getting duplicate stats: {e}")
            import traceback
            traceback.print_exc()
            # Return empty stats instead of None to avoid frontend issues
            return DuplicateStats(
                total_duplicate_groups=0,
                total_duplicate_files=0,
                total_space_wasted=0,
                space_wasted_mb=0,
                space_wasted_gb=0,
                most_common_type=None,
                largest_group_size=0
            )
    
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
