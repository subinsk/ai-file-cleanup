"""
Request validation middleware
"""
import logging
from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import json

logger = logging.getLogger(__name__)


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Middleware to validate request size and content"""
    
    def __init__(
        self, 
        app,
        max_request_size: int = 100 * 1024 * 1024,  # 100MB default
        max_files: int = 100,
        allowed_content_types: Optional[List[str]] = None
    ):
        super().__init__(app)
        self.max_request_size = max_request_size
        self.max_files = max_files
        self.allowed_content_types = allowed_content_types or [
            'application/json',
            'multipart/form-data',
            'application/x-www-form-urlencoded'
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Check content length
        content_length = request.headers.get('content-length')
        if content_length:
            try:
                size = int(content_length)
                if size > self.max_request_size:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Request too large. Maximum size: {self.max_request_size / (1024 * 1024):.1f}MB"
                    )
            except ValueError:
                pass  # Invalid content-length, let it through
        
        # Check content type for certain endpoints
        content_type = request.headers.get('content-type', '')
        if request.url.path.startswith('/api/') and content_type:
            # For JSON endpoints, validate content type
            if 'application/json' in request.url.path or '/dedupe/' in request.url.path:
                if not any(ct in content_type for ct in ['application/json', 'multipart/form-data']):
                    if '/upload' not in request.url.path:  # Upload endpoints allow multipart
                        logger.warning(f"Invalid content type {content_type} for {request.url.path}")
        
        # Validate file count for upload endpoints
        if '/upload' in request.url.path or '/dedupe/preview' in request.url.path:
            # This will be validated in the endpoint handler
            pass
        
        response = await call_next(request)
        return response


def validate_file_upload(files: List[Any], max_files: int = 100, max_file_size: int = 50 * 1024 * 1024) -> Dict[str, Any]:
    """
    Validate file upload request
    
    Args:
        files: List of files to validate
        max_files: Maximum number of files allowed
        max_file_size: Maximum size per file in bytes
        
    Returns:
        Validation result with errors if any
    """
    errors = []
    
    if len(files) > max_files:
        errors.append(f"Too many files. Maximum {max_files} files allowed.")
    
    total_size = 0
    for i, file in enumerate(files):
        file_size = getattr(file, 'size', 0) or file.get('size', 0) if isinstance(file, dict) else 0
        
        if file_size > max_file_size:
            filename = getattr(file, 'filename', f'file_{i}') or file.get('name', f'file_{i}')
            errors.append(f"File {filename} exceeds maximum size of {max_file_size / (1024 * 1024):.1f}MB")
        
        total_size += file_size
    
    if total_size > 500 * 1024 * 1024:  # 500MB total limit
        errors.append(f"Total upload size exceeds 500MB limit")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }

