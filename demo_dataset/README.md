# Demo Dataset for AI File Cleanup

This directory contains a comprehensive test dataset for demonstrating the AI File Cleanup system to the professor and stakeholders.

## Dataset Structure

```
demo_dataset/
├── scenario_1_exact_duplicates/     # Exact file copies
├── scenario_2_similar_images/       # Similar but modified images
├── scenario_3_text_similarity/      # Similar text documents
├── scenario_4_pdf_comparison/       # Similar PDF documents
├── scenario_5_mixed_types/          # Mix of all file types
├── edge_cases/                      # Edge cases and error scenarios
└── README.md                        # This file
```

## Scenarios

### Scenario 1: Exact Duplicates (Hash Matching)

**Purpose:** Demonstrate exact duplicate detection using SHA-256 hashing

**Files:**

- `document_original.pdf` (1MB)
- `document_copy.pdf` (exact copy)
- `document_backup.pdf` (exact copy)
- `image_original.jpg` (500KB)
- `image_duplicate.jpg` (exact copy)
- `data_original.txt` (10KB)
- `data_copy.txt` (exact copy)

**Expected Result:**

- 3 duplicate groups
- 100% similarity scores
- Reason: "Exact hash match"

**Instructions:**

1. Upload all files from `scenario_1_exact_duplicates/`
2. System should identify 3 groups of duplicates
3. Show that files are byte-for-byte identical

### Scenario 2: Similar Images (Perceptual Hashing + CLIP)

**Purpose:** Demonstrate AI-powered similar image detection

**Files:**

- `photo_original.jpg` (1920x1080, 2MB)
- `photo_resized.jpg` (1280x720, 1MB) - resized version
- `photo_compressed.jpg` (1920x1080, 500KB) - higher compression
- `photo_cropped.jpg` (1600x900, 1.5MB) - slightly cropped
- `photo_filtered.jpg` (1920x1080, 1.8MB) - minor color adjustment
- `landscape_original.jpg` (3000x2000, 5MB)
- `landscape_edited.jpg` (3000x2000, 4.5MB) - minor edits

**Expected Result:**

- 2 groups of similar images
- 90-98% similarity scores
- Reason: "Similar image (perceptual hash)" or "Similar image (CLIP embedding)"

**Instructions:**

1. Upload all files from `scenario_2_similar_images/`
2. System should detect perceptual similarity
3. Show AI can identify similar content despite modifications

### Scenario 3: Text Similarity (DistilBERT Embeddings)

**Purpose:** Demonstrate text content similarity detection

**Files:**

- `report_v1.txt` - Original report
- `report_v2.txt` - Minor revisions (85-90% similar)
- `report_v3.txt` - Significant revisions (70-80% similar)
- `notes_original.txt` - Meeting notes
- `notes_copy.txt` - Same notes, different formatting
- `readme_original.md` - Documentation
- `readme_updated.md` - Updated documentation (90% similar)

**Expected Result:**

- Multiple groups with varying similarity (70-100%)
- AI identifies semantic similarity even with different wording
- Can distinguish between revisions and different content

**Instructions:**

1. Upload all files from `scenario_3_text_similarity/`
2. Show how AI understands text meaning
3. Demonstrate threshold adjustments (high similarity vs. moderate)

### Scenario 4: PDF Comparison

**Purpose:** Demonstrate PDF text extraction and comparison

**Files:**

- `invoice_original.pdf` - Invoice document
- `invoice_copy.pdf` - Exact copy
- `invoice_modified.pdf` - Same content, different formatting
- `contract_v1.pdf` - Legal contract
- `contract_v2.pdf` - Updated contract (similar content)
- `presentation_original.pdf` - Slide deck
- `presentation_updated.pdf` - Updated slides (80% similar)

**Expected Result:**

- Exact matches for copies
- High similarity for modified versions
- Text extraction working correctly

**Instructions:**

1. Upload all files from `scenario_4_pdf_comparison/`
2. Show PDF text extraction
3. Demonstrate content-based comparison

### Scenario 5: Mixed File Types

**Purpose:** Demonstrate system handling multiple file types simultaneously

**Files:**

