"""
File security utilities for path validation and sanitization
"""
import os
import re
import hashlib
from pathlib import Path
from typing import Optional
import logging

# Try to import python-magic, fall back if not available
try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    MAGIC_AVAILABLE = False
    logging.warning("python-magic not available, MIME type validation will be limited")

logger = logging.getLogger(__name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    'image': {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'},
    'document': {'.pdf'},
    'text': {'.txt', '.csv', '.log', '.md'}
}

# MIME type to extension mapping for validation
MIME_TYPE_MAP = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'text/csv': '.csv',
}


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and invalid characters
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename safe for file system
    """
    # Remove any directory components
    filename = os.path.basename(filename)
    
    # Remove or replace dangerous characters
    # Keep only alphanumeric, underscore, hyphen, dot
    filename = re.sub(r'[^\w\s\-\.]', '', filename)
    
    # Replace spaces with underscores
    filename = filename.replace(' ', '_')
    
    # Remove multiple dots (except for file extension)
    parts = filename.rsplit('.', 1)
    if len(parts) == 2:
        name, ext = parts
        name = name.replace('.', '_')
        filename = f"{name}.{ext}"
    
    # Limit filename length (reserve space for hash suffix)
    max_length = 200
    if len(filename) > max_length:
        name, ext = os.path.splitext(filename)
        name = name[:max_length - len(ext) - 10]
        filename = f"{name}{ext}"
    
    # Ensure filename is not empty
    if not filename or filename == '.':
        filename = 'unnamed_file'
    
    return filename


def validate_file_path(file_path: str, base_directory: Optional[str] = None) -> bool:
    """
    Validate file path to prevent path traversal attacks
    
    Args:
        file_path: Path to validate
        base_directory: Optional base directory that path must be within
        
    Returns:
        True if path is valid and safe, False otherwise
    """
    try:
        # Resolve to absolute path
        abs_path = Path(file_path).resolve()
        
        # Check if file exists
        if not abs_path.exists():
            logger.warning(f"File does not exist: {abs_path}")
            return False
        
        # Check if it's actually a file (not directory or symlink)
        if not abs_path.is_file():
            logger.warning(f"Path is not a regular file: {abs_path}")
            return False
        
        # If base directory specified, ensure path is within it
        if base_directory:
            base_abs = Path(base_directory).resolve()
            try:
                abs_path.relative_to(base_abs)
            except ValueError:
                logger.warning(f"Path {abs_path} is outside base directory {base_abs}")
                return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error validating file path {file_path}: {e}")
        return False


def validate_file_extension(filename: str) -> bool:
    """
    Validate file extension against allowed list
    
    Args:
        filename: Filename to check
        
    Returns:
        True if extension is allowed
    """
    ext = os.path.splitext(filename)[1].lower()
    
    for category, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return True
    
    return False


def validate_mime_type(file_data: bytes, declared_mime: str) -> tuple[bool, str]:
    """
    Validate that file content matches declared MIME type
    
    Args:
        file_data: File content bytes
        declared_mime: Declared MIME type
        
    Returns:
        Tuple of (is_valid, actual_mime_type)
    """
    try:
        # Use python-magic to detect actual MIME type if available
        if not MAGIC_AVAILABLE:
            # Fall back to trusting declared MIME type with basic validation
            logger.debug("python-magic not available, using declared MIME type")
            return True, declared_mime
        
        actual_mime = magic.from_buffer(file_data, mime=True)
        
        # Normalize MIME types for comparison
        declared_mime_base = declared_mime.split(';')[0].strip().lower()
        actual_mime_base = actual_mime.split(';')[0].strip().lower()
        
        # Allow some flexibility for related MIME types
        is_valid = (
            declared_mime_base == actual_mime_base or
            # JPEG variations
            (declared_mime_base in ['image/jpeg', 'image/jpg'] and actual_mime_base in ['image/jpeg', 'image/jpg']) or
            # Text variations
            (declared_mime_base.startswith('text/') and actual_mime_base.startswith('text/'))
        )
        
        if not is_valid:
            logger.warning(f"MIME type mismatch: declared={declared_mime_base}, actual={actual_mime_base}")
        
        return is_valid, actual_mime
        
    except Exception as e:
        logger.error(f"Error validating MIME type: {e}")
        # If magic fails, fall back to trusting declared type (with other validations)
        return True, declared_mime


def generate_safe_file_id(file_data: bytes, filename: str) -> str:
    """
    Generate safe, unique file identifier
    
    Args:
        file_data: File content
        filename: Original filename
        
    Returns:
        Safe file identifier
    """
    # Use SHA-256 hash of content + filename
    hasher = hashlib.sha256()
    hasher.update(file_data)
    hasher.update(filename.encode('utf-8'))
    
    return f"file_{hasher.hexdigest()[:16]}"


def check_file_size(file_data: bytes, max_size_mb: int = 50) -> bool:
    """
    Check if file size is within limits
    
    Args:
        file_data: File content
        max_size_mb: Maximum size in megabytes
        
    Returns:
        True if size is acceptable
    """
    size_bytes = len(file_data)
    max_bytes = max_size_mb * 1024 * 1024
    
    if size_bytes > max_bytes:
        logger.warning(f"File size {size_bytes} exceeds limit {max_bytes}")
        return False
    
    return True


def sanitize_user_input(text: str, max_length: int = 1000) -> str:
    """
    Sanitize user text input to prevent XSS and injection attacks
    
    Args:
        text: User input text
        max_length: Maximum allowed length
        
    Returns:
        Sanitized text
    """
    if not text:
        return ""
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove potential script content
    text = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', text, flags=re.IGNORECASE)
    
    # Remove potential SQL injection patterns (basic protection)
    dangerous_patterns = [
        r'(\bDROP\s+TABLE\b)',
        r'(\bDELETE\s+FROM\b)',
        r'(\bUPDATE\s+\w+\s+SET\b)',
        r'(;\s*--)',
        r'(\bEXEC\b)',
        r'(\bUNION\s+SELECT\b)',
    ]
    
    for pattern in dangerous_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    # Limit length
    if len(text) > max_length:
        text = text[:max_length]
    
    # Remove null bytes
    text = text.replace('\x00', '')
    
    return text.strip()

