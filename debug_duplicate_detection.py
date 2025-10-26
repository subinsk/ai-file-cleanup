#!/usr/bin/env python3
"""
Debug script to test duplicate detection directly
"""
import asyncio
import sys
import os
from pathlib import Path

# Add the API directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'services', 'api'))

async def test_duplicate_detection():
    """Test duplicate detection with test_files"""
    print("🔍 Testing Duplicate Detection...")
    
    # Import the functions we need
    from app.api.dedupe import _process_real_file, _find_duplicate_groups
    
    # Get test files
    test_files_dir = Path("test_files")
    test_files = []
    
    for file_path in test_files_dir.iterdir():
        if file_path.is_file() and file_path.suffix in ['.txt', '.json', '.ini']:
            test_files.append({
                'name': file_path.name,
                'type': 'text/plain',
                'size': file_path.stat().st_size,
                'path': str(file_path.absolute())
            })
    
    print(f"Found {len(test_files)} test files")
    
    # Process files
    processed_files = []
    for i, file_data in enumerate(test_files):
        print(f"Processing {file_data['name']}...")
        result = await _process_real_file(file_data, i)
        processed_files.append(result)
        print(f"  Success: {result.get('success', False)}")
        if result.get('success'):
            print(f"  Hash: {result.get('sha256', 'N/A')[:16]}...")
    
    # Find duplicate groups
    print("\nFinding duplicate groups...")
    groups = await _find_duplicate_groups(processed_files, [], [])
    
    print(f"\nFound {len(groups)} duplicate groups:")
    for i, group in enumerate(groups):
        print(f"Group {i + 1}:")
        print(f"  Kept file: {group['keptFile']['name']}")
        print(f"  Reason: {group['reason']}")
        print(f"  Duplicates: {len(group['duplicates'])}")
        for dup in group['duplicates']:
            print(f"    - {dup['file']['name']}")
    
    return groups

if __name__ == "__main__":
    asyncio.run(test_duplicate_detection())
