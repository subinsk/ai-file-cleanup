# AI File Cleanup - User Guide

Welcome to AI File Cleanup! This guide will help you use the web and desktop applications to find and remove duplicate files using AI-powered detection.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Web Application](#web-application)
3. [Desktop Application](#desktop-application)
4. [Understanding Results](#understanding-results)
5. [Best Practices](#best-practices)
6. [FAQ](#faq)
7. [Support](#support)

---

## Getting Started

### What is AI File Cleanup?

AI File Cleanup is an intelligent file deduplication system that uses artificial intelligence to:

- Detect exact duplicate files using SHA-256 hashing
- Find similar images using perceptual hashing and CLIP embeddings
- Identify similar text documents using DistilBERT embeddings
- Compare PDF documents by content
- Safely delete duplicates (moves to trash/recycle bin)

### Which Version Should I Use?

#### Web Application

**Best for:**

- Quick file cleanup sessions
- Access from any device
- Collaboration and sharing
- No installation required

**Access:** https://your-app.vercel.app

#### Desktop Application

**Best for:**

- Processing local files
- Offline operation
- Larger file sets
- Privacy (files stay on your computer)

**Download:** [Download Links]

---

## Web Application

### 1. Creating an Account

1. **Navigate** to the website: https://your-app.vercel.app
2. **Click** "Sign Up" in the top right
3. **Enter** your information:
   - Email address
   - Password (minimum 8 characters, must include uppercase, lowercase, and number)
   - Name (optional)
4. **Click** "Create Account"

**Note:** You'll be automatically logged in after registration.

### 2. Logging In

1. **Navigate** to the website
2. **Click** "Login"
3. **Enter** your email and password
4. **Click** "Log In"

### 3. Uploading Files

#### Method 1: Drag and Drop

1. **Drag** files from your computer directly into the upload area
2. The files will automatically start uploading

#### Method 2: File Picker

1. **Click** "Choose Files" or the upload area
2. **Select** files from your computer
3. **Click** "Open"

**Supported File Types:**

- **Images:** JPG, PNG, GIF, WebP, BMP, TIFF
- **Documents:** PDF
- **Text:** TXT, CSV, MD

**Limits:**

- Maximum 100 files per upload
- Maximum 50MB per file
- Maximum 500MB total per upload
- 1GB total storage per user

### 4. Reviewing Duplicates

After upload completes, you'll see:

#### Duplicate Groups

Each group shows:

- **Keep File:** The file that will be kept (usually the first one uploaded)
- **Duplicate Files:** Files that match or are similar
- **Similarity Score:** How similar the files are (100% = exact match)
- **Reason:** Why files are considered duplicates
- **Space Saved:** How much space you'll save by deleting duplicates

#### File Information

For each file:

- Filename
- File size
- Upload date
- Preview (for images)

### 5. Managing Duplicates

#### Keep a Different File

1. **Click** the radio button next to the file you want to keep
2. The selection updates automatically

#### Exclude a File

1. **Click** the checkbox to uncheck files you want to keep
2. Unchecked files won't be deleted

#### Download Cleaned Files

1. **Review** your selections
2. **Click** "Download Cleaned Files"
3. A ZIP file with your kept files will download

#### Delete Duplicates

**Note:** This permanently deletes files from the server.

1. **Review** your selections carefully
2. **Click** "Delete Duplicates"
3. **Confirm** the action
4. Duplicates will be removed

### 6. Checking Your Quota

1. **Click** your profile icon in the top right
2. **Select** "Quota" or "Storage"
3. You'll see:
   - Storage used / Storage limit
   - Number of uploads
   - Number of files
   - Storage percentage

### 7. Logging Out

1. **Click** your profile icon
2. **Select** "Logout"

---

## Desktop Application

### 1. Installation

#### Windows

1. **Download** `AI-File-Cleanup-Setup.exe`
2. **Run** the installer
3. **Follow** installation wizard
4. **Launch** from Start Menu or desktop shortcut

#### macOS

1. **Download** `AI-File-Cleanup.dmg`
2. **Open** the DMG file
3. **Drag** app to Applications folder
4. **Launch** from Applications

#### Linux

1. **Download** `AI-File-Cleanup.AppImage`
2. **Make executable:** `chmod +x AI-File-Cleanup.AppImage`
3. **Run:** `./AI-File-Cleanup.AppImage`

### 2. First Time Setup

#### Enter License Key

1. **Launch** the application
2. **Enter** your license key (provided with download or from web app)
3. **Click** "Activate"

#### Login (Optional)

You can use the desktop app without logging in, but logging in syncs your settings and quota.

### 3. Scanning Local Directories

#### Select Directory

1. **Click** "Select Folder" or "Scan Directory"
2. **Browse** to the folder you want to scan
3. **Click** "Select Folder"

The app will scan for supported files:

- Images (JPG, PNG, GIF, WebP, BMP, TIFF)
- PDFs
- Text files (TXT, CSV, MD)

#### View Scan Results

After scanning, you'll see:

- Total files found
- File types breakdown
- Total size

### 4. Finding Duplicates

1. **Click** "Find Duplicates" after scanning
2. The app will:
   - Calculate file hashes
   - Generate AI embeddings (sent to server)
   - Group similar files
   - Show results

**Progress Indicators:**

- Processing: Analyzing files
- Generating Embeddings: Creating AI representations
- Finding Groups: Identifying duplicates

### 5. Reviewing Results

Similar to the web app, you'll see duplicate groups with:

- Keep file (highlighted)
- Duplicate files
- Similarity scores
- Space savings

### 6. Deleting Duplicates

**Important:** Desktop app moves files to your system's trash/recycle bin, not permanent deletion.

1. **Review** selections
2. **Click** "Move to Trash"
3. **Confirm** the action
4. Files are moved to:
   - Windows: Recycle Bin
   - macOS: Trash
   - Linux: Trash

**You can restore files from trash if needed!**

### 7. Offline Mode

The desktop app can work offline for:

- Directory scanning
- Exact duplicate detection (hash matching)
- File operations

**Requires Internet for:**

- AI similarity detection (embeddings)
- License validation
- Syncing with web account

### 8. Settings

Access settings from the menu:

#### General

- Theme (Light/Dark/System)
- Language
- Auto-update

#### Privacy

- Anonymous usage statistics
- Crash reporting

#### Advanced

- API endpoint (for enterprise users)
- Cache size
- Processing threads

---

## Understanding Results

### Duplicate Detection Methods

#### 1. Exact Hash Match (100% Similarity)

**Method:** SHA-256 hash comparison  
**Meaning:** Files are identical byte-for-byte  
**Use Case:** Exact copies, file backups

**Example:**

```
document.pdf (Keep)
document_copy.pdf (Duplicate) - 100% match
```

#### 2. Similar Images (90-99% Similarity)

**Method:** Perceptual hashing + CLIP embeddings  
**Meaning:** Images look very similar but may have different:

- Resolution
- Compression
- Minor edits
- Metadata

**Example:**

```
photo.jpg (Keep) - 1920x1080
photo_resized.jpg (Duplicate) - 95% match - 1280x720
```

#### 3. Similar Text (85-99% Similarity)

**Method:** DistilBERT text embeddings  
**Meaning:** Documents have similar content but may differ in:

- Formatting
- Minor wording changes
- Version differences

**Example:**

```
report_v1.txt (Keep)
report_v2.txt (Duplicate) - 92% match - slightly updated
```

### Keep File Selection

The app automatically selects which file to keep based on:

1. **Filename** (shorter names preferred)
2. **Date** (older files preferred as "originals")
3. **Size** (larger files preferred for images)
4. **Quality** (higher resolution preferred for images)

**You can always change the selection!**

### Space Savings

Shows total storage you'll save:

- Individual file sizes
- Group totals
- Overall total

**Example:**

```
Group 1: 5 duplicates = 25MB saved
Group 2: 3 duplicates = 12MB saved
Total: 37MB saved
```

---

## Best Practices

### Before You Start

1. **Backup Important Files**
   - Always keep backups of important data
   - Desktop app uses trash (recoverable), but be careful

2. **Close Other Applications**
   - Ensures files aren't locked by other programs
   - Provides better performance

3. **Use Specific Folders**
   - Scan specific directories rather than entire drives
   - Reduces processing time

### During Duplicate Review

1. **Check Similarity Scores**
   - 100%: Safe to delete (exact copies)
   - 95-99%: Review carefully (likely duplicates)
   - 85-94%: Verify manually (may be different versions)

2. **Preview Files**
   - Click files to view preview
   - Compare side-by-side before deleting

3. **Start Small**
   - Test with a small folder first
   - Get comfortable with the process

### After Deletion

1. **Verify Results**
   - Check that correct files remain
   - Restore from trash if needed

2. **Empty Trash**
   - After confirming results, empty trash to free space
   - Windows: Right-click Recycle Bin → Empty
   - macOS: Finder → Empty Trash

3. **Regular Cleanup**
   - Schedule regular scans (monthly/quarterly)
   - Prevents duplicate accumulation

---

## FAQ

### General Questions

**Q: Is my data safe?**  
A: Yes! Web app: files stored securely on server, deleted after processing. Desktop app: files never leave your computer (except for AI analysis).

**Q: Can I recover deleted files?**  
A: Desktop app: Yes, from system trash. Web app: No, deletions are permanent.

**Q: How accurate is the AI detection?**  
A: Very accurate! Exact matches: 100%. Similar files: 85-99% accuracy depending on content.

**Q: Do I need internet?**  
A: Web app: Yes. Desktop app: Only for AI similarity detection.

### Web App Questions

**Q: How long are files stored?**  
A: Files are automatically deleted after 30 days or when you delete them.

**Q: What's my storage limit?**  
A: Free accounts: 1GB. Check your account for details.

**Q: Can I share results?**  
A: Currently not supported. Export as ZIP and share manually.

### Desktop App Questions

**Q: Do files go to the server?**  
A: File content: No. Only AI embeddings (mathematical representations) are sent.

**Q: Can I use without a license?**  
A: Free trial available. Contact us for license.

**Q: Which OS is supported?**  
A: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+, Fedora 35+)

### Technical Questions

**Q: Which file types are supported?**  
A: Images (JPG, PNG, GIF, WebP, BMP, TIFF), PDF, Text (TXT, CSV, MD)

**Q: What's the file size limit?**  
A: Web: 50MB per file. Desktop: No hard limit (but processing may be slow for very large files)

**Q: How does AI detection work?**  
A: Uses DistilBERT for text, CLIP for images, perceptual hashing for image similarity.

**Q: Can it detect similar videos?**  
A: Not currently supported. Only images, PDFs, and text.

---

## Troubleshooting

### Web App Issues

**Problem:** Upload fails  
**Solution:** Check file size (<50MB), file type, and internet connection

**Problem:** Can't see duplicates  
**Solution:** Wait for processing to complete, refresh page

**Problem:** "Quota exceeded" error  
**Solution:** Delete old uploads or upgrade account

### Desktop App Issues

**Problem:** License validation fails  
**Solution:** Check internet connection, verify license key, contact support

**Problem:** Scan finds no files  
**Solution:** Verify folder permissions, check file types, try different folder

**Problem:** "Processing failed" error  
**Solution:** Check internet for AI detection, restart app, try smaller file set

### General Issues

**Problem:** Slow processing  
**Solution:** Reduce file count, check internet speed, close other apps

**Problem:** Results seem wrong  
**Solution:** Review similarity scores, verify file content, report if AI error

---

## Support

### Need Help?

- **Email:** support@aifilecleanup.com
- **Documentation:** https://docs.aifilecleanup.com
- **GitHub Issues:** https://github.com/yourrepo/issues
- **FAQ:** https://aifilecleanup.com/faq

### Reporting Bugs

Please include:

1. What you were trying to do
2. What happened instead
3. Error messages (if any)
4. Browser/OS version
5. Screenshots (if helpful)

### Feature Requests

We love feedback! Submit ideas:

- GitHub Discussions
- Feature request form
- Email suggestions

---

## Privacy & Security

### Data Collection

**Web App:**

- Account information (email, name)
- Uploaded files (temporary, deleted after 30 days)
- Usage statistics (anonymous)

**Desktop App:**

- License information
- Anonymous usage statistics (opt-out available)
- Crash reports (opt-out available)

### Data Processing

- AI embeddings generated on secure servers
- Files encrypted in transit (HTTPS)
- No third-party sharing
- Comply with GDPR/privacy laws

### Your Rights

- Access your data
- Delete your account and data
- Export your data
- Opt-out of analytics

See our [Privacy Policy] for details.

---

## Tips & Tricks

1. **Use consistent naming:** Makes it easier to identify duplicates
2. **Organize before scanning:** Clean folder structure = better results
3. **Review before deleting:** Always check similarity scores
4. **Start with photos:** Usually the biggest space savings
5. **Schedule regular cleanups:** Prevent duplicate buildup
6. **Use desktop for large sets:** Better performance for 100+ files
7. **Check trash before emptying:** Give yourself time to verify
8. **Export cleaned files:** Keep a backup of final set

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**For more help, visit:** https://docs.aifilecleanup.com
