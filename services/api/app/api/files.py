"""
File upload and processing endpoints
"""
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from app.middleware.auth import get_current_user
from app.services.file_processor import file_processor

router = APIRouter()
logger = logging.getLogger(__name__)


class FileProcessingResult(BaseModel):
    success: bool
    file_id: str
    filename: str
    mime_type: str
    file_hash: str
    file_type: str
    text_content: str = ""
    text_excerpt: str = ""
    base64_image: str = ""
    perceptual_hash: str = ""
    image_features: dict = {}
    metadata: dict = {}
    processing_info: dict = {}
    error: str = ""


class FileUploadResponse(BaseModel):
    results: List[FileProcessingResult]
    total_files: int
    successful_files: int
    failed_files: int
    groups: List[Dict[str, Any]] = []  # Add groups for deduplication


@router.post("/upload", response_model=FileUploadResponse)
async def upload_and_process_files(
    files: List[UploadFile] = File(...),
    user=Depends(get_current_user)
):
    """
    Upload and process multiple files
    
    This endpoint accepts file uploads and processes them using
    PDF text extraction, image normalization, and other processing.
    """
    try:
        results = []
        successful_count = 0
        failed_count = 0
        
        logger.info(f"Processing {len(files)} files for user {user.email}")
        
        for i, file in enumerate(files):
            try:
                # Read file data
                file_data = await file.read()
                
                # Process file based on type
                result = await file_processor.process_file(
                    file_data=file_data,
                    filename=file.filename or f"file_{i}",
                    mime_type=file.content_type or "application/octet-stream"
                )
                
                # Convert to response format
                processing_result = FileProcessingResult(
                    success=result['success'],
                    file_id=result.get('file_hash', f"file_{i}"),
                    filename=result['filename'],
                    mime_type=result['mime_type'],
                    file_hash=result['file_hash'],
                    file_type=result.get('file_type', 'unsupported'),
                    text_content=result.get('text_content', ''),
                    text_excerpt=result.get('text_excerpt', ''),
                    base64_image=result.get('base64_image', ''),
                    perceptual_hash=result.get('perceptual_hash', ''),
                    image_features=result.get('image_features', {}),
                    metadata=result.get('metadata', {}),
                    processing_info=result.get('processing_info', {}),
                    error=result.get('error', '')
                )
                
                results.append(processing_result)
                
                if result['success']:
                    successful_count += 1
                    logger.info(f"Successfully processed file: {file.filename}")
                else:
                    failed_count += 1
                    logger.error(f"Failed to process file: {file.filename} - {result.get('error', 'Unknown error')}")
                    
            except Exception as e:
                logger.error(f"Error processing file {file.filename}: {e}", exc_info=True)
                failed_count += 1
                
                # Add failed result
                results.append(FileProcessingResult(
                    success=False,
                    file_id=f"file_{i}",
                    filename=file.filename or f"file_{i}",
                    mime_type=file.content_type or "application/octet-stream",
                    file_hash="",
                    file_type="error",
                    error=str(e)
                ))
        
        logger.info(f"File processing complete: {successful_count} successful, {failed_count} failed")
        
        # Convert results to the format expected by deduplication
        processed_files = []
        for result in results:
            processed_files.append({
                'id': result.file_id,
                'name': result.filename,
                'size': result.metadata.get('size', 0) if result.metadata else 0,
                'type': result.mime_type,
                'success': result.success,
                'text_content': result.text_content,
                'base64_image': result.base64_image,
                'perceptual_hash': result.perceptual_hash,
                'file_hash': result.file_hash,
                'sha256': result.file_hash,  # Add both for compatibility
                'metadata': result.metadata,
                'error': result.error
            })
        
        # Find duplicate groups using the processed files
        from app.api.dedupe import _find_duplicate_groups
        groups = await _find_duplicate_groups(processed_files, [], [])
        
        logger.info(f"Found {len(groups)} duplicate groups")
        
        return FileUploadResponse(
            results=results,
            total_files=len(files),
            successful_files=successful_count,
            failed_files=failed_count,
            groups=groups
        )
        
    except Exception as e:
        logger.error(f"File upload processing failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")


@router.post("/process-single")
async def process_single_file(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    """
    Process a single file
    
    This endpoint processes one file and returns detailed results.
    """
    try:
        # Read file data
        file_data = await file.read()
        
        # Process file
        result = await file_processor.process_file(
            file_data=file_data,
            filename=file.filename or "unknown",
            mime_type=file.content_type or "application/octet-stream"
        )
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result.get('error', 'Processing failed'))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Single file processing failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")


@router.get("/supported-types")
async def get_supported_file_types():
    """
    Get list of supported file types
    """
    return {
        "supported_types": {
            "images": [
                "image/jpeg", "image/jpg", "image/png", "image/gif",
                "image/webp", "image/bmp", "image/tiff"
            ],
            "documents": [
                "application/pdf"
            ],
            "text": [
                "text/plain", "text/csv", "text/html", "text/xml"
            ]
        },
        "processing_capabilities": {
            "pdf_text_extraction": True,
            "image_normalization": True,
            "perceptual_hashing": True,
            "text_embedding": True,
            "image_embedding": True
        }
    }
