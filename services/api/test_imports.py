#!/usr/bin/env python3
"""
Test script to verify all imports work correctly
"""
import sys
import os

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """Test all critical imports"""
    print("🔍 Testing Critical Imports...")
    
    try:
        # Test basic imports
        print("  - Testing basic imports...")
        import logging
        import asyncio
        import json
        print("  ✅ Basic imports successful")
        
        # Test PDF processing
        print("  - Testing PDF processing...")
        from app.services.pdf_processor import pdf_processor
        print("  ✅ PDF processor import successful")
        
        # Test image processing
        print("  - Testing image processing...")
        from app.services.image_processor import image_processor
        print("  ✅ Image processor import successful")
        
        # Test file processing
        print("  - Testing file processing...")
        from app.services.file_processor import file_processor
        print("  ✅ File processor import successful")
        
        # Test API imports
        print("  - Testing API imports...")
        from app.api import dedupe, files
        print("  ✅ API imports successful")
        
        # Test main app
        print("  - Testing main app...")
        from app.main import app
        print("  ✅ Main app import successful")
        
        print("\n🎉 All imports successful! The API should start without issues.")
        return True
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)
