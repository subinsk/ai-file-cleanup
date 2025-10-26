"""
ZIP file creation service for downloading cleaned files
"""
import logging
import os
import tempfile
import zipfile
from typing import List, Dict, Any, BinaryIO
from pathlib import Path
import asyncio
from fastapi.responses import StreamingResponse
import io

logger = logging.getLogger(__name__)

class ZipService:
    """Service for creating ZIP files from selected files"""
    
    def __init__(self):
        self.temp_dir = None
        self.created_files = []
    
    async def create_zip_from_files(self, files: List[Dict[str, Any]]) -> StreamingResponse:
        """
        Create a ZIP file from selected files
        
        Args:
            files: List of file dictionaries with 'id', 'filename', 'content', 'mime_type'
            
        Returns:
            StreamingResponse with ZIP file
        """
        try:
            # Create temporary directory
            self.temp_dir = tempfile.mkdtemp(prefix="ai_cleanup_")
            zip_path = os.path.join(self.temp_dir, "cleaned_files.zip")
            
            # Create ZIP file
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_info in files:
                    try:
                        # Create safe filename
                        safe_filename = self._create_safe_filename(file_info['filename'])
                        
                        # Add file to ZIP
                        zipf.writestr(safe_filename, file_info['content'])
                        self.created_files.append(safe_filename)
                        
                        logger.info(f"Added {safe_filename} to ZIP")
                        
                    except Exception as e:
                        logger.error(f"Failed to add {file_info.get('filename', 'unknown')} to ZIP: {e}")
                        continue
            
            # Create streaming response
            def iter_file():
                with open(zip_path, 'rb') as f:
                    while True:
                        chunk = f.read(8192)  # 8KB chunks
                        if not chunk:
                            break
                        yield chunk
                
                # Cleanup after streaming
                self._cleanup()
            
            return StreamingResponse(
                iter_file(),
                media_type="application/zip",
                headers={
                    "Content-Disposition": "attachment; filename=cleaned_files.zip",
                    "Content-Type": "application/zip"
                }
            )
            
        except Exception as e:
            logger.error(f"ZIP creation failed: {e}")
            self._cleanup()
            raise
    
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
