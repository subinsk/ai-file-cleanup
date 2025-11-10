"""Desktop app endpoints"""
import logging
import os
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.database import get_db
from app.api.dedupe import _find_duplicate_groups
from app.services.file_processor import file_processor
from app.services.ml_client import MLServiceClient

logger = logging.getLogger(__name__)
router = APIRouter()


class ValidateLicenseRequest(BaseModel):
    licenseKey: str


class ValidateLicenseResponse(BaseModel):
    valid: bool
    message: str


class DedupePreviewRequest(BaseModel):
    files: List[Dict[str, Any]]


class DedupePreviewResponse(BaseModel):
    uploadId: str
    files: List[Dict[str, Any]]
    groups: List[Dict[str, Any]]
    processing_stats: Dict[str, Any]


@router.post("/validate-license", response_model=ValidateLicenseResponse)
async def validate_license(request: ValidateLicenseRequest):
    """Validate a license key for desktop app"""
    db = get_db()
    
    try:
        # Find the license key
        license_key = await db.licensekey.find_first(
            where={"key": request.licenseKey}
        )
        
        if not license_key:
            return ValidateLicenseResponse(
                valid=False,
                message="License key not found"
            )
        
        if license_key.revoked:
            return ValidateLicenseResponse(
                valid=False,
                message="License key has been revoked"
            )
        
        logger.info(f"License key validated: {request.licenseKey}")
        
        return ValidateLicenseResponse(
            valid=True,
            message="License key is valid"
        )
        
    except Exception as e:
        logger.error(f"License validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="License validation failed")


@router.post("/dedupe/preview", response_model=DedupePreviewResponse)
async def dedupe_preview(request: DedupePreviewRequest):
    """
    Preview duplicates for desktop app
    
    This endpoint processes files and finds duplicate groups using AI similarity detection.
    """
    try:
        import uuid
        upload_id = str(uuid.uuid4())
        processed_files = []
        all_texts = []
        all_images = []
        
        # Initialize ML client
        ml_client = MLServiceClient()
        
        logger.info(f"Processing {len(request.files)} files for desktop app")
        logger.info(f"Files received: {[f.get('name') for f in request.files]}")
        
        # Process each file
        for i, file_data in enumerate(request.files):
            try:
                filename = file_data.get('name', f'file_{i}')
                file_path = file_data.get('path', '')
                file_size = file_data.get('size', 0)
                mime_type = file_data.get('type', 'application/octet-stream')
                
                # Read file content from path
                if not file_path or not os.path.exists(file_path):
                    raise FileNotFoundError(f"File not found: {file_path}")
                
                with open(file_path, 'rb') as f:
                    file_content = f.read()
                
                # Process file using file processor
                file_result = await file_processor.process_file(
                    file_data=file_content,
                    filename=filename,
                    mime_type=mime_type
                )
                
                # Add file metadata
                file_result['id'] = f"file_{i}"
                file_result['fileName'] = filename
                file_result['sizeBytes'] = file_size
                file_result['mimeType'] = mime_type
                file_result['path'] = file_path
                
                processed_files.append(file_result)
                
                # Collect text and image data for ML processing
                if file_result.get('text_content'):
                    all_texts.append(file_result['text_content'])
                if file_result.get('base64_image'):
                    all_images.append(file_result['base64_image'])
                    
            except Exception as e:
                logger.error(f"Failed to process file {i}: {e}", exc_info=True)
                # Add failed file to results
                processed_files.append({
                    'id': f"file_{i}",
                    'fileName': file_data.get('name', f'file_{i}'),
                    'sizeBytes': file_data.get('size', 0),
                    'mimeType': file_data.get('type', 'application/octet-stream'),
                    'success': False,
                    'error': str(e)
                })
        
        # Generate embeddings for text and images with SHA-256 caching
        text_embeddings = []
        image_embeddings = []
        
        if all_texts:
            try:
                from app.services.embedding_cache import embedding_cache
                # Extract SHA-256 hashes for caching
                text_hashes = []
                for file_result in processed_files:
                    if file_result.get('text_content'):
                        text_hashes.append(file_result.get('sha256') or file_result.get('file_hash', ''))
                
                # Ensure arrays are aligned
                if len(text_hashes) != len(all_texts):
                    while len(text_hashes) < len(all_texts):
                        text_hashes.append('')
                
                text_embeddings, _ = await embedding_cache.get_or_generate_text_embeddings(
                    all_texts, text_hashes
                )
            except Exception as e:
                logger.error(f"Text embedding generation failed: {e}")
                try:
                    text_embeddings = await ml_client.generate_text_embeddings(all_texts)
                except:
                    pass
        
        if all_images:
            try:
                from app.services.embedding_cache import embedding_cache
                # Extract SHA-256 hashes for caching
                image_hashes = []
                for file_result in processed_files:
                    if file_result.get('base64_image'):
                        image_hashes.append(file_result.get('sha256') or file_result.get('file_hash', ''))
                
                # Ensure arrays are aligned
                if len(image_hashes) != len(all_images):
                    while len(image_hashes) < len(all_images):
                        image_hashes.append('')
                
                image_embeddings, _ = await embedding_cache.get_or_generate_image_embeddings(
                    all_images, image_hashes
                )
            except Exception as e:
                logger.error(f"Image embedding generation failed: {e}")
                try:
                    image_embeddings = await ml_client.generate_image_embeddings(all_images)
                except:
                    pass
        
        # Find duplicate groups using similarity
        groups = await _find_duplicate_groups(processed_files, text_embeddings, image_embeddings)
        logger.info(f"Found {len(groups)} duplicate groups")
        
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
        
        logger.info(f"Desktop dedupe processing complete: {processing_stats}")
        
        return DedupePreviewResponse(
            uploadId=upload_id,
            files=processed_files,
            groups=groups,
            processing_stats=processing_stats
        )
        
    except Exception as e:
        logger.error(f"Desktop dedupe preview failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
