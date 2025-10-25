# Test Files for AI File Cleanup System

This directory contains various test files to verify the deduplication functionality of the AI File Cleanup System.

## Test File Categories

### 1. Exact Duplicates (Should be grouped together)

- `document_original.txt` - Original document
- `document_copy.txt` - Exact copy with different name
- `duplicate_document.txt` - Another exact copy
- `README.txt` - Same content as original document

### 2. Similar Content (Should be grouped with high similarity)

- `document_modified.txt` - Same content with minor modifications
- `report.pdf` - PDF version of similar content
- `report_copy.pdf` - Exact copy of the PDF

### 3. JSON/Config Duplicates

- `data.json` - JSON configuration file
- `data_backup.json` - Exact backup copy
- `config.ini` - Configuration file
- `config_backup.ini` - Exact backup copy

### 4. Unique Files (Should NOT be grouped)

- `different_content.txt` - Completely different content
- `notes.txt` - Meeting notes (different topic)
- `simple_image.txt` - Placeholder for image files
- `image_duplicate.txt` - Placeholder for image duplicates

## Expected Deduplication Results

### Group 1: Document Duplicates

- `document_original.txt`
- `document_copy.txt`
- `duplicate_document.txt`
- `README.txt`
- `document_modified.txt` (high similarity)

### Group 2: PDF Duplicates

- `report.pdf`
- `report_copy.pdf`

### Group 3: JSON Duplicates

- `data.json`
- `data_backup.json`

### Group 4: Config Duplicates

- `config.ini`
- `config_backup.ini`

### Unique Files (No duplicates)

- `different_content.txt`
- `notes.txt`
- `simple_image.txt`
- `image_duplicate.txt`

## Testing Instructions

1. **Upload Test Files**: Use either the web interface or desktop app to upload the entire `test_files` directory
2. **Run Deduplication**: Start the deduplication process
3. **Review Results**: Check that files are properly grouped according to content similarity
4. **Verify Accuracy**: Ensure exact duplicates are grouped together and unique files remain separate

## File Types Tested

- **Text Files**: `.txt` files with various content similarities
- **PDF Files**: `.pdf` files with same content
- **JSON Files**: `.json` configuration files
- **Config Files**: `.ini` configuration files
- **Image Placeholders**: Text files representing image test cases

## Notes

- Image files are represented as text placeholders since we can't create binary files in this environment
- For real image testing, replace the placeholder files with actual image files (JPG, PNG, WebP)
- The system should detect duplicates based on content similarity, not just file names
- Different file extensions with same content should be grouped together
