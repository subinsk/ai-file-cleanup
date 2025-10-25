#!/usr/bin/env python3
"""
Test script for file processing functionality
"""
import asyncio
import aiohttp
import json
import base64
from pathlib import Path


async def test_file_processing():
    """Test the file processing endpoints"""
    base_url = "http://localhost:3001"
    
    print("🧪 Testing File Processing Endpoints...")
    
    async with aiohttp.ClientSession() as session:
        try:
            # Test 1: Get supported file types
            print("\n📋 Testing supported file types...")
            async with session.get(f"{base_url}/files/supported-types") as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Supported types endpoint working")
                    print(f"📊 Supported types: {json.dumps(data, indent=2)}")
                else:
                    print(f"❌ Supported types endpoint failed: {response.status}")
            
            # Test 2: Test file upload (mock)
            print("\n📤 Testing file upload...")
            
            # Create mock file data
            mock_pdf_content = b"Mock PDF content for testing"
            mock_image_content = b"Mock image content for testing"
            
            # Test PDF upload
            files = [
                ('files', ('test.pdf', mock_pdf_content, 'application/pdf')),
                ('files', ('test.jpg', mock_image_content, 'image/jpeg'))
            ]
            
            async with session.post(
                f"{base_url}/files/upload",
                data=files,
                headers={"Authorization": "Bearer test-token"}  # Mock auth
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ File upload endpoint working")
                    print(f"📊 Upload results: {json.dumps(data, indent=2)}")
                else:
                    print(f"❌ File upload failed: {response.status}")
                    error_text = await response.text()
                    print(f"Error: {error_text}")
            
            # Test 3: Test dedupe preview
            print("\n🔍 Testing dedupe preview...")
            
            test_data = {
                "files": [
                    {
                        "name": "document1.pdf",
                        "size": 1024,
                        "type": "application/pdf"
                    },
                    {
                        "name": "image1.jpg",
                        "size": 2048,
                        "type": "image/jpeg"
                    },
                    {
                        "name": "text1.txt",
                        "size": 512,
                        "type": "text/plain"
                    }
                ]
            }
            
            async with session.post(
                f"{base_url}/dedupe/preview",
                json=test_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer test-token"
                }
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Dedupe preview endpoint working")
                    print(f"📊 Preview results: {json.dumps(data, indent=2)}")
                else:
                    print(f"❌ Dedupe preview failed: {response.status}")
                    error_text = await response.text()
                    print(f"Error: {error_text}")
            
            print("\n🎉 File processing tests completed!")
            
        except Exception as e:
            print(f"❌ Test failed with error: {e}")


async def test_ml_service():
    """Test ML service endpoints"""
    ml_url = "http://localhost:3002"
    
    print("\n🤖 Testing ML Service...")
    
    async with aiohttp.ClientSession() as session:
        try:
            # Test health check
            async with session.get(f"{ml_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ ML service health check working")
                    print(f"📊 Health status: {json.dumps(data, indent=2)}")
                else:
                    print(f"❌ ML service health check failed: {response.status}")
            
            # Test text embeddings
            print("\n📝 Testing text embeddings...")
            text_data = {
                "texts": [
                    "This is a test document about AI and machine learning.",
                    "Another document about artificial intelligence and neural networks."
                ]
            }
            
            async with session.post(
                f"{ml_url}/embeddings/text",
                json=text_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Text embeddings working")
                    print(f"📊 Generated {len(data.get('embeddings', []))} embeddings")
                else:
                    print(f"❌ Text embeddings failed: {response.status}")
                    error_text = await response.text()
                    print(f"Error: {error_text}")
            
            # Test image embeddings
            print("\n🖼️ Testing image embeddings...")
            # Create a simple base64 image (1x1 pixel)
            simple_image = base64.b64encode(b"mock_image_data").decode('utf-8')
            image_data = {
                "images": [simple_image]
            }
            
            async with session.post(
                f"{ml_url}/embeddings/image",
                json=image_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Image embeddings working")
                    print(f"📊 Generated {len(data.get('embeddings', []))} embeddings")
                else:
                    print(f"❌ Image embeddings failed: {response.status}")
                    error_text = await response.text()
                    print(f"Error: {error_text}")
            
            print("\n🎉 ML service tests completed!")
            
        except Exception as e:
            print(f"❌ ML service test failed: {e}")


async def main():
    """Run all tests"""
    print("🚀 Starting AI File Cleanup Tests...")
    print("=" * 50)
    
    # Test API service
    await test_file_processing()
    
    # Test ML service
    await test_ml_service()
    
    print("\n" + "=" * 50)
    print("🏁 All tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
