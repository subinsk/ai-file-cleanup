"""Setup script for API service"""
import subprocess
import sys

def setup():
    print("Setting up API service...")
    
    # Install dependencies
    print("Installing Python dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
    
    # Generate Prisma client using Python CLI
    print("Generating Prisma client...")
    import os
    schema_path = os.path.join(os.path.dirname(__file__), "..", "..", "packages", "db", "prisma", "schema.prisma")
    subprocess.run([sys.executable, "-m", "prisma", "generate", "--schema", schema_path], check=True)
    
    print("Setup complete!")

if __name__ == "__main__":
    setup()

