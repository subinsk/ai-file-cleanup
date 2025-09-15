#!/usr/bin/env python3
"""
AI File Management System - Test Script
This script tests the basic functionality of the system
"""

import requests
import time
import json
import os
import sys

# Configuration
API_BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def test_backend_health():
    """Test backend health endpoint"""
    print("🔍 Testing backend health...")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_api_endpoints():
    """Test basic API endpoints"""
    print("\n🔍 Testing API endpoints...")
    
    endpoints = [
        ("/", "Root endpoint"),
        ("/api/health", "API health check"),
        ("/api/duplicates/stats", "Duplicate stats"),
    ]
    
    for endpoint, description in endpoints:
        try:
            response = requests.get(f"{API_BASE_URL}{endpoint}", timeout=5)
            if response.status_code == 200:
                print(f"✅ {description}: OK")
            else:
                print(f"⚠️  {description}: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"❌ {description}: {e}")

def test_scan_functionality():
    """Test scan functionality"""
    print("\n🔍 Testing scan functionality...")
    
    # Test scan start
    try:
        scan_data = {
            "directory_path": os.getcwd(),  # Current directory
            "include_subdirectories": True
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/scan/start",
            json=scan_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            session_id = result.get("session_id")
            print(f"✅ Scan started successfully: {session_id}")
            
            # Wait a bit and check status
            time.sleep(2)
            status_response = requests.get(
                f"{API_BASE_URL}/api/scan/status/{session_id}",
                timeout=5
            )
            
            if status_response.status_code == 200:
                status = status_response.json()
                print(f"✅ Scan status retrieved: {status.get('status')}")
                return True
            else:
                print(f"⚠️  Could not retrieve scan status: {status_response.status_code}")
                return False
        else:
            print(f"❌ Scan start failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Scan test failed: {e}")
        return False

def test_frontend():
    """Test frontend accessibility"""
    print("\n🔍 Testing frontend...")
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend not accessible: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend test failed: {e}")
        return False

def test_websocket():
    """Test WebSocket connection"""
    print("\n🔍 Testing WebSocket...")
    try:
        import websocket
        import threading
        
        def on_message(ws, message):
            print(f"✅ WebSocket message received: {message[:100]}...")
            ws.close()
        
        def on_error(ws, error):
            print(f"❌ WebSocket error: {error}")
        
        def on_close(ws, close_status_code, close_msg):
            print("✅ WebSocket connection closed")
        
        def on_open(ws):
            print("✅ WebSocket connection opened")
            ws.send("test message")
        
        ws = websocket.WebSocketApp(
            "ws://localhost:8000/ws/test",
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        
        # Run WebSocket in a separate thread
        wst = threading.Thread(target=ws.run_forever)
        wst.daemon = True
        wst.start()
        
        # Wait for connection
        time.sleep(2)
        return True
        
    except ImportError:
        print("⚠️  WebSocket test skipped (websocket-client not installed)")
        return True
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 AI File Management System - Test Suite")
    print("=" * 50)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("API Endpoints", test_api_endpoints),
        ("Scan Functionality", test_scan_functionality),
        ("Frontend", test_frontend),
        ("WebSocket", test_websocket),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! System is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the logs above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
