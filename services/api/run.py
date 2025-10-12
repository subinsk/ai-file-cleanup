"""Run the API service"""
import os
import sys

if __name__ == "__main__":
    print("=" * 50)
    print("Starting AI File Cleanup API Service")
    print("=" * 50)
    
    # Get port from environment variable (for Render) or default to 3001
    port = int(os.environ.get("PORT", 3001))
    
    print(f"\n🚀 Starting server on port {port}...")
    print("=" * 50 + "\n")
    
    # Import uvicorn
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Disable reload in production
        log_level="info"
    )

