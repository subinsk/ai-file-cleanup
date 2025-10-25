#!/usr/bin/env python3
"""
Test script for updated PDF and image processing
"""
import asyncio
import os
import sys
from pathlib import Path

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.pdf_processor import pdf_processor
from app.services.image_processor import image_processor
from app.services.file_processor import file_processor

async def test_pdf_processing():
    """Test PDF processing with PyPDF2"""
    print("🔍 Testing PDF Processing...")
    
    # Create a simple test PDF content (this would normally be a real PDF file)
    test_pdf_path = "test_files/sample.pdf"
    
    if not os.path.exists(test_pdf_path):
        print(f"❌ Test PDF not found: {test_pdf_path}")
        return False
    
    try:
        with open(test_pdf_path, 'rb') as f:
            pdf_data = f.read()
        
        result = await pdf_processor.extract_text(pdf_data)
        
        if result['success']:
            print(f"✅ PDF Processing Success!")
            print(f"   - Pages: {result['metadata'].get('num_pages', 'N/A')}")
            print(f"   - Text Length: {result['metadata'].get('text_length', 'N/A')}")
            print(f"   - Text Preview: {result['text'][:100]}...")
            return True
        else:
            print(f"❌ PDF Processing Failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ PDF Processing Error: {e}")
        return False

async def test_image_processing():
    """Test image processing with Pillow + OpenCV"""
    print("\n🖼️  Testing Image Processing...")
    
    # Test with a sample image
    test_image_path = "test_files/sample_image.jpg"
    
    if not os.path.exists(test_image_path):
        print(f"❌ Test image not found: {test_image_path}")
        return False
    
    try:
        with open(test_image_path, 'rb') as f:
            image_data = f.read()
        
        result = await image_processor.process_image(image_data)
        
        if result['success']:
            print(f"✅ Image Processing Success!")
            print(f"   - Original Size: {result['metadata'].get('original_size', 'N/A')}")
            print(f"   - Normalized Size: {result['metadata'].get('normalized_size', 'N/A')}")
            print(f"   - Perceptual Hash: {result['perceptual_hash'][:16]}...")
            print(f"   - Features: {len(result['image_features'])} extracted")
            return True
        else:
            print(f"❌ Image Processing Failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Image Processing Error: {e}")
        return False

async def test_file_processing():
    """Test unified file processing"""
    print("\n📁 Testing Unified File Processing...")
    
    # Test with different file types
    test_files = [
        ("test_files/sample.pdf", "application/pdf"),
        ("test_files/sample_image.jpg", "image/jpeg"),
        ("test_files/sample.txt", "text/plain")
    ]
    
    success_count = 0
    
    for file_path, mime_type in test_files:
        if not os.path.exists(file_path):
            print(f"⚠️  Test file not found: {file_path}")
            continue
            
        try:
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            result = await file_processor.process_file(file_data, mime_type)
            
            if result['success']:
                print(f"✅ {mime_type} Processing Success!")
                success_count += 1
            else:
                print(f"❌ {mime_type} Processing Failed: {result['error']}")
                
        except Exception as e:
            print(f"❌ {mime_type} Processing Error: {e}")
    
    return success_count > 0

async def main():
    """Run all tests"""
    print("🚀 Testing Updated File Processing Implementation")
    print("=" * 60)
    
    # Test individual processors
    pdf_success = await test_pdf_processing()
    image_success = await test_image_processing()
    file_success = await test_file_processing()
    
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    print(f"   PDF Processing: {'✅ PASS' if pdf_success else '❌ FAIL'}")
    print(f"   Image Processing: {'✅ PASS' if image_success else '❌ FAIL'}")
    print(f"   File Processing: {'✅ PASS' if file_success else '❌ FAIL'}")
    
    if all([pdf_success, image_success, file_success]):
        print("\n🎉 All tests passed! Updated implementation is working.")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")

if __name__ == "__main__":
    asyncio.run(main())
