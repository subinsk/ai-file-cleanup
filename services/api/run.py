"""Run the API service"""
import subprocess
import sys
import os

def generate_prisma():
    """Generate Prisma Python client"""
    db_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'packages', 'db'))
    schema_path = os.path.join(db_dir, 'prisma', 'schema.prisma')
    
    print(f"🔄 Generating Python Prisma client from: {schema_path}")
    
    # Set environment variable to skip Node.js installation
    env = os.environ.copy()
    env['PRISMA_SKIP_POSTINSTALL_GENERATE'] = '1'
    
    try:
        result = subprocess.run(
            [sys.executable, "-m", "prisma", "generate", "--schema", schema_path],
            check=True,
            capture_output=True,
            text=True,
            env=env
        )
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        print("✅ Prisma client generated successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to generate Prisma client:")
        print(e.stdout)
        print(e.stderr)
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Starting AI File Cleanup API Service")
    print("=" * 50)
    
    # Always try to generate Prisma client before starting server
    # This ensures it's available before any imports happen
    print("\n📦 Checking Prisma client...")
    generate_prisma()
    
    # Get port from environment variable (for Render) or default to 3001
    port = int(os.environ.get("PORT", 3001))
    
    print(f"\n🚀 Starting server on port {port}...")
    print("=" * 50 + "\n")
    
    # Import uvicorn here AFTER Prisma generation
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Disable reload in production
        log_level="info"
    )

