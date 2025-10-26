"""
Upload API with Session Management
Handles file uploads to temporary storage and session creation
"""
import os
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from pydantic import BaseModel

from app.middleware.auth import get_current_user
from app.services.session_manager import session_manager
from app.services.background_worker import background_worker

router = APIRouter()
logger = logging.getLogger(__name__)

class UploadSessionResponse(BaseModel):
    session_id: str
    status: str
    message: str
    upload_url: str

class SessionStatusResponse(BaseModel):
    session_id: str
    status: str
    progress: int
    total_files: int
    processed_files: int
    failed_files: int
    duplicate_groups: List[dict]
    processing_stats: dict
    error_message: Optional[str] = None

@router.post("/upload", response_model=UploadSessionResponse)
async def upload_files_to_session(
    files: List[UploadFile] = File(...),
    background_tasks: BackgroundTasks = None,
    user=Depends(get_current_user)
):
    """
    Upload files to a temporary session for background processing
    """
    try:
        # Create a new session
        session = await session_manager.create_session(user.id)
        
        logger.info(f"Created session {session.session_id} for user {user.email}")
        
        # Save uploaded files to session directory
        uploaded_count = 0
        for file in files:
            try:
                # Save file to session temp directory
                file_path = session.temp_dir / file.filename
                
                # Read file content
                content = await file.read()
                
                # Write to temp file
                with open(file_path, 'wb') as f:
                    f.write(content)
                
                uploaded_count += 1
                logger.info(f"Saved file {file.filename} to session {session.session_id}")
                
            except Exception as e:
                logger.error(f"Failed to save file {file.filename}: {e}")
                continue
        
        if uploaded_count == 0:
            await session_manager.cleanup_session(session.session_id)
            raise HTTPException(status_code=400, detail="No files were uploaded successfully")
        
        # Update session with file count
        await session_manager.update_session_progress(
            session.session_id,
            total_files=uploaded_count,
            status="uploaded"
        )
        
        # Queue session for background processing
        background_tasks.add_task(background_worker.queue_session, session.session_id)
        
        return UploadSessionResponse(
            session_id=session.session_id,
            status="uploaded",
            message=f"Successfully uploaded {uploaded_count} files. Processing started.",
            upload_url=f"/api/sessions/{session.session_id}"
        )
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/sessions/{session_id}", response_model=SessionStatusResponse)
async def get_session_status(
    session_id: str,
    user=Depends(get_current_user)
):
    """
    Get the status of a processing session
    """
    try:
        # Get session from memory or load from file
        session = await session_manager.get_session(session_id)
        if not session:
            # Try to load from file
            session = await session_manager.load_session_state(session_id)
            if session:
                session_manager.sessions[session_id] = session
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Verify user owns this session
        if session.user_id != user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return SessionStatusResponse(
            session_id=session.session_id,
            status=session.status,
            progress=session.progress,
            total_files=session.total_files,
            processed_files=session.processed_files,
            failed_files=session.failed_files,
            duplicate_groups=session.duplicate_groups,
            processing_stats=session.processing_stats,
            error_message=session.error_message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get session status")

@router.get("/sessions", response_model=List[SessionStatusResponse])
async def list_user_sessions(
    user=Depends(get_current_user)
):
    """
    List all sessions for the current user
    """
    try:
        logger.info(f"Listing sessions for user {user.email} (ID: {user.id})")
        logger.info(f"Session manager temp_base_dir: {session_manager.temp_base_dir}")
        logger.info(f"Temp dir exists: {session_manager.temp_base_dir.exists()}")
        logger.info(f"Sessions in memory: {len(session_manager.sessions)}")
        
        user_sessions = []
        
        # Get sessions from memory
        for session in session_manager.sessions.values():
            if session.user_id == user.id:
                user_sessions.append(SessionStatusResponse(
                    session_id=session.session_id,
                    status=session.status,
                    progress=session.progress,
                    total_files=session.total_files,
                    processed_files=session.processed_files,
                    failed_files=session.failed_files,
                    duplicate_groups=session.duplicate_groups,
                    processing_stats=session.processing_stats,
                    error_message=session.error_message
                ))
        
        # Also check for sessions in temp directory
        temp_dir = session_manager.temp_base_dir
        if temp_dir.exists():
            for session_dir in temp_dir.iterdir():
                if session_dir.is_dir():
                    session_id = session_dir.name
                    if session_id not in session_manager.sessions:
                        session = await session_manager.load_session_state(session_id)
                        if session and session.user_id == user.id:
                            user_sessions.append(SessionStatusResponse(
                                session_id=session.session_id,
                                status=session.status,
                                progress=session.progress,
                                total_files=session.total_files,
                                processed_files=session.processed_files,
                                failed_files=session.failed_files,
                                duplicate_groups=session.duplicate_groups,
                                processing_stats=session.processing_stats,
                                error_message=session.error_message
                            ))
        
        logger.info(f"Returning {len(user_sessions)} sessions for user {user.email}")
        return user_sessions
        
    except Exception as e:
        logger.error(f"Failed to list sessions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list sessions: {str(e)}")

@router.post("/sessions/{session_id}/cleanup")
async def cleanup_session_files(
    session_id: str,
    request: dict,
    user=Depends(get_current_user)
):
    """
    Create cleaned files by removing selected duplicates
    """
    try:
        session = await session_manager.get_session(session_id)
        if not session:
            session = await session_manager.load_session_state(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Verify user owns this session
        if session.user_id != user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get selected file IDs to remove
        selected_file_ids = request.get('selectedFiles', [])
        
        if not selected_file_ids:
            raise HTTPException(status_code=400, detail="No files selected for removal")
        
        # Create cleaned files by excluding selected duplicates
        cleaned_files = []
        files_to_keep = []
        
        # Get all files from duplicate groups
        for group in session.duplicate_groups:
            # Keep the first file (original)
            if group.get('files') and len(group['files']) > 0:
                original_file = group['files'][0]
                files_to_keep.append(original_file)
                
                # Add remaining files that are NOT selected for removal
                for file_info in group['files'][1:]:
                    if file_info.get('id') not in selected_file_ids:
                        files_to_keep.append(file_info)
        
        # Create ZIP file with cleaned files
        import zipfile
        import tempfile
        import os
        
        temp_dir = tempfile.mkdtemp()
        zip_path = os.path.join(temp_dir, f"cleaned_files_{session_id}.zip")
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_info in files_to_keep:
                try:
                    # Read file from session temp directory
                    # Try both fileName and name for compatibility
                    filename = file_info.get('fileName') or file_info.get('name', 'unknown')
                    file_path = session.temp_dir / filename
                    if file_path.exists():
                        with open(file_path, 'rb') as f:
                            zipf.writestr(filename, f.read())
                except Exception as e:
                    logger.error(f"Failed to add file {filename} to ZIP: {e}")
                    continue
        
        # Return file as streaming response
        from fastapi.responses import StreamingResponse
        
        def file_generator():
            with open(zip_path, 'rb') as f:
                while chunk := f.read(8192):
                    yield chunk
            # Cleanup temp file
            os.unlink(zip_path)
            os.rmdir(temp_dir)
        
        return StreamingResponse(
            file_generator(),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=cleaned_files_{session_id}.zip",
                "Cache-Control": "no-cache"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cleanup session files: {e}")
        raise HTTPException(status_code=500, detail="Failed to cleanup session files")

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user=Depends(get_current_user)
):
    """
    Delete a session and its files
    """
    try:
        session = await session_manager.get_session(session_id)
        if not session:
            session = await session_manager.load_session_state(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Verify user owns this session
        if session.user_id != user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Clean up session
        await session_manager.cleanup_session(session_id)
        
        return {"message": "Session deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete session: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete session")
