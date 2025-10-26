#!/usr/bin/env python3
"""
Startup script to ensure proper directory structure
"""
import os
import sys
from pathlib import Path

def setup_directories():
    """Create necessary directories for the application"""
    base_dir = Path(__file__).parent
    
    # Create temp_files directory
    temp_dir = base_dir / "temp_files"
    temp_dir.mkdir(exist_ok=True)
    print(f"✅ Created temp_files directory: {temp_dir}")
    
    # Create .gitkeep to ensure directory is tracked
    gitkeep_file = temp_dir / ".gitkeep"
    if not gitkeep_file.exists():
        gitkeep_file.write_text("# This file ensures the temp_files directory is tracked by git\n")
        print(f"✅ Created .gitkeep file: {gitkeep_file}")
    
    # Set proper permissions
    try:
        os.chmod(temp_dir, 0o755)
        print(f"✅ Set permissions for temp_files directory")
    except Exception as e:
        print(f"⚠️  Warning: Could not set permissions: {e}")

if __name__ == "__main__":
    print("🚀 Setting up AI File Cleanup directories...")
    setup_directories()
    print("✅ Setup complete!")
