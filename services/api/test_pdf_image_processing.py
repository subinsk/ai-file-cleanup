#!/usr/bin/env python3
"""
Test script for PDF and image processing functionality
"""
import asyncio
import sys
import os

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from services.pdf_processor import pdf_processor
from services.image_processor import image_processor


async def test_pdf_processing():
    """Test PDF processing functionality"""
    print("📄 Testing PDF Processing...")
    
    # Create a simple test PDF content (this would normally be a real PDF)
    # For testing, we'll create a mock PDF-like content
    test_pdf_content = b"Mock PDF content for testing"
    
    try:
        # Test PDF processing
        result = await pdf_processor.extract_text(test_pdf_content)
        
        print(f"✅ PDF processing result: {result['success']}")
        if result['success']:
            print(f"📊 Extracted text length: {len(result['text'])}")
            print(f"📊 Metadata: {result['metadata']}")
        else:
            print(f"❌ Error: {result['error']}")
            
    except Exception as e:
        print(f"❌ PDF processing test failed: {e}")


async def test_image_processing():
    """Test image processing functionality"""
    print("\n🖼️ Testing Image Processing...")
    
    # Create a simple test image (1x1 pixel PNG)
    from PIL import Image
    import io
    
    # Create a simple test image
    test_image = Image.new('RGB', (100, 100), color='red')
    img_buffer = io.BytesIO()
    test_image.save(img_buffer, format='PNG')
    test_image_data = img_buffer.getvalue()
    
    try:
        # Test image processing
        result = await image_processor.process_image(test_image_data, 'image/png')
        
        print(f"✅ Image processing result: {result['success']}")
        if result['success']:
            print(f"📊 Perceptual hash: {result['perceptual_hash']}")
            print(f"📊 Features: {result['features']}")
            print(f"📊 Metadata: {result['metadata']}")
        else:
            print(f"❌ Error: {result['error']}")
            
    except Exception as e:
        print(f"❌ Image processing test failed: {e}")


async def test_file_processor():
    """Test unified file processor"""
    print("\n📁 Testing File Processor...")
    
    from services.file_processor import file_processor
    
    # Test with different file types
    test_files = [
        {
            'data': b"Mock PDF content",
            'filename': 'test.pdf',
            'mime_type': 'application/pdf'
        },
        {
            'data': b"Mock image content",
            'filename': 'test.jpg',
            'mime_type': 'image/jpeg'
        },
        {
            'data': b"Mock text content",
            'filename': 'test.txt',
            'mime_type': 'text/plain'
        }
    ]
    
    for test_file in test_files:
        try:
            result = await file_processor.process_file(
                file_data=test_file['data'],
                filename=test_file['filename'],
                mime_type=test_file['mime_type']
            )
            
            print(f"✅ {test_file['filename']}: {result['success']}")
            if not result['success']:
                print(f"   Error: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"❌ {test_file['filename']} processing failed: {e}")


async def main():
    """Run all tests"""
    print("🚀 Testing PDF and Image Processing...")
    print("=" * 50)
    
    # Test individual processors
    await test_pdf_processing()
    await test_image_processing()
    await test_file_processor()
    
    print("\n" + "=" * 50)
    print("🏁 All tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
