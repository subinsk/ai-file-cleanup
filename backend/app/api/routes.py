"""
Main API routes for the AI File Management System
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.models.file import File
from app.models.duplicate import Duplicate
from app.models.scan_session import ScanSession
from app.services.scanner_service import ScannerService
from app.services.duplicate_service import DuplicateService
from app.services.cleanup_service import CleanupService
from app.schemas.scan import ScanRequest, ScanResponse, ScanStatus
from app.schemas.duplicate import DuplicateResponse, DuplicateGroup
from app.schemas.cleanup import CleanupRequest, CleanupResponse

# Create router
api_router = APIRouter()

# Initialize services
scanner_service = ScannerService()
duplicate_service = DuplicateService()
cleanup_service = CleanupService()


@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-file-cleanup-api"}


# Scan endpoints
@api_router.post("/scan/start", response_model=ScanResponse)
async def start_scan(
    request: ScanRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Start a new directory scan"""
    try:
        # Create scan session
        session = ScanSession(
            directory_path=request.directory_path,
            status="pending"
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        
        # Start background scan
        background_tasks.add_task(
            scanner_service.scan_directory,
            str(session.id),
            request.directory_path,
            db
        )
        
        return ScanResponse(
            session_id=str(session.id),
            status="started",
            message="Scan started successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start scan: {str(e)}")


@api_router.get("/scan/status/{session_id}", response_model=ScanStatus)
async def get_scan_status(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get scan status and progress"""
    try:
        session_uuid = uuid.UUID(session_id)
        result = await db.get(ScanSession, session_uuid)
        
        if not result:
            raise HTTPException(status_code=404, detail="Scan session not found")
        
        return ScanStatus(
            session_id=session_id,
            status=result.status,
            progress_percentage=result.progress_percentage,
            files_processed=result.files_processed,
            files_total=result.files_total,
            duplicates_found=result.duplicates_found,
            errors_count=result.errors_count,
            started_at=result.started_at,
            completed_at=result.completed_at,
            error_message=result.error_message
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scan status: {str(e)}")


@api_router.get("/scan/sessions", response_model=List[ScanStatus])
async def get_scan_sessions(
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Get list of scan sessions"""
    try:
        # This would need proper query implementation
        # For now, return empty list
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scan sessions: {str(e)}")


# Duplicate detection endpoints
@api_router.get("/duplicates", response_model=List[DuplicateGroup])
async def get_duplicates(
    session_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Get duplicate files"""
    try:
        duplicates = await duplicate_service.get_duplicate_groups(
            session_id=session_id,
            limit=limit,
            offset=offset,
            db=db
        )
        return duplicates
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get duplicates: {str(e)}")


@api_router.get("/duplicates/stats")
async def get_duplicate_stats(db: AsyncSession = Depends(get_db)):
    """Get duplicate statistics"""
    try:
        stats = await duplicate_service.get_duplicate_stats(db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get duplicate stats: {str(e)}")


# Cleanup endpoints
@api_router.post("/cleanup/execute", response_model=CleanupResponse)
async def execute_cleanup(
    request: CleanupRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Execute cleanup operations"""
    try:
        # Start background cleanup
        cleanup_id = str(uuid.uuid4())
        background_tasks.add_task(
            cleanup_service.execute_cleanup,
            cleanup_id,
            request,
            db
        )
        
        return CleanupResponse(
            cleanup_id=cleanup_id,
            status="started",
            message="Cleanup started successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start cleanup: {str(e)}")


@api_router.get("/cleanup/status/{cleanup_id}")
async def get_cleanup_status(cleanup_id: str):
    """Get cleanup operation status"""
    try:
        # This would track cleanup progress
        return {
            "cleanup_id": cleanup_id,
            "status": "completed",  # Placeholder
            "files_removed": 0,
            "space_freed": 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cleanup status: {str(e)}")


# File management endpoints
@api_router.get("/files", response_model=List[dict])
async def get_files(
    category: Optional[str] = None,
    file_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Get files with optional filtering"""
    try:
        # This would implement file filtering
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get files: {str(e)}")


@api_router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a specific file"""
    try:
        # This would implement file deletion
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
