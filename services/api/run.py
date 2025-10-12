"""Run the API service"""
import subprocess
import sys
import os
import uvicorn

def check_prisma_generated():
    """Check if Prisma client is generated"""
    try:
        from prisma import Prisma
        return True
    except (RuntimeError, ImportError):
        return False

def generate_prisma():
    """Generate Prisma Python client"""
    db_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'packages', 'db'))
    schema_path = os.path.join(db_dir, 'prisma', 'schema.prisma')
    
    print(f"Generating Python Prisma client from: {schema_path}")
    
    # Set environment variable to skip Node.js installation
    env = os.environ.copy()
    env['PRISMA_SKIP_POSTINSTALL_GENERATE'] = '1'
    
    subprocess.run(
        [sys.executable, "-m", "prisma", "generate", "--schema", schema_path],
        check=True,
        env=env
    )

if __name__ == "__main__":
    # Check if Prisma client is generated
    if not check_prisma_generated():
        print("⚠️  Prisma client not generated. Attempting to generate...")
        try:
            generate_prisma()
            print("✅ Prisma client generated!")
        except subprocess.CalledProcessError as e:
            print(f"⚠️  Failed to pre-generate Prisma client: {e}")
            print("ℹ️  Client will be generated on first database connection.")
    
    # Get port from environment variable (for Render) or default to 3001
    port = int(os.environ.get("PORT", 3001))
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Disable reload in production
        log_level="info"
    )

