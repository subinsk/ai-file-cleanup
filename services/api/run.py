"""Run the API service"""
import os
import sys

# Fix Windows console encoding for Unicode characters
if sys.platform == "win32":
    try:
        # Set UTF-8 encoding for stdout
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

if __name__ == "__main__":
    print("=" * 50)
    print("Starting AI File Cleanup API Service")
    print("=" * 50)
    
    # Get port from environment variable (for Render) or default to 3001
    port = int(os.environ.get("PORT", 3001))
    
    print(f"\n>> Starting server on port {port}...")
    print("=" * 50 + "\n")
    
    # Import uvicorn
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,  # Enable reload in development
        log_level="info"
    )

