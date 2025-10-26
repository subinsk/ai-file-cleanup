"""Desktop app endpoints"""
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.database import get_db
from app.api.dedupe import _process_real_file, _find_duplicate_groups

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
        
        logger.info(f"Processing {len(request.files)} files for desktop app")
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
        
        # Generate embeddings for text and images (mock for now)
        text_embeddings = []
        image_embeddings = []
        
        # Find duplicate groups using similarity
        groups = await _find_duplicate_groups(processed_files, text_embeddings, image_embeddings)
        logger.info(f"Found {len(groups)} duplicate groups")
        for i, group in enumerate(groups):
            logger.info(f"Group {i}: {group.get('keepFile', {}).get('name')} with {len(group.get('duplicates', []))} duplicates")
        
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
