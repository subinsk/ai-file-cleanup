#!/usr/bin/env python3
"""
Test script to verify duplicate detection functionality
"""
import os
import sys
import asyncio
import json
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.file_processor import file_processor
from app.api.dedupe import _find_duplicate_groups, _process_real_file


async def test_duplicate_detection():
    """Test duplicate detection with test_files"""
    print("Testing duplicate detection with test_files...")
    
    # Get list of test files
    test_files_dir = Path("../../test_files")
    test_files = []
    
    for file_path in test_files_dir.iterdir():
        if file_path.is_file() and file_path.name != "README.md":
            test_files.append({
                'name': file_path.name,
                'type': 'text/plain' if file_path.suffix == '.txt' else 'application/octet-stream',
                'size': file_path.stat().st_size,
                'content': file_path.read_bytes()
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
            print(f"  Text length: {len(result.get('text_content', ''))}")
    
    # Find duplicate groups
    print("\nFinding duplicate groups...")
    groups = await _find_duplicate_groups(processed_files, [], [])
    
    print(f"\nFound {len(groups)} duplicate groups:")
    
    for i, group in enumerate(groups):
        print(f"\nGroup {i + 1}:")
        print(f"  Kept file: {group['keptFile']['name']}")
        print(f"  Reason: {group['reason']}")
        print(f"  Total size saved: {group['totalSizeSaved']} bytes")
        print(f"  Duplicates ({len(group['duplicates'])}):")
        for dup in group['duplicates']:
            print(f"    - {dup['file']['name']} (similarity: {dup['similarity']})")
    
    # Summary
    total_duplicates = sum(len(g['duplicates']) for g in groups)
    total_size_saved = sum(g['totalSizeSaved'] for g in groups)
    
    print(f"\nSummary:")
    print(f"  Duplicate groups: {len(groups)}")
    print(f"  Total duplicates: {total_duplicates}")
    print(f"  Total size saved: {total_size_saved} bytes")
    
    return groups


if __name__ == "__main__":
    asyncio.run(test_duplicate_detection())
