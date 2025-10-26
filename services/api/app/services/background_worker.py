"""
Background Worker for File Processing
Handles asynchronous file processing and duplicate detection
"""
import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

from app.services.session_manager import session_manager
from app.services.file_processor import file_processor
from app.api.dedupe import _find_duplicate_groups

logger = logging.getLogger(__name__)

class BackgroundWorker:
    def __init__(self):
        self.is_running = False
        self.processing_queue = asyncio.Queue()
        
    async def start(self):
        """Start the background worker"""
        self.is_running = True
        logger.info("Background worker started")
        
        # Start worker tasks
        tasks = [
            asyncio.create_task(self.process_queue()),
            asyncio.create_task(self.cleanup_old_sessions()),
        ]
        
        await asyncio.gather(*tasks)
    
    async def stop(self):
        """Stop the background worker"""
        self.is_running = False
        logger.info("Background worker stopped")
    
    async def queue_session(self, session_id: str):
        """Queue a session for processing"""
        await self.processing_queue.put(session_id)
        logger.info(f"Queued session {session_id} for processing")
    
    async def process_queue(self):
        """Process sessions from the queue"""
        while self.is_running:
            try:
                # Wait for a session to process
                session_id = await asyncio.wait_for(
                    self.processing_queue.get(), 
                    timeout=1.0
                )
                
                await self.process_session(session_id)
                
            except asyncio.TimeoutError:
                # No sessions to process, continue
                continue
            except Exception as e:
                logger.error(f"Error processing queue: {e}")
                await asyncio.sleep(1)
    
    async def process_session(self, session_id: str):
        """Process a single session"""
        try:
            session = await session_manager.get_session(session_id)
            if not session:
                logger.error(f"Session {session_id} not found")
                return
            
            logger.info(f"Starting processing for session {session_id}")
            
            # Update status to processing
            await session_manager.update_session_progress(
                session_id, 
                status="processing",
                progress=0
            )
            
            # Get list of uploaded files
            uploaded_files = await self.get_uploaded_files(session)
            session.total_files = len(uploaded_files)
            
            if session.total_files == 0:
                await session_manager.update_session_progress(
                    session_id,
                    status="failed",
                    error_message="No files found to process"
                )
                return
            
            # Process files
            processed_files = []
            failed_count = 0
            
            for i, file_path in enumerate(uploaded_files):
                try:
                    # Update progress
                    progress = int((i / session.total_files) * 100)
                    await session_manager.update_session_progress(
                        session_id,
                        progress=progress,
                        processed_files=i
                    )
                    
                    # Process the file
                    result = await self.process_single_file(file_path)
                    processed_files.append(result)
                    
                    logger.info(f"Processed file {file_path.name} in session {session_id}")
                    
                except Exception as e:
                    logger.error(f"Failed to process file {file_path}: {e}")
                    failed_count += 1
                    
                    # Add failed file to results
                    processed_files.append({
                        'id': f"file_{i}",
                        'fileName': file_path.name,  # Frontend expects fileName
                        'name': file_path.name,  # Keep for compatibility
                        'sizeBytes': file_path.stat().st_size,  # Frontend expects sizeBytes
                        'size': file_path.stat().st_size,  # Keep for compatibility
                        'mimeType': 'application/octet-stream',  # Frontend expects mimeType
                        'type': 'application/octet-stream',  # Keep for compatibility
                        'success': False,
                        'error': str(e)
                    })
            
            # Find duplicate groups
            logger.info(f"Finding duplicates for session {session_id}")
            groups = await _find_duplicate_groups(processed_files, [], [])
            
            # Calculate final statistics
            successful_files = len(processed_files) - failed_count
            processing_stats = {
                'total_files': session.total_files,
                'successful_files': successful_files,
                'failed_files': failed_count,
                'text_files': len([f for f in processed_files if f.get('text_content')]),
                'image_files': len([f for f in processed_files if f.get('base64_image')]),
                'duplicate_groups': len(groups),
                'total_duplicates': sum(len(g.get('duplicates', [])) for g in groups),
            }
            
            # Update session with final results
            await session_manager.update_session_progress(
                session_id,
                status="completed",
                progress=100,
                processed_files=successful_files,
                failed_files=failed_count,
                duplicate_groups=groups,
                processing_stats=processing_stats
            )
            
            logger.info(f"Completed processing session {session_id}: {processing_stats}")
            
        except Exception as e:
            logger.error(f"Failed to process session {session_id}: {e}")
            await session_manager.update_session_progress(
                session_id,
                status="failed",
                error_message=str(e)
            )
    
    async def get_uploaded_files(self, session) -> List[Path]:
        """Get list of uploaded files in session directory"""
        files = []
        for file_path in session.temp_dir.iterdir():
            if file_path.is_file() and file_path.name != "results.json":
                files.append(file_path)
        return files
    
    async def process_single_file(self, file_path: Path) -> Dict[str, Any]:
        """Process a single file"""
        try:
            # Read file content
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            # Determine MIME type
            mime_type = self.get_mime_type(file_path)
            
            # Process file using the file processor
            result = await file_processor.process_file(
                file_data=file_data,
                filename=file_path.name,
                mime_type=mime_type
            )
            
            # Add additional metadata
            result.update({
                'id': f"file_{file_path.name}",
                'fileName': file_path.name,  # Frontend expects fileName
                'name': file_path.name,  # Keep for compatibility
                'sizeBytes': file_path.stat().st_size,  # Frontend expects sizeBytes
                'size': file_path.stat().st_size,  # Keep for compatibility
                'mimeType': mime_type,  # Frontend expects mimeType
                'type': mime_type,  # Keep for compatibility
                'success': result.get('success', True),
                'file_hash': result.get('file_hash', ''),
                'sha256': result.get('file_hash', ''),  # For compatibility
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")
            raise
    
    def get_mime_type(self, file_path: Path) -> str:
        """Get MIME type based on file extension"""
        extension = file_path.suffix.lower()
        mime_types = {
            '.txt': 'text/plain',
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.json': 'application/json',
            '.ini': 'text/plain',
        }
        return mime_types.get(extension, 'application/octet-stream')
    
    async def cleanup_old_sessions(self):
        """Periodically clean up old sessions"""
        while self.is_running:
            try:
                await asyncio.sleep(3600)  # Run every hour
                await session_manager.cleanup_old_sessions()
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")

# Global background worker instance
background_worker = BackgroundWorker()
