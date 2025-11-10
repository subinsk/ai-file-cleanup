"""
ZIP file creation service for downloading cleaned files
"""
import logging
import os
import tempfile
import zipfile
from typing import List, Dict, Any, BinaryIO, Optional
from pathlib import Path
import asyncio
from fastapi.responses import StreamingResponse
import io
import json

logger = logging.getLogger(__name__)

class ZipService:
    """Service for creating ZIP files from selected files"""
    
    def __init__(self):
        self.temp_dir = None
        self.created_files = []
    
    async def create_zip_from_files(
        self, 
        upload_id: Optional[str] = None,
        file_ids: Optional[List[str]] = None,
        files: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Create a ZIP file from selected files
        
        Args:
            upload_id: Session/upload ID to load files from
            file_ids: List of file IDs to include (files to keep, excluding duplicates)
            files: Optional direct list of file dictionaries (for backward compatibility)
            
        Returns:
            Path to created ZIP file
        """
        try:
            # Create temporary directory
            self.temp_dir = tempfile.mkdtemp(prefix="ai_cleanup_")
            zip_path = os.path.join(self.temp_dir, f"cleaned_files_{upload_id or 'temp'}.zip")
            
            files_to_zip = []
            
            # If upload_id and file_ids provided, load from session
            if upload_id and file_ids:
                files_to_zip = await self._load_files_from_session(upload_id, file_ids)
            elif files:
                # Direct file list provided (backward compatibility)
                files_to_zip = files
            else:
                raise ValueError("Either (upload_id and file_ids) or files must be provided")
            
            # Create ZIP file
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_info in files_to_zip:
                    try:
                        filename = file_info.get('fileName') or file_info.get('filename') or file_info.get('name', 'unknown')
                        safe_filename = self._create_safe_filename(filename)
                        
                        # Get file content
                        file_content = None
                        if 'content' in file_info:
                            file_content = file_info['content']
                            if isinstance(file_content, str):
                                file_content = file_content.encode('utf-8')
                        elif 'path' in file_info and os.path.exists(file_info['path']):
                            with open(file_info['path'], 'rb') as f:
                                file_content = f.read()
                        else:
                            logger.warning(f"No content or path found for file {filename}")
                            continue
                        
                        # Add file to ZIP
                        zipf.writestr(safe_filename, file_content)
                        self.created_files.append(safe_filename)
                        
                        logger.info(f"Added {safe_filename} to ZIP")
                        
                    except Exception as e:
                        logger.error(f"Failed to add {file_info.get('filename', 'unknown')} to ZIP: {e}")
                        continue
            
            logger.info(f"Created ZIP file with {len(self.created_files)} files: {zip_path}")
            return zip_path
            
        except Exception as e:
            logger.error(f"ZIP creation failed: {e}", exc_info=True)
            self._cleanup()
            raise
    
    async def _load_files_from_session(self, upload_id: str, file_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Load files from session based on upload_id and file_ids
        
        Args:
            upload_id: Session/upload ID
            file_ids: List of file IDs to include
            
        Returns:
            List of file dictionaries
        """
        from app.services.session_manager import session_manager
        
        # Load session
        session = await session_manager.get_session(upload_id)
        if not session:
            session = await session_manager.load_session_state(upload_id)
        
        if not session:
            raise FileNotFoundError(f"Session {upload_id} not found")
        
        files_to_keep = []
        file_ids_set = set(file_ids)
        
        # Collect all files from duplicate groups
        all_files = []
        for group in session.duplicate_groups:
            # Add keep file
            if group.get('keepFile'):
                keep_file = group['keepFile']
                all_files.append(keep_file)
            
            # Add duplicates
            for dup in group.get('duplicates', []):
                if dup.get('file'):
                    all_files.append(dup['file'])
        
        # Filter to only include files NOT in file_ids (files to keep)
        for file_info in all_files:
            file_id = file_info.get('id') or file_info.get('fileName') or file_info.get('name')
            if file_id and file_id not in file_ids_set:
                # Try to load file from session temp directory
                filename = file_info.get('fileName') or file_info.get('name', 'unknown')
                file_path = session.temp_dir / filename
                
                if file_path.exists():
                    file_info['path'] = str(file_path)
                    files_to_keep.append(file_info)
                else:
                    # File not in temp dir, but we have metadata
                    files_to_keep.append(file_info)
        
        logger.info(f"Loaded {len(files_to_keep)} files from session {upload_id}")
        return files_to_keep
    
    def cleanup_zip(self, zip_path: str):
        """Clean up ZIP file after streaming"""
        try:
            if os.path.exists(zip_path):
                os.unlink(zip_path)
                logger.info(f"Cleaned up ZIP file: {zip_path}")
            
            # Also cleanup temp directory if it's empty
            zip_dir = os.path.dirname(zip_path)
            if zip_dir and os.path.exists(zip_dir):
                try:
                    os.rmdir(zip_dir)
                except OSError:
                    pass  # Directory not empty, ignore
        except Exception as e:
            logger.warning(f"Failed to cleanup ZIP file {zip_path}: {e}")
    
    async def create_zip_from_paths(self, file_paths: List[str], output_filename: str = "cleaned_files.zip") -> str:
        """
        Create a ZIP file from file paths
        
        Args:
            file_paths: List of file paths to include
            output_filename: Name of the output ZIP file
            
        Returns:
            Path to created ZIP file
        """
        try:
            # Create temporary directory
            self.temp_dir = tempfile.mkdtemp(prefix="ai_cleanup_")
            zip_path = os.path.join(self.temp_dir, output_filename)
            
            # Create ZIP file
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_path in file_paths:
                    if os.path.exists(file_path):
                        try:
                            # Get relative path for ZIP
                            arcname = os.path.basename(file_path)
                            zipf.write(file_path, arcname)
                            self.created_files.append(arcname)
                            
                            logger.info(f"Added {arcname} to ZIP")
                            
                        except Exception as e:
                            logger.error(f"Failed to add {file_path} to ZIP: {e}")
                            continue
                    else:
                        logger.warning(f"File not found: {file_path}")
            
            return zip_path
            
        except Exception as e:
            logger.error(f"ZIP creation from paths failed: {e}")
            self._cleanup()
            raise
    
    def _create_safe_filename(self, filename: str) -> str:
        """
        Create a safe filename for ZIP entry
        
        Args:
            filename: Original filename
            
        Returns:
            Safe filename
        """
        # Remove or replace unsafe characters
        safe_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_."
        safe_filename = "".join(c if c in safe_chars else "_" for c in filename)
        
        # Ensure it's not empty
        if not safe_filename:
            safe_filename = "file"
        
        # Add extension if missing
        if not safe_filename.endswith(('.pdf', '.jpg', '.jpeg', '.png', '.txt', '.doc', '.docx')):
            safe_filename += ".file"
        
        return safe_filename
    
    def _cleanup(self):
        """Clean up temporary files and directories"""
        try:
            if self.temp_dir and os.path.exists(self.temp_dir):
                import shutil
                shutil.rmtree(self.temp_dir)
                logger.info("Cleaned up temporary directory")
        except Exception as e:
            logger.warning(f"Failed to cleanup temporary directory: {e}")
        finally:
            self.temp_dir = None
            self.created_files = []
    
    async def get_zip_info(self, zip_path: str) -> Dict[str, Any]:
        """
        Get information about a ZIP file
        
        Args:
            zip_path: Path to ZIP file
            
        Returns:
            Dictionary with ZIP information
        """
        try:
            with zipfile.ZipFile(zip_path, 'r') as zipf:
                file_list = zipf.namelist()
                total_size = sum(info.file_size for info in zipf.infolist())
                compressed_size = os.path.getsize(zip_path)
                
                return {
                    'file_count': len(file_list),
                    'files': file_list,
                    'total_uncompressed_size': total_size,
                    'compressed_size': compressed_size,
                    'compression_ratio': round((1 - compressed_size / total_size) * 100, 2) if total_size > 0 else 0
                }
        except Exception as e:
            logger.error(f"Failed to get ZIP info: {e}")
            return {}

# Create global instance
zip_service = ZipService()
