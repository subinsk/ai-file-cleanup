"""
Scanner service for directory scanning and file classification
"""

import os
import hashlib
import asyncio
from pathlib import Path
from typing import List, Dict, Any
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
            # Update session status to running
            await self._update_session_status(session_id, "running", db)
            
            # Get all files in directory
            files = await self._get_files_recursive(directory_path)
            total_files = len(files)
            
            # Update total files count
            await self._update_session_files_total(session_id, total_files, db)
            
            # Process files
            processed_count = 0
            duplicates_found = 0
            
            for file_path in files:
                try:
                    # Process individual file
                    file_data = await self._process_file(file_path, db)
                    if file_data:
                        processed_count += 1
                        
                        # Check for duplicates
                        duplicates = await self._check_duplicates(file_data, db)
                        if duplicates:
                            duplicates_found += len(duplicates)
                    
                    # Update progress
                    progress = (processed_count / total_files) * 100
                    await self._update_session_progress(
                        session_id, processed_count, total_files, 
                        duplicates_found, progress, db
                    )
                    
                    # Send real-time update
                    await websocket_manager.broadcast_scan_progress(
                        session_id, {
                            "progress": progress,
                            "files_processed": processed_count,
                            "files_total": total_files,
                            "duplicates_found": duplicates_found
                        }
                    )
                    
                except Exception as e:
                    print(f"Error processing file {file_path}: {e}")
                    continue
            
            # Mark session as completed
            await self._update_session_status(session_id, "completed", db)
            
            # Send completion notification
            await websocket_manager.broadcast_scan_progress(
                session_id, {
                    "progress": 100.0,
                    "files_processed": processed_count,
                    "files_total": total_files,
                    "duplicates_found": duplicates_found,
                    "status": "completed"
                }
            )
            
        except Exception as e:
            # Mark session as failed
            await self._update_session_status(session_id, "failed", str(e), db)
            print(f"Scan failed for session {session_id}: {e}")
    
    async def _get_files_recursive(self, directory_path: str) -> List[str]:
        """Get all files recursively from directory"""
        files = []
        try:
            for root, dirs, filenames in os.walk(directory_path):
                for filename in filenames:
                    file_path = os.path.join(root, filename)
                    if self._is_supported_file(file_path):
                        files.append(file_path)
        except Exception as e:
            print(f"Error walking directory {directory_path}: {e}")
        
        return files
    
    def _is_supported_file(self, file_path: str) -> bool:
        """Check if file is supported for processing"""
        try:
            ext = Path(file_path).suffix.lower()
            return ext in self.supported_extensions
        except:
            return False
    
    async def _process_file(self, file_path: str, db: AsyncSession) -> Dict[str, Any]:
        """Process a single file and extract metadata"""
        try:
            # Get file stats
            stat = os.stat(file_path)
            file_size = stat.st_size
            created_at = datetime.fromtimestamp(stat.st_ctime)
            modified_at = datetime.fromtimestamp(stat.st_mtime)
            
            # Get file type using python-magic
            file_type = magic.from_file(file_path, mime=True)
            
            # Calculate hashes
            md5_hash = await self._calculate_hash(file_path, 'md5')
            sha256_hash = await self._calculate_hash(file_path, 'sha256')
            
            # Classify file using simple classifier
            category = await self.classifier.classify_file(file_path)
            
            # Create file record
            file_record = File(
                path=file_path,
                name=os.path.basename(file_path),
                size=file_size,
                file_type=file_type,
                category=category,
                hash_md5=md5_hash,
                hash_sha256=sha256_hash,
                created_at=created_at,
                modified_at=modified_at,
                scanned_at=datetime.now()
            )
            
            db.add(file_record)
            await db.commit()
            await db.refresh(file_record)
            
            return file_record.to_dict()
            
        except Exception as e:
            print(f"Error processing file {file_path}: {e}")
            return None
    
    async def _calculate_hash(self, file_path: str, algorithm: str) -> str:
        """Calculate file hash"""
        hash_obj = hashlib.new(algorithm)
        try:
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_obj.update(chunk)
            return hash_obj.hexdigest()
        except Exception as e:
            print(f"Error calculating {algorithm} hash for {file_path}: {e}")
            return ""
    
    # This method is now handled by SimpleClassifier
    
    async def _check_duplicates(self, file_data: Dict[str, Any], db: AsyncSession) -> List[Dict]:
        """Check for duplicates of the current file"""
        try:
            # This would implement duplicate detection logic
            # For now, return empty list
            return []
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
