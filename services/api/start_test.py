#!/usr/bin/env python3
"""
Start the API server for testing
"""
import subprocess
import sys
import time
import requests
import os


def check_api_health():
    """Check if the API is running and healthy"""
    try:
        response = requests.get("http://localhost:3001/health", timeout=5)
        return response.status_code == 200
    except:
        return False


def start_api_server():
    """Start the API server"""
    print("🚀 Starting API server...")
    
    # Change to the API directory
    api_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(api_dir)
    
    # Start the server
    try:
        process = subprocess.Popen([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--host", "0.0.0.0", 
            "--port", "3001",
            "--reload"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        print("⏳ Waiting for API to start...")
        
        # Wait for API to be ready
        for i in range(30):  # Wait up to 30 seconds
            if check_api_health():
                print("✅ API server is running!")
                return process
            time.sleep(1)
        
        print("❌ API server failed to start within 30 seconds")
        process.terminate()
        return None
        
    except Exception as e:
        print(f"❌ Failed to start API server: {e}")
        return None


def main():
    """Main function"""
    print("🧪 API Test Setup")
    print("=" * 40)
    
    # Check if API is already running
    if check_api_health():
        print("✅ API is already running!")
        return
    
    # Start API server
    process = start_api_server()
    if not process:
        print("❌ Failed to start API server")
        return
    
    try:
        print("\n📋 API server is running at http://localhost:3001")
        print("📖 API docs available at http://localhost:3001/docs")
        print("🛑 Press Ctrl+C to stop the server")
        
        # Keep the server running
        process.wait()
        
    except KeyboardInterrupt:
        print("\n🛑 Stopping API server...")
        process.terminate()
        process.wait()
        print("✅ API server stopped")


if __name__ == "__main__":
    main()
