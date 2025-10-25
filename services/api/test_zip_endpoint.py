#!/usr/bin/env python3
"""
Test script for ZIP endpoint functionality
"""
import asyncio
import aiohttp
import json
import os
import tempfile
import zipfile
from pathlib import Path


async def test_zip_endpoint():
    """Test the ZIP generation endpoint"""
    base_url = "http://localhost:3001"
    
    # Test data
    test_data = {
        "uploadId": "test-upload-123",
        "fileIds": ["file1", "file2", "file3"]
    }
    
    print("🧪 Testing ZIP endpoint...")
    
    async with aiohttp.ClientSession() as session:
        try:
            # Test ZIP creation
            print("📦 Creating ZIP file...")
            async with session.post(
                f"{base_url}/dedupe/zip",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    print("✅ ZIP endpoint responded successfully")
                    
                    # Save the ZIP file for inspection
                    zip_content = await response.read()
                    temp_dir = tempfile.mkdtemp()
                    zip_path = os.path.join(temp_dir, "test-download.zip")
                    
                    with open(zip_path, 'wb') as f:
                        f.write(zip_content)
                    
                    print(f"💾 ZIP file saved to: {zip_path}")
                    print(f"📊 ZIP file size: {len(zip_content)} bytes")
                    
                    # Inspect ZIP contents
                    with zipfile.ZipFile(zip_path, 'r') as zip_file:
                        print("📁 ZIP contents:")
                        for info in zip_file.filelist:
                            print(f"  - {info.filename} ({info.file_size} bytes)")
                        
                        # Read and display content of first file
                        if zip_file.filelist:
                            first_file = zip_file.filelist[0]
                            content = zip_file.read(first_file.filename).decode('utf-8')
                            print(f"\n📄 Content of {first_file.filename}:")
                            print(content[:200] + "..." if len(content) > 200 else content)
                    
                    print("✅ ZIP endpoint test completed successfully!")
                    return True
                    
                else:
                    print(f"❌ ZIP endpoint failed with status: {response.status}")
                    error_text = await response.text()
                    print(f"Error response: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            return False


async def test_preview_endpoint():
    """Test the preview endpoint"""
    base_url = "http://localhost:3001"
    
    # Test data
    test_data = {
        "files": [
            {"name": "test1.txt", "size": 1024, "type": "text/plain"},
            {"name": "test2.jpg", "size": 2048, "type": "image/jpeg"}
        ]
    }
    
    print("\n🧪 Testing preview endpoint...")
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{base_url}/dedupe/preview",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    print("✅ Preview endpoint responded successfully")
                    print(f"📊 Response: {json.dumps(result, indent=2)}")
                    return True
                else:
                    print(f"❌ Preview endpoint failed with status: {response.status}")
                    error_text = await response.text()
                    print(f"Error response: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Preview test failed with error: {e}")
            return False


async def main():
    """Run all tests"""
    print("🚀 Starting API endpoint tests...")
    print("=" * 50)
    
    # Test preview endpoint
    preview_success = await test_preview_endpoint()
    
    # Test ZIP endpoint
    zip_success = await test_zip_endpoint()
    
    print("\n" + "=" * 50)
    print("📋 Test Results:")
    print(f"  Preview endpoint: {'✅ PASS' if preview_success else '❌ FAIL'}")
    print(f"  ZIP endpoint: {'✅ PASS' if zip_success else '❌ FAIL'}")
    
    if preview_success and zip_success:
        print("\n🎉 All tests passed!")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")


if __name__ == "__main__":
    asyncio.run(main())
