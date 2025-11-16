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
        # Import security utilities
        from app.utils.file_security import (
            sanitize_filename, validate_file_extension,
            validate_mime_type, check_file_size
        )
        
        # Validate file count
        if len(files) > 100:
            raise HTTPException(
                status_code=400,
                detail="Too many files. Maximum 100 files allowed per upload."
            )
        
        # Check user quota
        from app.services.quota_manager import quota_manager
        
        # Check upload count quota
        if not await quota_manager.check_user_upload_count(user.id):
            raise HTTPException(
                status_code=429,
                detail="Upload limit reached. Please delete old uploads to free up space."
            )
        
        # Calculate total size for quota check
        total_size = 0
        for file in files:
            # Read file to get size (we'll need to re-read later, but this is necessary)
            content = await file.read()
            total_size += len(content)
            # Reset file pointer
            await file.seek(0)
        
        # Check storage quota
        if not await quota_manager.check_user_storage_quota(user.id, total_size):
            raise HTTPException(
                status_code=429,
                detail="Storage quota exceeded. Please delete old files to free up space."
            )
        
        results = []
        successful_count = 0
        failed_count = 0
        
        logger.info(f"Processing {len(files)} files for user {user.email}")
        
        for i, file in enumerate(files):
            try:
                # Sanitize filename
                original_filename = file.filename or f"file_{i}"
                safe_filename = sanitize_filename(original_filename)
                
                # Validate file extension
                if not validate_file_extension(safe_filename):
                    logger.warning(f"Invalid file extension: {safe_filename}")
                    failed_count += 1
                    results.append(FileProcessingResult(
                        success=False,
                        file_id=f"file_{i}",
                        filename=safe_filename,
                        mime_type=file.content_type or "application/octet-stream",
                        file_hash="",
                        file_type="error",
                        error="File type not allowed. Supported: images, PDF, text files."
                    ))
                    continue
                
                # Read file data
                file_data = await file.read()
                
                # Check file size
                if not check_file_size(file_data, max_size_mb=50):
                    logger.warning(f"File too large: {safe_filename}")
                    failed_count += 1
                    results.append(FileProcessingResult(
                        success=False,
                        file_id=f"file_{i}",
                        filename=safe_filename,
                        mime_type=file.content_type or "application/octet-stream",
                        file_hash="",
                        file_type="error",
                        error="File too large. Maximum size: 50MB"
                    ))
                    continue
                
                # Validate MIME type matches content
                declared_mime = file.content_type or "application/octet-stream"
                is_valid_mime, actual_mime = validate_mime_type(file_data, declared_mime)
                
                if not is_valid_mime:
                    logger.warning(f"MIME type mismatch for {safe_filename}: declared={declared_mime}, actual={actual_mime}")
                    # Use actual MIME type for processing
                    mime_type_to_use = actual_mime
                else:
                    mime_type_to_use = declared_mime
                
                # Process file based on type
                result = await file_processor.process_file(
                    file_data=file_data,
                    filename=safe_filename,
                    mime_type=mime_type_to_use
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
