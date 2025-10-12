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
    except RuntimeError:
        return False

def generate_prisma():
    """Generate Prisma Python client"""
    db_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'packages', 'db'))
    schema_path = os.path.join(db_dir, 'prisma', 'schema.prisma')
    
    print(f"Generating Python Prisma client from: {schema_path}")
    subprocess.run([sys.executable, "-m", "prisma", "generate", "--schema", schema_path], check=True)

if __name__ == "__main__":
    # Check if Prisma client is generated
    if not check_prisma_generated():
        print("Prisma client not generated. Running 'prisma generate'...")
        try:
            generate_prisma()
            print("✅ Prisma client generated!")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to generate Prisma client: {e}")
            print("Please run 'python generate_prisma.py' manually.")
            sys.exit(1)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=3001,
        reload=True,
        log_level="info"
    )

