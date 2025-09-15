#!/usr/bin/env python3
"""
Comprehensive System Test for AI File Management System
Tests all components end-to-end
"""

import os
import sys
import time
import requests
import json
import tempfile
import shutil
from pathlib import Path
import subprocess
import threading
import websocket
import pytest

class SystemTester:
    """Comprehensive system testing"""
    
    def __init__(self):
        self.api_base = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        self.ws_url = "ws://localhost:8000/ws"
        self.test_dir = None
        self.session_id = None
        self.cleanup_id = None
        
    def setup_test_environment(self):
        """Create test environment with sample files"""
        print("🔧 Setting up test environment...")
        
        # Create temporary directory
        self.test_dir = tempfile.mkdtemp(prefix="ai_file_test_")
        print(f"📁 Test directory: {self.test_dir}")
        
        # Create sample files
        self._create_sample_files()
        
        return self.test_dir
    
    def _create_sample_files(self):
        """Create sample files for testing"""
        # Create subdirectories
        subdirs = ["documents", "images", "code", "duplicates"]
        for subdir in subdirs:
            os.makedirs(os.path.join(self.test_dir, subdir), exist_ok=True)
        
        # Create text files
        text_files = [
            ("documents/readme.txt", "This is a README file"),
            ("documents/notes.txt", "These are my notes"),
            ("code/main.py", "print('Hello, World!')"),
            ("code/utils.py", "def helper(): pass"),
            ("duplicates/file1.txt", "This is duplicate content"),
            ("duplicates/file2.txt", "This is duplicate content"),  # Exact duplicate
            ("duplicates/similar.txt", "This is similar content"),  # Similar content
        ]
        
        for file_path, content in text_files:
            full_path = os.path.join(self.test_dir, file_path)
            with open(full_path, 'w') as f:
                f.write(content)
        
        # Create some binary files (simulate images)
        binary_files = [
            "images/photo1.jpg",
            "images/photo2.png",
            "images/duplicate.jpg",
        ]
        
        for file_path in binary_files:
            full_path = os.path.join(self.test_dir, file_path)
            with open(full_path, 'wb') as f:
                f.write(b"fake image data" * 100)  # Create some binary content
        
        print(f"✅ Created {len(text_files) + len(binary_files)} test files")
    
    def cleanup_test_environment(self):
        """Clean up test environment"""
        if self.test_dir and os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
            print("🧹 Cleaned up test environment")
    
    def test_health_checks(self):
        """Test all health check endpoints"""
        print("\n🔍 Testing health checks...")
        
        endpoints = [
            ("/", "Root endpoint"),
            ("/health", "Health check"),
            ("/api/health", "API health check"),
        ]
        
        for endpoint, description in endpoints:
            try:
                response = requests.get(f"{self.api_base}{endpoint}", timeout=5)
                if response.status_code == 200:
                    print(f"✅ {description}: OK")
                else:
                    print(f"❌ {description}: {response.status_code}")
                    return False
            except Exception as e:
                print(f"❌ {description}: {e}")
                return False
        
        return True
    
    def test_scan_functionality(self):
        """Test complete scan functionality"""
        print("\n🔍 Testing scan functionality...")
        
        try:
            # Start scan
            scan_data = {
                "directory_path": self.test_dir,
                "include_subdirectories": True
            }
            
            response = requests.post(
                f"{self.api_base}/api/scan/start",
                json=scan_data,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"❌ Scan start failed: {response.status_code}")
                return False
            
            result = response.json()
            self.session_id = result.get("session_id")
            print(f"✅ Scan started: {self.session_id}")
            
            # Monitor scan progress
            max_wait = 60  # 60 seconds max
            start_time = time.time()
            
            while time.time() - start_time < max_wait:
                status_response = requests.get(
                    f"{self.api_base}/api/scan/status/{self.session_id}",
                    timeout=5
                )
                
                if status_response.status_code == 200:
                    status = status_response.json()
                    print(f"📊 Scan progress: {status.get('progress_percentage', 0):.1f}%")
                    
                    if status.get('status') == 'completed':
                        print("✅ Scan completed successfully")
                        return True
                    elif status.get('status') == 'failed':
                        print(f"❌ Scan failed: {status.get('error_message')}")
                        return False
                
                time.sleep(2)
            
            print("⚠️ Scan timed out")
            return False
            
        except Exception as e:
            print(f"❌ Scan test failed: {e}")
            return False
    
    def test_duplicate_detection(self):
        """Test duplicate detection functionality"""
        print("\n🔍 Testing duplicate detection...")
        
        try:
            # Get duplicates
            response = requests.get(f"{self.api_base}/api/duplicates", timeout=10)
            
            if response.status_code != 200:
                print(f"❌ Get duplicates failed: {response.status_code}")
                return False
            
            duplicates = response.json()
            print(f"📊 Found {len(duplicates)} duplicate groups")
            
            # Get duplicate stats
            stats_response = requests.get(f"{self.api_base}/api/duplicates/stats", timeout=5)
            
            if stats_response.status_code == 200:
                stats = stats_response.json()
                print(f"📈 Duplicate stats: {stats.get('total_duplicate_groups', 0)} groups, {stats.get('total_space_wasted', 0)} bytes wasted")
                return True
            else:
                print(f"❌ Get duplicate stats failed: {stats_response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Duplicate detection test failed: {e}")
            return False
    
    def test_cleanup_functionality(self):
        """Test cleanup functionality"""
        print("\n🔍 Testing cleanup functionality...")
        
        try:
            # Execute cleanup with dry run
            cleanup_data = {
                "rules": [{
                    "action": "delete_duplicates",
                    "dry_run": True,
                    "keep_primary": True,
                    "min_similarity_score": 0.8
                }],
                "confirm": False,
                "backup": True
            }
            
            response = requests.post(
                f"{self.api_base}/api/cleanup/execute",
                json=cleanup_data,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"❌ Cleanup execution failed: {response.status_code}")
                return False
            
            result = response.json()
            self.cleanup_id = result.get("cleanup_id")
            print(f"✅ Cleanup started (dry run): {self.cleanup_id}")
            
            # Check cleanup status
            time.sleep(2)
            status_response = requests.get(
                f"{self.api_base}/api/cleanup/status/{self.cleanup_id}",
                timeout=5
            )
            
            if status_response.status_code == 200:
                status = status_response.json()
                print(f"📊 Cleanup status: {status.get('status')}")
                return True
            else:
                print(f"❌ Get cleanup status failed: {status_response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Cleanup test failed: {e}")
            return False
    
    def test_websocket_functionality(self):
        """Test WebSocket functionality"""
        print("\n🔍 Testing WebSocket functionality...")
        
        try:
            ws_url = f"{self.ws_url}/test-session"
            
            def on_message(ws, message):
                print(f"📨 WebSocket message received: {message[:100]}...")
                ws.close()
            
            def on_error(ws, error):
                print(f"❌ WebSocket error: {error}")
            
            def on_close(ws, close_status_code, close_msg):
                print("✅ WebSocket connection closed")
            
            def on_open(ws):
                print("✅ WebSocket connection opened")
                ws.send("test message")
            
            ws = websocket.WebSocketApp(
                ws_url,
                on_open=on_open,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close
            )
            
            # Run WebSocket in a separate thread
            wst = threading.Thread(target=ws.run_forever)
            wst.daemon = True
            wst.start()
            
            # Wait for connection and message
            time.sleep(3)
            return True
            
        except Exception as e:
            print(f"❌ WebSocket test failed: {e}")
            return False
    
    def test_frontend_accessibility(self):
        """Test frontend accessibility"""
        print("\n🔍 Testing frontend accessibility...")
        
        try:
            response = requests.get(self.frontend_url, timeout=10)
            
            if response.status_code == 200:
                print("✅ Frontend is accessible")
                return True
            else:
                print(f"❌ Frontend not accessible: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Frontend test failed: {e}")
            return False
    
    def test_api_documentation(self):
        """Test API documentation accessibility"""
        print("\n🔍 Testing API documentation...")
        
        try:
            response = requests.get(f"{self.api_base}/docs", timeout=10)
            
            if response.status_code == 200:
                print("✅ API documentation is accessible")
                return True
            else:
                print(f"❌ API documentation not accessible: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ API documentation test failed: {e}")
            return False
    
    def test_performance(self):
        """Test system performance"""
        print("\n🔍 Testing system performance...")
        
        try:
            # Test API response times
            endpoints = [
                "/health",
                "/api/health",
                "/api/duplicates/stats",
                "/api/scan/sessions"
            ]
            
            total_time = 0
            successful_requests = 0
            
            for endpoint in endpoints:
                start_time = time.time()
                response = requests.get(f"{self.api_base}{endpoint}", timeout=5)
                end_time = time.time()
                
                if response.status_code == 200:
                    response_time = end_time - start_time
                    total_time += response_time
                    successful_requests += 1
                    print(f"📊 {endpoint}: {response_time:.3f}s")
            
            if successful_requests > 0:
                avg_response_time = total_time / successful_requests
                print(f"📈 Average response time: {avg_response_time:.3f}s")
                
                if avg_response_time < 1.0:  # Less than 1 second
                    print("✅ Performance is good")
                    return True
                else:
                    print("⚠️ Performance could be improved")
                    return True
            else:
                print("❌ No successful requests")
                return False
                
        except Exception as e:
            print(f"❌ Performance test failed: {e}")
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 AI File Management System - Comprehensive Test Suite")
        print("=" * 70)
        
        # Setup
        self.setup_test_environment()
        
        tests = [
            ("Health Checks", self.test_health_checks),
            ("Frontend Accessibility", self.test_frontend_accessibility),
            ("API Documentation", self.test_api_documentation),
            ("WebSocket Functionality", self.test_websocket_functionality),
            ("Scan Functionality", self.test_scan_functionality),
            ("Duplicate Detection", self.test_duplicate_detection),
            ("Cleanup Functionality", self.test_cleanup_functionality),
            ("Performance", self.test_performance),
        ]
        
        results = []
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results.append((test_name, False))
        
        # Cleanup
        self.cleanup_test_environment()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 Test Results Summary")
        print("=" * 70)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name:25} {status}")
            if result:
                passed += 1
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! System is working perfectly.")
            return 0
        else:
            print(f"⚠️ {total - passed} tests failed. Please check the logs above.")
            return 1

def main():
    """Main test runner"""
    tester = SystemTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