- Mix of images, PDFs, and text files
- Various duplicates across different types
- Realistic file organization scenario

**Expected Result:**

- All file types processed correctly
- Appropriate duplicate detection per type
- No cross-type false positives

**Instructions:**

1. Upload all files from `scenario_5_mixed_types/`
2. Show comprehensive analysis
3. Demonstrate real-world usage

### Edge Cases

**Purpose:** Test system robustness and error handling

**Files:**

- `empty_file.txt` - Zero bytes
- `corrupted_image.jpg` - Corrupted image data
- `very_large_file.pdf` - Near size limit (45MB)
- `special_chars_文件名.txt` - Unicode filename
- `no_extension` - File without extension
- `wrong_extension.jpg` - Text file with .jpg extension

**Expected Results:**

- Graceful error handling
- Appropriate error messages
- No system crashes

**Instructions:**

1. Upload files from `edge_cases/` individually
2. Show error handling for each case
3. Demonstrate system robustness

## Creating the Dataset

### 1. Exact Duplicates

```bash
# Create scenario 1 directory
mkdir -p demo_dataset/scenario_1_exact_duplicates
cd demo_dataset/scenario_1_exact_duplicates

# Create original files
echo "This is a sample document for testing exact duplicates." > document_original.txt
echo "Sample data: 1, 2, 3, 4, 5" > data_original.txt

# Create exact copies
cp document_original.txt document_copy.txt
cp document_original.txt document_backup.txt
cp data_original.txt data_copy.txt

# For images and PDFs, copy from test_files or create new ones
```

### 2. Similar Images

You can:

1. Use existing photos
2. Resize using ImageMagick: `convert original.jpg -resize 50% resized.jpg`
3. Compress: `convert original.jpg -quality 50 compressed.jpg`
4. Crop: `convert original.jpg -crop 1600x900+0+0 cropped.jpg`

### 3. Text Variations

```python
# Create variations
original = "This is the original report with specific content."
variation1 = "This is the original report with some modified content."
variation2 = "Here is the updated report with different wording."
```

## Demo Script

### Setup (Before Demo)

1. **Verify** all files are in correct directories
2. **Test** uploading each scenario locally
3. **Take screenshots** of expected results
4. **Prepare** talking points for each scenario

### During Demo

#### Introduction (2 minutes)

- Explain the problem: file duplication wastes storage
- Introduce AI-powered solution
- Overview of scenarios to demonstrate

#### Scenario 1: Exact Duplicates (3 minutes)

1. Upload files from scenario_1
2. Show duplicate detection results
3. Explain SHA-256 hashing
4. Demonstrate file selection and deletion

#### Scenario 2: Similar Images (4 minutes)

1. Upload images from scenario_2
2. Show AI similarity detection
3. Explain perceptual hashing and CLIP
4. Compare similar images side-by-side

#### Scenario 3: Text Similarity (3 minutes)

1. Upload text files from scenario_3
2. Show semantic similarity detection
3. Explain DistilBERT embeddings
4. Demonstrate varying similarity thresholds

#### Scenario 4: PDF Comparison (3 minutes)

1. Upload PDFs from scenario_4
2. Show text extraction
3. Demonstrate content-based comparison
4. Explain PDF processing pipeline

#### Scenario 5: Mixed Types (2 minutes)

1. Upload mixed files from scenario_5
2. Show comprehensive analysis
3. Demonstrate real-world usage

#### Edge Cases (2 minutes)

1. Show error handling
2. Demonstrate robustness
3. Explain validation and security

#### Conclusion (1 minute)

- Summary of capabilities
- Questions and answers

## Performance Metrics

Track during demo:

- Upload time
- Processing time per file
- Duplicate detection accuracy
- Memory usage
- API response times

## Backup Plan

If live demo fails:

1. Have screenshots ready
2. Prepare pre-recorded video
3. Have local demo environment ready
4. Can walk through with slides

## Post-Demo

1. Provide demo dataset to professor
2. Share access to live environment
3. Provide documentation links
4. Schedule follow-up if needed

---

**Note:** This dataset is for demonstration purposes only. For production testing, use real-world data with appropriate size and variety.
