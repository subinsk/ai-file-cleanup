#!/usr/bin/env python3
"""
AI File Management System - Main Application
"""

import os
import sys
from pathlib import Path

def main():
    """Main application entry point"""
    print("AI File Management System")
    print("=" * 30)
    
    # Get directory to scan
    if len(sys.argv) > 1:
        directory = sys.argv[1]
    else:
        directory = input("Enter directory path: ")
    
    if not os.path.exists(directory):
        print(f"Error: Directory '{directory}' does not exist")
        return 1
    
    print(f"Scanning directory: {directory}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
