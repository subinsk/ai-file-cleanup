"""
Upload API with Session Management
Handles file uploads to temporary storage and session creation
"""
import os
import logging
from pathlib import Path
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
        
        # temp_dir is already set to absolute path in create_session
        logger.info(f"Saving files to: {session.temp_dir} (absolute: {session.temp_dir.is_absolute()})")
        
        # Save uploaded files to session directory
        uploaded_count = 0
        for file in files:
            try:
                # Save file to session temp directory (use absolute path)
                file_path = session.temp_dir / file.filename
                
                # Read file content
                content = await file.read()
                
                # Write to temp file
                with open(file_path, 'wb') as f:
                    f.write(content)
                
                uploaded_count += 1
                logger.info(f"Saved file {file.filename} ({len(content)} bytes) to {file_path}")
                
            except Exception as e:
                logger.error(f"Failed to save file {file.filename}: {e}", exc_info=True)
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
        
        # Resolve temp_dir path first
        temp_dir_path = session.temp_dir
        if isinstance(temp_dir_path, str):
            temp_dir_path = Path(temp_dir_path)
        
        # Fallback: if somehow it's still relative, make it absolute
        if not temp_dir_path.is_absolute():
            temp_dir_path = session_manager.temp_base_dir / temp_dir_path.name
            logger.warning(f"temp_dir was relative, converted to: {temp_dir_path}")
        
        logger.info(f"Session temp_dir: {temp_dir_path} (exists: {temp_dir_path.exists()})")
        
        # Create cleaned files by excluding selected duplicates
        # selected_file_ids contains files to REMOVE, so we keep everything else
        selected_file_ids_set = set(selected_file_ids)
        files_to_keep = []
        
        # Get all files from duplicate groups
        for group in session.duplicate_groups:
            # Add keepFile (the file we're keeping from this group)
            if group.get('keepFile'):
                keep_file = group['keepFile']
                keep_file_id = keep_file.get('id') or keep_file.get('fileName') or keep_file.get('name')
                # Only add if it's NOT in the selected files to remove
                if keep_file_id and keep_file_id not in selected_file_ids_set:
                    files_to_keep.append(keep_file)
            
            # Add duplicates that are NOT selected for removal
            for duplicate in group.get('duplicates', []):
                if duplicate.get('file'):
                    dup_file = duplicate['file']
                    dup_file_id = dup_file.get('id') or dup_file.get('fileName') or dup_file.get('name')
                    # Only add if it's NOT in the selected files to remove
                    if dup_file_id and dup_file_id not in selected_file_ids_set:
                        files_to_keep.append(dup_file)
        
        # Also include unique files (files with no duplicates)
        # Get all files from the temp directory that aren't in any duplicate group
        if temp_dir_path.exists():
            all_uploaded_files = [f for f in temp_dir_path.iterdir() if f.is_file() and f.name != "results.json"]
            
            # Create a set of all file IDs/names that are in duplicate groups
            files_in_groups = set()
            for group in session.duplicate_groups:
                if group.get('keepFile'):
                    keep_file = group['keepFile']
                    keep_file_id = keep_file.get('id') or keep_file.get('fileName') or keep_file.get('name')
                    if keep_file_id:
                        files_in_groups.add(keep_file_id)
                        # Also add the filename
                        if keep_file.get('fileName'):
                            files_in_groups.add(keep_file.get('fileName'))
                        if keep_file.get('name'):
                            files_in_groups.add(keep_file.get('name'))
                
                for dup in group.get('duplicates', []):
                    if dup.get('file'):
                        dup_file = dup['file']
                        dup_file_id = dup_file.get('id') or dup_file.get('fileName') or dup_file.get('name')
                        if dup_file_id:
                            files_in_groups.add(dup_file_id)
                        if dup_file.get('fileName'):
                            files_in_groups.add(dup_file.get('fileName'))
                        if dup_file.get('name'):
                            files_in_groups.add(dup_file.get('name'))
            
            # Add files that aren't in any duplicate group and aren't selected for removal
            for uploaded_file in all_uploaded_files:
                file_name = uploaded_file.name
                # Check if this file is in any group or selected for removal
                if file_name not in files_in_groups and file_name not in selected_file_ids_set:
                    # This is a unique file (no duplicates) - add it to keep list
                    files_to_keep.append({
                        'id': f"file_{file_name}",
                        'fileName': file_name,
                        'name': file_name,
                        'path': str(uploaded_file)
                    })
                    logger.info(f"Added unique file (not in any group): {file_name}")
        
        logger.info(f"Reading files from temp_dir: {temp_dir_path} (exists: {temp_dir_path.exists()})")
        if temp_dir_path.exists():
            all_files_in_dir = list(temp_dir_path.iterdir())
            file_list = [f.name for f in all_files_in_dir if f.is_file() and f.name != "results.json"]
            logger.info(f"Actual files in temp_dir ({len(file_list)}): {file_list}")
        else:
            logger.error(f"Temp directory does not exist: {temp_dir_path}")
            raise HTTPException(status_code=404, detail=f"Session files not found. They may have been cleaned up.")
        
        logger.info(f"Creating ZIP with {len(files_to_keep)} files to keep (excluding {len(selected_file_ids)} selected for removal)")
        logger.info(f"Files to keep details: {[f.get('fileName') or f.get('name') or f.get('id') for f in files_to_keep[:5]]}")
        
        # Create ZIP file with cleaned files
        import zipfile
        import tempfile
        import os
        
        temp_dir = tempfile.mkdtemp()
        zip_path = os.path.join(temp_dir, f"cleaned_files_{session_id}.zip")
        
        # Create a mapping of all files in temp_dir by name for quick lookup
        files_in_dir_map = {f.name: f for f in temp_dir_path.iterdir() if f.is_file() and f.name != "results.json"}
        logger.info(f"Files in directory map ({len(files_in_dir_map)}): {list(files_in_dir_map.keys())}")
        logger.info(f"Files to keep count: {len(files_to_keep)}")
        
        # If no files to keep, but we have files in directory, include all files (user selected all duplicates)
        if len(files_to_keep) == 0 and len(files_in_dir_map) > 0:
            logger.warning("No files in files_to_keep, but files exist in directory. Including all files.")
            for file_name, file_path in files_in_dir_map.items():
                files_to_keep.append({
                    'id': f"file_{file_name}",
                    'fileName': file_name,
                    'name': file_name,
                    'path': str(file_path)
                })
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            files_added = 0
            seen_filenames = set()  # Track added files to avoid duplicates
            
            logger.info(f"Starting ZIP creation with {len(files_to_keep)} files to process")
            
            for idx, file_info in enumerate(files_to_keep):
                try:
                    # Get filename from file_info - try multiple fields
                    filename = (file_info.get('fileName') or 
                               file_info.get('name') or 
                               (file_info.get('id', 'unknown').replace('file_', '') if file_info.get('id', '').startswith('file_') else file_info.get('id', 'unknown')) or 
                               'unknown')
                    
                    logger.info(f"[{idx+1}/{len(files_to_keep)}] Processing: id={file_info.get('id')}, fileName={file_info.get('fileName')}, name={file_info.get('name')}, resolved_filename={filename}")
                    
                    # Try to find the file in the directory
                    file_path = None
                    
                    # First, try exact filename match
                    if filename in files_in_dir_map:
                        file_path = files_in_dir_map[filename]
                        logger.info(f"  → Exact match found: {filename}")
                    else:
                        # Try to match by any variation
                        matched = False
                        for existing_name, existing_path in files_in_dir_map.items():
                            # Match by base name (without extension)
                            base_name = filename.split('.')[0] if '.' in filename else filename
                            existing_base = existing_name.split('.')[0] if '.' in existing_name else existing_name
                            
                            if (base_name == existing_base or
                                existing_name == filename or
                                (file_info.get('id') and file_info.get('id').replace('file_', '') in existing_name)):
                                file_path = existing_path
                                filename = existing_name  # Use the actual filename from disk
                                matched = True
                                logger.info(f"  → Matched by variation: {filename} (was looking for {file_info.get('fileName')})")
                                break
                        
                        if not matched:
                            logger.warning(f"  → No match found for {filename}")
                    
                    if file_path and file_path.exists() and file_path.is_file():
                        # Avoid adding the same file twice
                        if filename not in seen_filenames:
                            with open(file_path, 'rb') as f:
                                file_content = f.read()
                            zipf.writestr(filename, file_content)
                            files_added += 1
                            seen_filenames.add(filename)
                            logger.info(f"  ✓ Added {filename} ({len(file_content)} bytes) to ZIP")
                        else:
                            logger.warning(f"  ⊗ Skipping duplicate: {filename}")
                    else:
                        logger.warning(f"  ✗ File not found: {filename}. Available: {list(files_in_dir_map.keys())[:5]}...")
                        
                except Exception as e:
                    logger.error(f"Failed to add file {file_info.get('fileName', 'unknown')} to ZIP: {e}", exc_info=True)
                    continue
            
            if files_added == 0:
                logger.error(f"No files were added to ZIP! files_to_keep count: {len(files_to_keep)}")
                logger.error(f"Available files in temp_dir: {list(files_in_dir_map.keys())}")
                logger.error(f"Files to keep IDs/names: {[f.get('id') or f.get('fileName') or f.get('name') for f in files_to_keep]}")
                raise HTTPException(status_code=500, detail="No files could be added to ZIP. Check server logs for details.")
            
            logger.info(f"Successfully created ZIP with {files_added} files")
        
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
