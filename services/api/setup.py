"""Setup script for API service"""
import subprocess
import sys

def setup():
    print("Setting up API service...")
    
    # Install dependencies
    print("Installing Python dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
    
    # Generate Prisma client (optional - should be pre-generated and committed)
    print("Generating Prisma client (if needed)...")
    import os
    schema_path = os.path.join(os.path.dirname(__file__), "..", "..", "packages", "db", "prisma", "schema.prisma")
    try:
        subprocess.run([sys.executable, "-m", "prisma", "generate", "--schema", schema_path], check=True)
        print("✅ Prisma client generated")
    except Exception as e:
        print(f"⚠️  Prisma generation skipped (client should be pre-generated): {e}")
        print("ℹ️  If needed, generate manually: python -m prisma generate --schema ../../packages/db/prisma/schema.prisma")
    
    print("Setup complete!")

if __name__ == "__main__":
    setup()

