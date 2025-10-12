"""Setup script for API service"""
import subprocess
import sys

def setup():
    print("Setting up API service...")
    
    # Install dependencies
    print("Installing Python dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
    
    # Generate Prisma client
    print("Generating Prisma client...")
    subprocess.run(["prisma", "generate"], check=True)
    
    print("Setup complete!")

if __name__ == "__main__":
    setup()

