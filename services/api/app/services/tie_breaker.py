"""
Tie-breaker logic for selecting which file to keep from duplicates
Matches the TypeScript implementation in packages/core/src/dedupe/tie-breaker.ts
"""
from typing import List, Dict, Any, Optional
from datetime import datetime


def select_keep_file(files: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Select which file to keep from a group of duplicates
    
    Priority (tie-breaker logic):
    1. SHA-256 hash (prefer files with hash if others don't have it)
    2. Higher resolution (for images) - width * height
    3. Newer modified time (if available)
    4. Larger file size (higher quality)
    5. First in list (stable sort by filename)
    
    Args:
        files: List of file dictionaries
        
    Returns:
        File dictionary to keep
    """
    if not files:
        raise ValueError('Cannot select keep file from empty list')
    
    if len(files) == 1:
        return files[0]
    
    # Sort by priority rules
    def sort_key(file: Dict[str, Any]) -> tuple:
        # 1. Prefer files with SHA-256 hash (more reliable identification)
        has_hash = bool(file.get('sha256') or file.get('file_hash'))
        hash_priority = 0 if has_hash else 1
        
        # 2. Prefer higher resolution (for images)
        resolution = 0
        metadata = file.get('metadata', {})
        if 'original_size' in metadata:
            size = metadata['original_size']
            if isinstance(size, (list, tuple)) and len(size) == 2:
                resolution = size[0] * size[1]
            elif isinstance(size, dict):
                resolution = size.get('width', 0) * size.get('height', 0)
        elif 'resolution' in file:
            res = file['resolution']
            if isinstance(res, dict):
                resolution = res.get('width', 0) * res.get('height', 0)
        
        # 3. Prefer newer modified time (if available)
        modified_time = 0
        if 'modifiedTime' in file:
            mt = file['modifiedTime']
            if isinstance(mt, str):
                try:
                    modified_time = datetime.fromisoformat(mt.replace('Z', '+00:00')).timestamp()
                except:
                    modified_time = 0
            elif isinstance(mt, (int, float)):
                modified_time = float(mt)
        elif 'mtime' in file:
            mt = file['mtime']
            if isinstance(mt, str):
                try:
                    modified_time = datetime.fromisoformat(mt.replace('Z', '+00:00')).timestamp()
                except:
                    modified_time = 0
            elif isinstance(mt, (int, float)):
                modified_time = float(mt)
        
        # 4. Prefer larger file size
        size_bytes = file.get('sizeBytes') or file.get('size', 0)
        
        # 5. Filename for stable sort
        filename = file.get('fileName') or file.get('name', '')
        
        # Return tuple for sorting (lower is better, so we negate some values)
        return (
            hash_priority,  # 0 = has hash (better), 1 = no hash
            -resolution,  # Negate so higher resolution comes first
            -modified_time,  # Negate so newer (larger timestamp) comes first
            -size_bytes,  # Negate so larger size comes first
            filename  # Alphabetical for stable sort
        )
    
    sorted_files = sorted(files, key=sort_key)
    return sorted_files[0]

