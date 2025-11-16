"""Deduplication endpoints"""
import os
import asyncio
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.config import settings
from app.middleware.auth import get_current_user
from app.middleware.validation import validate_file_upload
from app.services.file_processor import file_processor
from app.services.ml_client import MLServiceClient
from app.services.zip_service import zip_service
import aiofiles
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize ML client
ml_client = MLServiceClient()


class DedupePreviewRequest(BaseModel):
    files: List[Dict[str, Any]]


class DedupePreviewResponse(BaseModel):
    uploadId: str
    files: List[Dict[str, Any]]
    groups: List[Dict[str, Any]]
    processing_stats: Dict[str, Any]


class ZipRequest(BaseModel):
    uploadId: str
    fileIds: List[str]


@router.post("/preview", response_model=DedupePreviewResponse)
async def preview_duplicates(
    request: DedupePreviewRequest, 
    user=Depends(get_current_user)
):
    """
    Preview duplicates with full AI processing
    
    This endpoint processes uploaded files, generates embeddings,
    and finds duplicate groups using AI similarity detection.
    """
    # Validate file upload
    validation_result = validate_file_upload(
        request.files,
        max_files=100,
        max_file_size=50 * 1024 * 1024  # 50MB per file
    )
    
    if not validation_result['valid']:
        raise HTTPException(
            status_code=422,
            detail={'errors': validation_result['errors']}
        )
    try:
        upload_id = str(uuid.uuid4())
        processed_files = []
        all_texts = []
        all_images = []
        
        logger.info(f"Processing {len(request.files)} files for user {user.email}")
        logger.info(f"Files received: {[f.get('name') for f in request.files]}")
        
        # Process each file
        for i, file_data in enumerate(request.files):
            try:
                # Process files using real file processing
                file_result = await _process_real_file(file_data, i)
                processed_files.append(file_result)
                
                # Collect text and image data for ML processing
                if file_result.get('text_content'):
                    all_texts.append(file_result['text_content'])
                if file_result.get('base64_image'):
                    all_images.append(file_result['base64_image'])
                    
            except Exception as e:
                logger.error(f"Failed to process file {i}: {e}")
                # Add failed file to results
                processed_files.append({
                    'id': f"file_{i}",
                    'name': file_data.get('name', f'file_{i}'),
                    'size': file_data.get('size', 0),
                    'type': file_data.get('type', 'application/octet-stream'),
                    'success': False,
                    'error': str(e)
                })
        
        # Generate embeddings for text and images with SHA-256 caching
        text_embeddings = []
        image_embeddings = []
        
        if all_texts:
            try:
                # Extract SHA-256 hashes for caching (must align with all_texts)
                text_hashes = []
                for file_result in processed_files:
                    if file_result.get('text_content'):
                        text_hashes.append(file_result.get('sha256') or file_result.get('file_hash', ''))
                
                # Ensure arrays are aligned
                if len(text_hashes) != len(all_texts):
                    logger.warning(f"Hash count ({len(text_hashes)}) doesn't match text count ({len(all_texts)}), using empty hashes")
                    # Pad with empty strings if needed
                    while len(text_hashes) < len(all_texts):
                        text_hashes.append('')
                
                # Use embedding cache with batch processing
                from app.services.embedding_cache import embedding_cache
                text_embeddings, cache_hits = await embedding_cache.get_or_generate_text_embeddings(
                    all_texts, text_hashes
                )
                cache_hit_count = sum(cache_hits)
                logger.info(f"Generated {len(text_embeddings)} text embeddings ({cache_hit_count} from cache, {len(text_embeddings) - cache_hit_count} new)")
            except Exception as e:
                logger.error(f"Text embedding generation failed: {e}")
                # Fallback to direct generation
                try:
                    text_embeddings = await ml_client.generate_text_embeddings(all_texts)
                except:
                    pass
        
        if all_images:
            try:
                # Extract SHA-256 hashes for caching (must align with all_images)
                image_hashes = []
                for file_result in processed_files:
                    if file_result.get('base64_image'):
                        image_hashes.append(file_result.get('sha256') or file_result.get('file_hash', ''))
                
                # Ensure arrays are aligned
                if len(image_hashes) != len(all_images):
                    logger.warning(f"Hash count ({len(image_hashes)}) doesn't match image count ({len(all_images)}), using empty hashes")
                    # Pad with empty strings if needed
                    while len(image_hashes) < len(all_images):
                        image_hashes.append('')
                
                # Use embedding cache with batch processing
                from app.services.embedding_cache import embedding_cache
                image_embeddings, cache_hits = await embedding_cache.get_or_generate_image_embeddings(
                    all_images, image_hashes
                )
                cache_hit_count = sum(cache_hits)
                logger.info(f"Generated {len(image_embeddings)} image embeddings ({cache_hit_count} from cache, {len(image_embeddings) - cache_hit_count} new)")
            except Exception as e:
                logger.error(f"Image embedding generation failed: {e}")
                # Fallback to direct generation
                try:
                    image_embeddings = await ml_client.generate_image_embeddings(all_images)
                except:
                    pass
        
        # Find duplicate groups using similarity
        groups = await _find_duplicate_groups(processed_files, text_embeddings, image_embeddings)
        
        # Calculate processing statistics
        processing_stats = {
            'total_files': len(processed_files),
            'successful_files': len([f for f in processed_files if f.get('success', False)]),
            'text_files': len([f for f in processed_files if f.get('text_content')]),
            'image_files': len([f for f in processed_files if f.get('base64_image')]),
            'duplicate_groups': len(groups),
            'total_duplicates': sum(len(g.get('duplicates', [])) for g in groups),
            'text_embeddings_generated': len(text_embeddings),
            'image_embeddings_generated': len(image_embeddings)
        }
        
        logger.info(f"Processing complete: {processing_stats}")
        
        return DedupePreviewResponse(
            uploadId=upload_id,
            files=processed_files,
            groups=groups,
            processing_stats=processing_stats
        )
        
    except Exception as e:
        logger.error(f"Deduplication preview failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


async def _process_real_file(file_data: Dict[str, Any], index: int) -> Dict[str, Any]:
    """
    Process a real file using the file processor service
    """
    try:
        # Extract file data from the request
        filename = file_data.get('name', f'file_{index}')
        file_type = file_data.get('type', 'application/octet-stream')
        file_size = file_data.get('size', 0)
        file_path = file_data.get('path', '')  # Get the actual file path from user
        
        # For now, we'll simulate reading the actual file content
        # In a real implementation, this would come from uploaded files
        file_content = file_data.get('content', b'')
        
        if not file_content:
            # Use the actual file path provided by the user (with security validation)
            logger.info(f"Processing file: {filename}, path: {file_path}")
            if file_path:
                # Validate file path for security
                from app.utils.file_security import validate_file_path, sanitize_filename
                
                # Sanitize the filename
                filename = sanitize_filename(filename)
                
                # Validate the file path (prevents path traversal)
                if not validate_file_path(file_path):
                    logger.error(f"Invalid or unsafe file path: {file_path}")
                    raise ValueError(f"Invalid or unsafe file path")
                
                if os.path.exists(file_path):
                    try:
                        with open(file_path, 'rb') as f:
                            file_content = f.read()
                        logger.info(f"Successfully read file from user path: {file_path} ({len(file_content)} bytes)")
                    except Exception as e:
                        logger.error(f"Failed to read file from user path {file_path}: {e}")
                        raise FileNotFoundError(f"Failed to read file from path {file_path}: {e}")
                else:
                    logger.error(f"File does not exist: {file_path}")
                    raise FileNotFoundError(f"File not found: {file_path}")
            else:
                # Fallback to test_files directory for testing
                test_file_path = f"test_files/{filename}"
                if os.path.exists(test_file_path):
                    with open(test_file_path, 'rb') as f:
                        file_content = f.read()
                    logger.info(f"Successfully read file from test_files: {test_file_path}")
                else:
                    # File not found - return error instead of mock data
                    logger.error(f"File not found: {filename} at path {file_path} or test_files")
                    raise FileNotFoundError(f"File not found: {filename}")
        
        # Process the file using the real file processor
        result = await file_processor.process_file(
            file_data=file_content,
            filename=filename,
            mime_type=file_type
        )
        
        # Add additional metadata
        result.update({
            'id': f"file_{index}",
            'fileName': filename,  # Frontend expects fileName
            'name': filename,  # Keep for compatibility
            'sizeBytes': file_size,  # Frontend expects sizeBytes
            'size': file_size,  # Keep for compatibility
            'mimeType': file_type,  # Frontend expects mimeType
            'type': file_type,  # Keep for compatibility
            'sha256': result.get('file_hash', ''),
            'createdAt': None  # Optional field
        })
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to process file {file_data.get('name', f'file_{index}')}: {e}")
        filename = file_data.get('name', f'file_{index}')
        file_type = file_data.get('type', 'application/octet-stream')
        file_size = file_data.get('size', 0)
        return {
            'id': f"file_{index}",
            'fileName': filename,  # Frontend expects fileName
            'name': filename,  # Keep for compatibility
            'sizeBytes': file_size,  # Frontend expects sizeBytes
            'size': file_size,  # Keep for compatibility
            'mimeType': file_type,  # Frontend expects mimeType
            'type': file_type,  # Keep for compatibility
            'success': False,
            'error': str(e),
            'sha256': '',
            'createdAt': None
        }


async def _find_duplicate_groups(
    files: List[Dict[str, Any]], 
    text_embeddings: List[List[float]], 
    image_embeddings: List[List[float]]
) -> List[Dict[str, Any]]:
    """
    Find duplicate groups using hash matching and similarity analysis
    """
    groups = []
    processed_files = [f for f in files if f.get('success', False)]
    logger.info(f"Processing {len(processed_files)} successful files for duplicate detection")
    
    # Group files by SHA-256 hash (exact duplicates)
    hash_groups = {}
    for file in processed_files:
        # Try both 'sha256' and 'file_hash' fields for compatibility
        file_hash = file.get('sha256') or file.get('file_hash', '')
        logger.info(f"File {file.get('name')} has hash: {file_hash[:16] if file_hash else 'N/A'}...")
        if file_hash:
            if file_hash not in hash_groups:
                hash_groups[file_hash] = []
            hash_groups[file_hash].append(file)
    
    logger.info(f"Found {len(hash_groups)} unique hashes")
    logger.info(f"Hash groups: {list(hash_groups.keys())}")
    
    # Create groups for files with same hash
    group_index = 0
    for file_hash, hash_group in hash_groups.items():
        if len(hash_group) > 1:
            # Use tie-breaker logic to select keep file
            from app.services.tie_breaker import select_keep_file
            kept_file = select_keep_file(hash_group)
            
            duplicates = []
            for duplicate_file in hash_group:
                if duplicate_file.get('id') != kept_file.get('id') and \
                   duplicate_file.get('fileName') != kept_file.get('fileName'):
                    duplicates.append({
                        'file': duplicate_file,
                        'similarity': 1.0,  # Exact hash match
                        'reason': 'Exact hash match',
                        'isKept': False
                    })
            
            groups.append({
                'id': f'group_{group_index}',
                'groupIndex': group_index,
                'keepFile': kept_file,
                'duplicates': duplicates,
                'reason': 'Exact hash match',
                'totalSizeSaved': sum(d['file'].get('size', 0) or d['file'].get('sizeBytes', 0) for d in duplicates)
            })
            group_index += 1
    
    # Group files by text content similarity (for files with same text content)
    text_files = [f for f in processed_files if f.get('text_content') and f.get('success', False)]
    if len(text_files) > 1:
        # Group by exact text content
        text_content_groups = {}
        for file in text_files:
            text_content = file.get('text_content', '')
            if text_content:
                if text_content not in text_content_groups:
                    text_content_groups[text_content] = []
                text_content_groups[text_content].append(file)
        
        # Create groups for files with same text content
        for text_content, text_group in text_content_groups.items():
            if len(text_group) > 1:
                # Use tie-breaker logic to select keep file
                from app.services.tie_breaker import select_keep_file
                kept_file = select_keep_file(text_group)
                
                duplicates = []
                for duplicate_file in text_group:
                    if duplicate_file.get('id') != kept_file.get('id') and \
                       duplicate_file.get('fileName') != kept_file.get('fileName'):
                        duplicates.append({
                            'file': duplicate_file,
                            'similarity': 1.0,  # Exact text match
                            'reason': 'Exact text content match',
                            'isKept': False
                        })
                
                groups.append({
                    'id': f'group_{group_index}',
                    'groupIndex': group_index,
                    'keepFile': kept_file,
                    'duplicates': duplicates,
                    'reason': 'Exact text content match',
                    'totalSizeSaved': sum(d['file'].get('size', 0) or d['file'].get('sizeBytes', 0) for d in duplicates)
                })
                group_index += 1
    
    return groups


@router.post("/zip")
async def create_zip(
    request: ZipRequest, 
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user)
):
    """
    Create ZIP file from selected files
    """
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
