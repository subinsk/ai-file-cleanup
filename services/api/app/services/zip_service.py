"""ZIP file generation service"""
import os
import zipfile
import tempfile
import asyncio
from typing import List, Dict, Any
from pathlib import Path
import aiofiles
import logging

logger = logging.getLogger(__name__)


class ZipService:
    """Service for creating ZIP files from selected files"""
    
    def __init__(self, upload_dir: str = None):
        self.upload_dir = upload_dir or "/tmp/uploads"
    
    async def create_zip_from_files(
        self, 
        upload_id: str, 
        file_ids: List[str], 
        file_metadata: List[Dict[str, Any]] = None
    ) -> str:
        """
        Create a ZIP file containing the specified files
        
        Args:
            upload_id: Unique identifier for the upload session
            file_ids: List of file IDs to include in ZIP
            file_metadata: Optional metadata about files
            
        Returns:
            Path to the created ZIP file
        """
        try:
            # Create temporary directory for ZIP creation
            with tempfile.TemporaryDirectory() as temp_dir:
                zip_filename = f"cleaned-files-{upload_id}.zip"
                zip_path = os.path.join(temp_dir, zip_filename)
                
                # Create ZIP file
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                    # Add files to ZIP
                    for i, file_id in enumerate(file_ids):
                        await self._add_file_to_zip(
                            zip_file, 
                            file_id, 
                            file_metadata[i] if file_metadata and i < len(file_metadata) else None
                        )
                
                # Move ZIP to upload directory for serving
                final_zip_path = os.path.join(self.upload_dir, zip_filename)
                os.makedirs(os.path.dirname(final_zip_path), exist_ok=True)
                
                # Copy ZIP file to final location
                async with aiofiles.open(zip_path, 'rb') as src:
                    async with aiofiles.open(final_zip_path, 'wb') as dst:
                        while chunk := await src.read(8192):
                            await dst.write(chunk)
                
                logger.info(f"Created ZIP file: {final_zip_path}")
                return final_zip_path
                
        except Exception as e:
            logger.error(f"Error creating ZIP file: {e}", exc_info=True)
            raise
    
    async def _add_file_to_zip(
        self, 
        zip_file: zipfile.ZipFile, 
        file_id: str, 
        metadata: Dict[str, Any] = None
    ):
        """Add a single file to the ZIP archive"""
        try:
            # For MVP, create placeholder content
            # In production, this would read actual uploaded files
            if metadata and 'name' in metadata:
                filename = metadata['name']
            else:
                filename = f"file_{file_id}"
            
            # Create placeholder content
            content = self._create_placeholder_content(file_id, metadata)
            
            # Add to ZIP with proper path structure
            zip_path = f"cleaned/{filename}"
            zip_file.writestr(zip_path, content)
            
            logger.debug(f"Added file to ZIP: {zip_path}")
            
        except Exception as e:
            logger.error(f"Error adding file {file_id} to ZIP: {e}")
            # Continue with other files even if one fails
            pass
    
    def _create_placeholder_content(self, file_id: str, metadata: Dict[str, Any] = None) -> str:
        """Create placeholder content for a file"""
        content_lines = [
            f"Cleaned file: {file_id}",
            f"Original name: {metadata.get('name', 'unknown') if metadata else 'unknown'}",
            f"Size: {metadata.get('size', 'unknown') if metadata else 'unknown'} bytes",
            f"Type: {metadata.get('type', 'unknown') if metadata else 'unknown'}",
            "",
            "This is a placeholder for the cleaned file.",
            "In production, this would contain the actual cleaned file content."
        ]
        
        return "\n".join(content_lines)
    
    async def cleanup_zip(self, zip_path: str):
        """Clean up a ZIP file after serving"""
        try:
            if os.path.exists(zip_path):
                os.remove(zip_path)
                logger.info(f"Cleaned up ZIP file: {zip_path}")
        except Exception as e:
            logger.error(f"Error cleaning up ZIP file {zip_path}: {e}")


# Global instance
zip_service = ZipService()
