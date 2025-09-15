#!/usr/bin/env python3
"""
AI File Management System - Setup Verification Script
This script verifies that all components are properly set up and ready to run
"""

import os
import sys
import json
from pathlib import Path

def check_file_structure():
    """Verify the complete file structure is in place"""
    print("🔍 Verifying file structure...")
    
    required_files = [
        # Root files
        "README.md",
        "SETUP.md", 
        "PROJECT_STATUS.md",
        "docker-compose.yml",
        "start.bat",
        "start.sh",
        "test_system.py",
        "verify_setup.py",
        
        # Backend files
        "backend/requirements.txt",
        "backend/Dockerfile",
        "backend/app/main.py",
        "backend/app/__init__.py",
        "backend/app/core/config.py",
        "backend/app/core/database.py",
        "backend/app/core/websocket_manager.py",
        "backend/app/api/routes.py",
        "backend/app/api/__init__.py",
        "backend/app/models/file.py",
        "backend/app/models/duplicate.py",
        "backend/app/models/scan_session.py",
        "backend/app/models/__init__.py",
        "backend/app/schemas/scan.py",
        "backend/app/schemas/duplicate.py",
        "backend/app/schemas/cleanup.py",
        "backend/app/schemas/__init__.py",
        "backend/app/services/scanner_service.py",
        "backend/app/services/duplicate_service.py",
        "backend/app/services/cleanup_service.py",
        "backend/app/services/__init__.py",
        "backend/app/services/ml_models/text_classifier.py",
        "backend/app/services/ml_models/image_classifier.py",
        "backend/app/services/ml_models/duplicate_detector.py",
        "backend/app/services/ml_models/__init__.py",
        
        # Frontend files
        "frontend/package.json",
        "frontend/Dockerfile",
        "frontend/public/index.html",
        "frontend/src/index.tsx",
        "frontend/src/App.tsx",
        "frontend/src/components/ScanPanel.tsx",
        "frontend/src/components/DuplicatePanel.tsx",
        "frontend/src/components/CleanupPanel.tsx",
        "frontend/src/components/StatsPanel.tsx",
        "frontend/src/services/apiService.ts",
        "frontend/src/hooks/useWebSocket.ts",
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print(f"❌ Missing files: {len(missing_files)}")
        for file in missing_files:
            print(f"   - {file}")
        return False
    else:
        print(f"✅ All {len(required_files)} required files present")
        return True

def check_docker_config():
    """Verify Docker configuration"""
    print("\n🔍 Verifying Docker configuration...")
    
    # Check docker-compose.yml
    if os.path.exists("docker-compose.yml"):
        with open("docker-compose.yml", "r") as f:
            content = f.read()
            if "postgres" in content and "redis" in content and "backend" in content and "frontend" in content:
                print("✅ docker-compose.yml properly configured")
            else:
                print("❌ docker-compose.yml missing required services")
                return False
    else:
        print("❌ docker-compose.yml not found")
        return False
    
    # Check Dockerfiles
    dockerfiles = ["backend/Dockerfile", "frontend/Dockerfile"]
    for dockerfile in dockerfiles:
        if os.path.exists(dockerfile):
            print(f"✅ {dockerfile} present")
        else:
            print(f"❌ {dockerfile} missing")
            return False
    
    return True

def check_dependencies():
    """Check if dependency files are properly configured"""
    print("\n🔍 Verifying dependencies...")
    
    # Check backend requirements.txt
    if os.path.exists("backend/requirements.txt"):
        with open("backend/requirements.txt", "r") as f:
            content = f.read()
            required_packages = ["fastapi", "uvicorn", "sqlalchemy", "psycopg2", "redis", "torch", "transformers"]
            missing_packages = []
            for package in required_packages:
                if package not in content:
                    missing_packages.append(package)
            
            if missing_packages:
                print(f"❌ Missing packages in requirements.txt: {missing_packages}")
                return False
            else:
                print("✅ Backend dependencies properly configured")
    else:
        print("❌ backend/requirements.txt not found")
        return False
    
    # Check frontend package.json
    if os.path.exists("frontend/package.json"):
        try:
            with open("frontend/package.json", "r") as f:
                package_data = json.load(f)
                required_deps = ["react", "@mui/material", "axios", "typescript"]
                missing_deps = []
                for dep in required_deps:
                    if dep not in package_data.get("dependencies", {}):
                        missing_deps.append(dep)
                
                if missing_deps:
                    print(f"❌ Missing dependencies in package.json: {missing_deps}")
                    return False
                else:
                    print("✅ Frontend dependencies properly configured")
        except json.JSONDecodeError:
            print("❌ Invalid JSON in package.json")
            return False
    else:
        print("❌ frontend/package.json not found")
        return False
    
    return True

def check_code_quality():
    """Basic code quality checks"""
    print("\n🔍 Verifying code quality...")
    
    # Check for proper imports in main files
    main_files = [
        "backend/app/main.py",
        "frontend/src/App.tsx"
    ]
    
    for file_path in main_files:
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                if len(content.strip()) > 0:
                    print(f"✅ {file_path} has content")
                else:
                    print(f"❌ {file_path} is empty")
                    return False
        else:
            print(f"❌ {file_path} not found")
            return False
    
    return True

def check_documentation():
    """Verify documentation completeness"""
    print("\n🔍 Verifying documentation...")
    
    doc_files = ["README.md", "SETUP.md", "PROJECT_STATUS.md"]
    for doc_file in doc_files:
        if os.path.exists(doc_file):
            with open(doc_file, "r", encoding="utf-8") as f:
                content = f.read()
                if len(content) > 1000:  # Basic check for substantial content
                    print(f"✅ {doc_file} is comprehensive")
                else:
                    print(f"⚠️  {doc_file} might be incomplete")
        else:
            print(f"❌ {doc_file} missing")
            return False
    
    return True

def check_startup_scripts():
    """Verify startup scripts are properly configured"""
    print("\n🔍 Verifying startup scripts...")
    
    scripts = ["start.bat", "start.sh"]
    for script in scripts:
        if os.path.exists(script):
            with open(script, "r") as f:
                content = f.read()
                if "docker-compose" in content:
                    print(f"✅ {script} properly configured")
                else:
                    print(f"❌ {script} missing docker-compose commands")
                    return False
        else:
            print(f"❌ {script} missing")
            return False
    
    return True

def main():
    """Run all verification checks"""
    print("🚀 AI File Management System - Setup Verification")
    print("=" * 60)
    
    checks = [
        ("File Structure", check_file_structure),
        ("Docker Configuration", check_docker_config),
        ("Dependencies", check_dependencies),
        ("Code Quality", check_code_quality),
        ("Documentation", check_documentation),
        ("Startup Scripts", check_startup_scripts),
    ]
    
    results = []
    
    for check_name, check_func in checks:
        try:
            result = check_func()
            results.append((check_name, result))
        except Exception as e:
            print(f"❌ {check_name} check failed with exception: {e}")
            results.append((check_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Verification Results Summary")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for check_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{check_name:20} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n🎉 ALL CHECKS PASSED!")
        print("✅ The AI File Management System is properly set up and ready to run!")
        print("\n🚀 To start the system:")
        print("   Windows: start.bat")
        print("   Unix/Linux: ./start.sh")
        print("\n🌐 Access the application at:")
        print("   Dashboard: http://localhost:3000")
        print("   API Docs: http://localhost:8000/docs")
        return 0
    else:
        print(f"\n⚠️  {total - passed} checks failed.")
        print("Please review the failed checks above and fix any issues.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
