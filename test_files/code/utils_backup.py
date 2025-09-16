"""
Utility functions for AI File Management System
"""

import hashlib
import os
from pathlib import Path

def calculate_file_hash(file_path):
    """Calculate MD5 hash of a file"""
    hash_md5 = hashlib.md5()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    except Exception as e:
        print(f"Error calculating hash for {file_path}: {e}")
        return None

def get_file_size(file_path):
    """Get file size in bytes"""
    try:
        return os.path.getsize(file_path)
    except Exception as e:
        print(f"Error getting size for {file_path}: {e}")
        return 0

def is_duplicate(file1, file2):
    """Check if two files are duplicates"""
    if get_file_size(file1) != get_file_size(file2):
        return False
    
    hash1 = calculate_file_hash(file1)
    hash2 = calculate_file_hash(file2)
    
    return hash1 == hash2 and hash1 is not None
