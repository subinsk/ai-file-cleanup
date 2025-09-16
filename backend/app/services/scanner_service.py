"""
Scanner service for directory scanning and file classification
"""

import os
import hashlib
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import magic
from datetime import datetime

from app.models.file import File
from app.models.scan_session import ScanSession
from app.core.websocket_manager import websocket_manager
from app.services.ml_models.simple_classifier import SimpleClassifier
from app.services.ml_models.duplicate_detector import DuplicateDetector


class ScannerService:
    """Service for scanning directories and classifying files"""
    
    def __init__(self):
        self.classifier = SimpleClassifier()
        self.duplicate_detector = DuplicateDetector()
        self.supported_extensions = {
            '.pdf', '.doc', '.docx', '.txt', '.rtf',  # Documents
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff',  # Images
            '.mp4', '.avi', '.mov', '.wmv', '.flv',  # Videos
            '.mp3', '.wav', '.flac', '.aac',  # Audio
            '.py', '.js', '.ts', '.java', '.cpp', '.c', '.h'  # Code
        }
    
    async def scan_directory(
        self, 
        session_id: str, 
        directory_path: str, 
        db: AsyncSession
    ):
        """Scan a directory and classify files"""
        try:
            print(f"🔍 Starting scan for session {session_id} in directory: {directory_path}")
            
            # Update session status to running
            await self._update_session_status(session_id, "running", db)
            print(f"✅ Session status updated to running")
            
            # Get all files in directory
            files = await self._get_files_recursive(directory_path)
            total_files = len(files)
            print(f"📁 Found {total_files} files to process")
            
            if total_files == 0:
                print("⚠️ No files found to process")
                await self._update_session_status(session_id, "completed", db)
                return
            
            # Update total files count
            await self._update_session_files_total(session_id, total_files, db)
            print(f"✅ Total files count updated: {total_files}")
            
            # Process files first (without duplicate detection)
            processed_count = 0
            processed_files = []
            batch_size = 10  # Process files in batches
            
            print(f"🔄 Starting file processing loop for {total_files} files")
            for i, file_path in enumerate(files):
                try:
                    print(f"📄 Processing file {i+1}/{total_files}: {file_path}")
                    
                    # Process individual file
                    file_data = await self._process_file(file_path, session_id, db)
                    if file_data:
                        processed_count += 1
                        processed_files.append(file_data)
                        print(f"✅ File processed successfully: {file_path}")
                    else:
                        print(f"⚠️ File processing returned None: {file_path}")
                    
                    # Commit in batches for better performance
                    if processed_count % batch_size == 0:
                        try:
                            await db.commit()
                            print(f"💾 Committed batch of {batch_size} files")
                        except Exception as e:
                            print(f"❌ Error committing batch: {e}")
                            await db.rollback()
                    
                    # Update progress (first phase - scanning)
                    progress = (processed_count / total_files) * 50  # First 50% for scanning
                    print(f"📊 Updating progress: {progress:.1f}% ({processed_count}/{total_files})")
                    
                    await self._update_session_progress(
                        session_id, processed_count, total_files, 
                        0, progress, db
                    )
                    
                    # Send real-time update
                    await websocket_manager.broadcast_scan_progress(
                        session_id, {
                            "status": "running",
                            "progress": progress,
                            "files_processed": processed_count,
                            "files_total": total_files,
                            "duplicates_found": 0,
                            "phase": "scanning"
                        }
                    )
                    
                    print(f"✅ Processed {processed_count}/{total_files} files ({progress:.1f}%)")
                    
                except Exception as e:
                    print(f"❌ Error processing file {file_path}: {e}")
                    import traceback
                    traceback.print_exc()
                    continue
            
            # Commit any remaining files
            if processed_count % batch_size != 0:
                try:
                    await db.commit()
                    print(f"💾 Committed final batch of {processed_count % batch_size} files")
                except Exception as e:
                    print(f"❌ Error committing final batch: {e}")
                    await db.rollback()
            
            # Now detect duplicates (second phase)
            print(f"🔍 Starting duplicate detection for {len(processed_files)} processed files")
            duplicates_found = 0
            if processed_files:
                duplicates_found = await self._detect_all_duplicates(processed_files, db)
                print(f"🔍 Found {duplicates_found} duplicate groups")
            else:
                print("⚠️ No processed files to check for duplicates")
            
            # Update session with final duplicate count before marking as completed
            await self._update_session_progress(
                session_id, 
                processed_count, 
                total_files, 
                duplicates_found, 
                100.0, 
                db
            )
            
            # Mark session as completed
            await self._update_session_status(session_id, "completed", db)
            
            # Send completion notification
            await websocket_manager.broadcast_scan_progress(
                session_id, {
                    "status": "completed",
                    "progress": 100.0,
                    "files_processed": processed_count,
                    "files_total": total_files,
                    "duplicates_found": duplicates_found,
                    "phase": "completed"
                }
            )
            
            print(f"✅ Scan completed for session {session_id}: {processed_count} files processed, {duplicates_found} duplicates found")
            
        except Exception as e:
            # Mark session as failed
            print(f"❌ CRITICAL ERROR in scan_directory: {e}")
            import traceback
            traceback.print_exc()
            await self._update_session_status(session_id, "failed", str(e), db)
            print(f"Scan failed for session {session_id}: {e}")
    
    async def _get_files_recursive(self, directory_path: str) -> List[str]:
        """Get all files recursively from directory"""
        files = []
        try:
            print(f"🔍 Walking directory: {directory_path}")
            
            # Check if directory exists
            if not os.path.exists(directory_path):
                print(f"❌ Directory does not exist: {directory_path}")
                return files
            
            if not os.path.isdir(directory_path):
                print(f"❌ Path is not a directory: {directory_path}")
                return files
            
            print(f"✅ Directory exists and is accessible: {directory_path}")
            
            for root, dirs, filenames in os.walk(directory_path):
                print(f"📁 Checking directory: {root} (found {len(filenames)} files)")
                for filename in filenames:
                    file_path = os.path.join(root, filename)
                    if self._is_supported_file(file_path):
                        files.append(file_path)
                        print(f"✅ Added supported file: {file_path}")
                    else:
                        print(f"❌ Skipped unsupported file: {file_path}")
        except Exception as e:
            print(f"❌ Error walking directory {directory_path}: {e}")
            import traceback
            traceback.print_exc()
        
        print(f"📊 Total supported files found: {len(files)}")
        return files
    
    def _is_supported_file(self, file_path: str) -> bool:
        """Check if file is supported for processing"""
        try:
            ext = Path(file_path).suffix.lower()
            is_supported = ext in self.supported_extensions
            if not is_supported:
                print(f"❌ Unsupported extension '{ext}' for file: {file_path}")
            return is_supported
        except Exception as e:
            print(f"❌ Error checking file support for {file_path}: {e}")
            return False
    
    async def _process_file(self, file_path: str, session_id: str, db: AsyncSession) -> Dict[str, Any]:
        """Process a single file and extract metadata"""
        try:
            print(f"🔍 Processing file: {file_path}")
            
            # Check if file already exists in database
            existing_file = await self._get_existing_file(file_path, db)
            if existing_file:
                print(f"📄 File already exists in database: {file_path}")
                return existing_file.to_dict()
            
            # Get file stats
            stat = os.stat(file_path)
            file_size = stat.st_size
            created_at = datetime.fromtimestamp(stat.st_ctime)
            modified_at = datetime.fromtimestamp(stat.st_mtime)
            
            print(f"📊 File size: {file_size} bytes")
            
            # Get file type using python-magic
            file_type = magic.from_file(file_path, mime=True)
            print(f"📄 File type: {file_type}")
            
            # Calculate hashes
            print(f"🔐 Calculating hashes...")
            md5_hash = await self._calculate_hash(file_path, 'md5')
            sha256_hash = await self._calculate_hash(file_path, 'sha256')
            
            # Classify file using simple classifier
            print(f"🤖 Classifying file...")
            category = await self.classifier.classify_file(file_path)
            print(f"📂 Category: {category}")
            
            # Create file record
            file_record = File(
                path=file_path,
                name=os.path.basename(file_path),
                size=file_size,
                file_type=file_type,
                category=category,
                hash_md5=md5_hash,
                hash_sha256=sha256_hash,
                scan_session_id=session_id,
                created_at=created_at,
                modified_at=modified_at,
                scanned_at=datetime.now()
            )
            
            # Add to database with conflict handling
            try:
                db.add(file_record)
                await db.flush()  # Flush to get the ID but don't commit yet
                await db.refresh(file_record)
                print(f"✅ Successfully processed file: {file_path}")
                return file_record.to_dict()
            except Exception as db_error:
                # Handle constraint violation gracefully
                if "duplicate key value violates unique constraint" in str(db_error):
                    print(f"⚠️ File already exists, skipping: {file_path}")
                    # Try to get the existing file again
                    existing_file = await self._get_existing_file(file_path, db)
                    if existing_file:
                        return existing_file.to_dict()
                    else:
                        # If we can't get the existing file, return a basic dict
                        return {
                            "path": file_path,
                            "name": os.path.basename(file_path),
                            "size": file_size,
                            "file_type": file_type,
                            "category": category,
                            "hash_md5": md5_hash,
                            "hash_sha256": sha256_hash,
                            "created_at": created_at,
                            "modified_at": modified_at,
                            "scanned_at": datetime.now()
                        }
                else:
                    raise db_error
            
        except Exception as e:
            print(f"❌ Error processing file {file_path}: {e}")
            import traceback
            traceback.print_exc()
            # Don't rollback here - let the calling function handle it
            return None
    
    async def _get_existing_file(self, file_path: str, db: AsyncSession) -> File:
        """Check if file already exists in database"""
        try:
            from sqlalchemy import select
            query = select(File).where(File.path == file_path)
            result = await db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            print(f"Error checking existing file {file_path}: {e}")
            return None
    
    async def _calculate_hash(self, file_path: str, algorithm: str) -> str:
        """Calculate file hash"""
        hash_obj = hashlib.new(algorithm)
        try:
            print(f"🔐 Calculating {algorithm} hash for {file_path}")
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_obj.update(chunk)
            hash_value = hash_obj.hexdigest()
            print(f"✅ {algorithm} hash calculated: {hash_value[:16]}...")
            return hash_value
        except Exception as e:
            print(f"❌ Error calculating {algorithm} hash for {file_path}: {e}")
            return ""
    
    async def _get_files_with_same_size(self, file_size: int, db: AsyncSession) -> List[File]:
        """Get all files with the same size from database"""
        try:
            if not file_size:
                return []
            
            query = select(File).where(File.size == file_size)
            result = await db.execute(query)
            return result.scalars().all()
        except Exception as e:
            print(f"Error getting files with same size: {e}")
            return []
    
    async def _detect_all_duplicates(self, processed_files: List[Dict], db: AsyncSession) -> int:
        """Detect duplicates among all processed files"""
        try:
            if not processed_files:
                print("⚠️ No processed files provided for duplicate detection")
                return 0
            
            print(f"🔍 Analyzing {len(processed_files)} files for duplicates")
            
            # Group files by size for efficient comparison
            size_groups = {}
            for file_data in processed_files:
                size = file_data.get('size', 0)
                if size not in size_groups:
                    size_groups[size] = []
                size_groups[size].append(file_data)
            
            print(f"📊 Grouped files into {len(size_groups)} size groups")
            
            total_duplicate_groups = 0
            
            # Process each size group
            for size, files in size_groups.items():
                if len(files) < 2:
                    print(f"📁 Size group {size} bytes: {len(files)} files (skipping - need at least 2)")
                    continue
                
                print(f"📁 Size group {size} bytes: {len(files)} files (checking for duplicates)")
                
                # Get file paths for duplicate detection
                file_paths = [f['path'] for f in files]
                print(f"🔍 Checking files: {file_paths}")
                
                # Find duplicates using the duplicate detector
                duplicates = await self.duplicate_detector.find_duplicates(file_paths)
                print(f"🔍 Duplicate detector found {len(duplicates)} duplicate pairs")
                
                # Group duplicates by similarity and save to database
                if duplicates:
                    print(f"💾 Saving {len(duplicates)} duplicate pairs to database")
                    duplicate_groups = await self._group_and_save_duplicates(duplicates, files, db)
                    total_duplicate_groups += duplicate_groups
                    print(f"✅ Created {duplicate_groups} duplicate groups")
                else:
                    print(f"✅ No duplicates found in size group {size} bytes")
            
            print(f"🎯 Total duplicate groups created: {total_duplicate_groups}")
            return total_duplicate_groups
            
        except Exception as e:
            print(f"❌ Error detecting all duplicates: {e}")
            import traceback
            traceback.print_exc()
            return 0
    
    async def _group_and_save_duplicates(self, duplicates: List[Tuple[str, str, float]], files: List[Dict], db: AsyncSession) -> int:
        """Group duplicates and save them with proper group IDs"""
        try:
            from app.models.duplicate import Duplicate
            from uuid import uuid4
            
            # Create a mapping of file paths to file data
            file_map = {f['path']: f for f in files}
            
            # Group duplicates by similarity
            duplicate_groups = {}
            group_id = str(uuid4())  # Single group ID for all duplicates in this batch
            
            for file1_path, file2_path, similarity in duplicates:
                # Find the file records
                file1_data = file_map.get(file1_path)
                file2_data = file_map.get(file2_path)
                
                if not file1_data or not file2_data:
                    continue
                
                # Create duplicate record
                duplicate_record = Duplicate(
                    file_id=file1_data['id'],
                    duplicate_file_id=file2_data['id'],
                    duplicate_group_id=group_id,  # Same group ID for all duplicates
                    similarity_score=similarity,
                    detection_method='hash' if similarity == 1.0 else 'perceptual',
                    is_primary='true'
                )
                
                db.add(duplicate_record)
            
            await db.commit()
            return 1  # Return 1 group created
            
        except Exception as e:
            print(f"Error grouping and saving duplicates: {e}")
            return 0
    
    async def _save_duplicate_pair(self, duplicate: Tuple[str, str, float], files: List[Dict], db: AsyncSession):
        """Save a duplicate pair to database"""
        try:
            from app.models.duplicate import Duplicate
            from uuid import uuid4
            
            file1_path, file2_path, similarity = duplicate
            
            # Find the file records
            file1_data = next((f for f in files if f['path'] == file1_path), None)
            file2_data = next((f for f in files if f['path'] == file2_path), None)
            
            if not file1_data or not file2_data:
                return
            
            # Create duplicate record
            duplicate_record = Duplicate(
                file_id=file1_data['id'],
                duplicate_file_id=file2_data['id'],
                duplicate_group_id=str(uuid4()),  # Generate new group ID
                similarity_score=similarity,
                detection_method='hash' if similarity == 1.0 else 'perceptual',
                is_primary=True
            )
            
            db.add(duplicate_record)
            await db.commit()
            
        except Exception as e:
            print(f"Error saving duplicate pair: {e}")
    
    async def _save_duplicates_to_db(self, file_data: Dict[str, Any], duplicates: List[Dict], db: AsyncSession):
        """Save duplicate records to database"""
        try:
            from app.models.duplicate import Duplicate
            from uuid import uuid4
            
            current_file_id = file_data.get('id')
            if not current_file_id:
                return
            
            for dup in duplicates:
                # Find the duplicate file in database
                duplicate_file_query = select(File).where(File.path == dup['file2'])
                duplicate_file_result = await db.execute(duplicate_file_query)
                duplicate_file = duplicate_file_result.scalar_one_or_none()
                
                if not duplicate_file:
                    continue
                
                # Create duplicate record
                duplicate_record = Duplicate(
                    file_id=current_file_id,
                    duplicate_file_id=duplicate_file.id,
                    duplicate_group_id=str(uuid4()),  # Generate new group ID
                    similarity_score=dup['similarity'],
                    detection_method=dup['method'],
                    is_primary='true'
                )
                
                db.add(duplicate_record)
            
            await db.commit()
            
        except Exception as e:
            print(f"Error saving duplicates to database: {e}")
    
    # This method is now handled by SimpleClassifier
    
    async def _check_duplicates(self, file_data: Dict[str, Any], db: AsyncSession) -> List[Dict]:
        """Check for duplicates of the current file"""
        try:
            file_path = file_data.get('path')
            if not file_path:
                return []
            
            # Get all files with the same size (quick filter)
            same_size_files = await self._get_files_with_same_size(file_data.get('size'), db)
            if not same_size_files:
                return []
            
            # Use the duplicate detector to find duplicates
            file_paths = [f.path for f in same_size_files if f.path != file_path]
            if not file_paths:
                return []
            
            # Add current file to the list for comparison
            all_files = [file_path] + file_paths
            
            # Find duplicates using the duplicate detector
            duplicates = await self.duplicate_detector.find_duplicates(all_files)
            
            # Filter duplicates that include the current file
            current_file_duplicates = []
            for dup in duplicates:
                if file_path in dup[:2]:  # Check if current file is in the duplicate pair
                    current_file_duplicates.append({
                        'file1': dup[0],
                        'file2': dup[1],
                        'similarity': dup[2],
                        'method': 'hash' if dup[2] == 1.0 else 'perceptual'
                    })
            
            # Save duplicates to database
            await self._save_duplicates_to_db(file_data, current_file_duplicates, db)
            
            return current_file_duplicates
            
        except Exception as e:
            print(f"Error checking duplicates for {file_data.get('path', 'unknown')}: {e}")
            return []
    
    async def _update_session_status(
        self, 
        session_id: str, 
        status: str, 
        db: AsyncSession,
        error_message: str = None
    ):
        """Update scan session status"""
        try:
            stmt = update(ScanSession).where(ScanSession.id == session_id).values(
                status=status,
                error_message=error_message,
                completed_at=datetime.now() if status in ['completed', 'failed'] else None
            )
            await db.execute(stmt)
            await db.commit()
        except Exception as e:
            print(f"Error updating session status: {e}")
            # If the session is rolled back, try to rollback and continue
            try:
                await db.rollback()
                print("Session rolled back, continuing...")
            except Exception as rollback_error:
                print(f"Error during rollback: {rollback_error}")
    
    async def _update_session_files_total(
        self, 
        session_id: str, 
        total_files: int, 
        db: AsyncSession
    ):
        """Update total files count in session"""
        try:
            stmt = update(ScanSession).where(ScanSession.id == session_id).values(
                files_total=total_files
            )
            await db.execute(stmt)
            await db.commit()
        except Exception as e:
            print(f"Error updating session files total: {e}")
            # If the session is rolled back, try to rollback and continue
            try:
                await db.rollback()
                print("Session rolled back, continuing...")
            except Exception as rollback_error:
                print(f"Error during rollback: {rollback_error}")
    
    async def _update_session_progress(
        self, 
        session_id: str, 
        files_processed: int, 
        files_total: int, 
        duplicates_found: int, 
        progress: float, 
        db: AsyncSession
    ):
        """Update scan session progress"""
        try:
            stmt = update(ScanSession).where(ScanSession.id == session_id).values(
                files_processed=files_processed,
                files_total=files_total,
                duplicates_found=duplicates_found,
                progress_percentage=progress
            )
            await db.execute(stmt)
            await db.commit()
        except Exception as e:
            print(f"Error updating session progress: {e}")
            # If the session is rolled back, try to rollback and continue
            try:
                await db.rollback()
                print("Session rolled back, continuing...")
            except Exception as rollback_error:
                print(f"Error during rollback: {rollback_error}")
