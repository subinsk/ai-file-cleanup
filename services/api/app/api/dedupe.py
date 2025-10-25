"""Deduplication endpoints"""
import os
import asyncio
from typing import List
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.config import settings
from app.middleware.auth import get_current_user
from app.services.zip_service import zip_service
import aiofiles
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class ZipRequest(BaseModel):
    uploadId: str
    fileIds: List[str]


class DedupePreviewRequest(BaseModel):
    files: List[dict]


class DedupePreviewResponse(BaseModel):
    uploadId: str
    files: List[dict]
    groups: List[dict]


@router.post("/preview", response_model=DedupePreviewResponse)
async def preview_duplicates(request: DedupePreviewRequest, user=Depends(get_current_user)):
    """Preview duplicates - placeholder for MVP"""
    # For MVP, return mock data
    # In production, this would process files and return actual deduplication results
    import uuid
    
    upload_id = str(uuid.uuid4())
    
    # Mock file data
    mock_files = []
    for i, file_data in enumerate(request.files):
        mock_files.append({
            "id": f"file_{i}",
            "name": file_data.get("name", f"file_{i}"),
            "size": file_data.get("size", 1024),
            "type": file_data.get("type", "application/octet-stream")
        })
    
    return DedupePreviewResponse(
        uploadId=upload_id,
        files=mock_files,
        groups=[]  # No duplicates found in MVP
    )


@router.post("/zip")
async def create_zip(
    request: ZipRequest, 
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user)
):
    """Create ZIP file with selected files"""
    try:
        # Create ZIP file using the service
        zip_path = await zip_service.create_zip_from_files(
            upload_id=request.uploadId,
            file_ids=request.fileIds
        )
        
        # Create streaming response
        async def file_generator():
            async with aiofiles.open(zip_path, 'rb') as f:
                while chunk := await f.read(8192):
                    yield chunk
        
        # Get file size for Content-Length header
        file_size = os.path.getsize(zip_path)
        
        # Schedule cleanup after response is sent
        background_tasks.add_task(zip_service.cleanup_zip, zip_path)
        
        return StreamingResponse(
            file_generator(),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=cleaned-files-{request.uploadId}.zip",
                "Content-Length": str(file_size),
                "Cache-Control": "no-cache"
            }
        )
        
    except Exception as e:
        logger.error(f"Error creating ZIP file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create ZIP file")
