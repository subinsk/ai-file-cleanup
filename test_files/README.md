# Test Files for AI File Management System

This directory contains test files for testing the AI File Management System's duplicate detection and cleanup functionality.

## Directory Structure

```
test_files/
├── documents/
│   ├── readme.txt                    # Original file
│   ├── readme_copy.txt              # Exact duplicate of readme.txt
│   ├── notes.txt                    # Original meeting notes
│   ├── notes_backup.txt             # Exact duplicate of notes.txt
│   ├── similar_notes.txt            # Similar but not identical to notes.txt
│   └── subfolder/
│       ├── config.json              # Original config file
│       └── config_backup.json       # Exact duplicate of config.json
├── code/
│   ├── main.py                      # Original Python file
│   ├── main_copy.py                 # Exact duplicate of main.py
│   ├── utils.py                     # Original utility file
│   └── utils_backup.py              # Exact duplicate of utils.py
├── images/
│   ├── photo1.jpg                   # Original image
│   ├── photo1_copy.jpg              # Exact duplicate of photo1.jpg
│   └── photo2.png                   # Different image (not a duplicate)
├── backups/
│   ├── backup_2024-01-15.zip        # Original backup file
│   └── backup_2024-01-15_copy.zip   # Exact duplicate of backup file
├── temp/
│   ├── temp_file1.tmp               # Original temp file
│   └── temp_file1_copy.tmp          # Exact duplicate of temp file
└── README.md                        # This file
```

## Expected Duplicate Groups

The system should detect the following duplicate groups:

1. **Text Documents:**
   - `documents/readme.txt` ↔ `documents/readme_copy.txt`
   - `documents/notes.txt` ↔ `documents/notes_backup.txt`
   - `documents/subfolder/config.json` ↔ `documents/subfolder/config_backup.json`

2. **Code Files:**
   - `code/main.py` ↔ `code/main_copy.py`
   - `code/utils.py` ↔ `code/utils_backup.py`

3. **Image Files:**
   - `images/photo1.jpg` ↔ `images/photo1_copy.jpg`

4. **Backup Files:**
   - `backups/backup_2024-01-15.zip` ↔ `backups/backup_2024-01-15_copy.zip`

5. **Temporary Files:**
   - `temp/temp_file1.tmp` ↔ `temp/temp_file1_copy.tmp`

## Files That Should NOT Be Duplicates

- `documents/similar_notes.txt` (similar but not identical to notes.txt)
- `images/photo2.png` (different content from photo1.jpg)

## Testing Instructions

1. **Start the AI File Management System**
2. **Navigate to the web interface** (http://localhost:3000)
3. **Enter the test directory path:** `D:\projects\ai-file-cleanup\test_files`
4. **Start a scan** and observe the duplicate detection
5. **Review the detected duplicates** in the dashboard
6. **Test cleanup operations** (use dry-run mode first)

## File Types Included

- **Text files:** .txt, .md
- **Code files:** .py, .json
- **Image files:** .jpg, .png (simulated)
- **Archive files:** .zip (simulated)
- **Temporary files:** .tmp

## Space Analysis

Each duplicate group represents wasted storage space. The system should calculate:
- Total files scanned
- Duplicate groups found
- Space wasted by duplicates
- Potential space savings after cleanup

This test dataset provides a comprehensive way to validate the AI File Management System's capabilities.
