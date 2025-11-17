# Desktop Application Build & Distribution Guide

This guide explains how to build the Windows installer and make it available for download through the web application.

## Building the Windows Installer

### Prerequisites

- Node.js 18+ and pnpm installed
- Windows OS (or use a Windows VM/CI for building)
- All dependencies installed: `pnpm install`

### Build Commands

```bash
# Navigate to desktop app directory
cd apps/desktop

# Build for Windows (creates both NSIS installer and portable version)
pnpm run package:win

# Build for specific formats
pnpm run package        # All platforms
pnpm run package:mac    # macOS only
pnpm run package:linux  # Linux only
```

### Build Outputs

After running `pnpm run package:win`, the following files will be created in `apps/desktop/dist-package/`:

1. **AI File Cleanup-Setup-1.0.0.exe** - NSIS installer (recommended)
   - Full installation wizard
   - Creates Start Menu and Desktop shortcuts
   - Includes uninstaller
   - ~150 MB

2. **AI File Cleanup 1.0.0.exe** - Portable version
   - No installation required
   - Can run from any location
   - ~150 MB

## Making Installers Available for Download

### Option 1: Local Development/Testing

For local testing, copy the built installers to the web app's public directory:

```bash
# From project root
cp "apps/desktop/dist-package/AI File Cleanup-Setup-1.0.0.exe" "apps/web/public/downloads/AI-File-Cleanup-Setup-1.0.0.exe"
cp "apps/desktop/dist-package/AI File Cleanup 1.0.0.exe" "apps/web/public/downloads/AI-File-Cleanup-1.0.0-Portable.exe"

# Create ZIP archive (optional)
cd apps/desktop/dist-package
powershell Compress-Archive -Path "AI File Cleanup 1.0.0.exe" -DestinationPath "AI-File-Cleanup-1.0.0-win.zip"
cp AI-File-Cleanup-1.0.0-win.zip ../../web/public/downloads/
```

Then start the web app:

```bash
cd apps/web
pnpm dev
```

Visit http://localhost:3000/download to test the download links.

### Option 2: Production Deployment (Recommended)

For production, host the installers on a CDN or file hosting service. **GitHub Releases is the recommended free solution** that provides unlimited bandwidth, global CDN distribution, and is the industry standard for open-source desktop applications.

#### GitHub Releases (Recommended)

**Step 1: Build the Installers**

```bash
cd apps/desktop
pnpm run package:win
```

The installers will be created in `apps/desktop/dist-package/`:

- `AI File Cleanup-Setup-1.0.0.exe` (NSIS installer)
- `AI File Cleanup-1.0.0.msi` (MSI installer)
- `AI File Cleanup 1.0.0.exe` (Portable version)

**Step 2: Prepare Files for Upload**

Rename files to use hyphens instead of spaces for better URL compatibility:

```bash
cd apps/desktop/dist-package

# Rename files (if needed)
# The NSIS installer may already be named correctly
# Otherwise, rename to:
# - AI-File-Cleanup-1.0.0.exe
# - AI-File-Cleanup-1.0.0.msi
# - AI-File-Cleanup-1.0.0-Portable.exe

# Create ZIP archive (optional but recommended)
powershell Compress-Archive -Path "AI File Cleanup 1.0.0.exe" -DestinationPath "AI-File-Cleanup-1.0.0-win.zip"
```

**Step 3: Create a GitHub Release**

1. Go to your GitHub repository: `https://github.com/subinsk/ai-file-cleanup`
2. Click on **"Releases"** in the right sidebar
3. Click **"Draft a new release"**
4. Fill in the release details:
   - **Tag version**: `v1.0.0` (must start with 'v')
   - **Release title**: `v1.0.0 - Initial Release`
   - **Description**: Add release notes describing features and changes
5. **Upload installer files** by dragging them into the "Attach binaries" section:
   - `AI-File-Cleanup-1.0.0.exe` (NSIS installer)
   - `AI-File-Cleanup-1.0.0.msi` (MSI installer)
   - `AI-File-Cleanup-1.0.0-Portable.exe` (Portable version)
   - `AI-File-Cleanup-1.0.0-win.zip` (ZIP archive)
6. Click **"Publish release"**

**Step 4: Get Download URLs**

After publishing, your files will be available at:

```
https://github.com/subinsk/ai-file-cleanup/releases/download/v1.0.0/AI-File-Cleanup-1.0.0.exe
https://github.com/subinsk/ai-file-cleanup/releases/download/v1.0.0/AI-File-Cleanup-1.0.0.msi
https://github.com/subinsk/ai-file-cleanup/releases/download/v1.0.0/AI-File-Cleanup-1.0.0-Portable.exe
https://github.com/subinsk/ai-file-cleanup/releases/download/v1.0.0/AI-File-Cleanup-1.0.0-win.zip
```

**Step 5: Update Download Page**

The download page (`apps/web/src/app/download/page.tsx`) is already configured to use GitHub Releases URLs. When you create the release with the correct file names, the downloads will work automatically.

**Why GitHub Releases?**

✅ **Free**: Unlimited bandwidth and storage for releases  
✅ **Global CDN**: GitHub automatically distributes files worldwide  
✅ **Version Control**: Easy to manage multiple versions  
✅ **Industry Standard**: Used by major projects (VS Code, Electron, etc.)  
✅ **No Serverless Limits**: Bypasses Vercel's 50 MB function size limit  
✅ **Reliable**: GitHub's infrastructure handles high traffic  
✅ **Simple**: No additional accounts or configuration needed

#### Alternative Options

**AWS S3 + CloudFront**

- Upload installers to S3 bucket
- Configure CloudFront distribution for fast global downloads
- Update URLs in download page to CloudFront URLs
- Cost: ~$0.01-$0.10 per GB after free tier

**Cloudflare R2**

- Similar to S3 but with free egress bandwidth
- Upload files to R2 bucket
- Use Cloudflare CDN for distribution
- Cost: Free tier includes 10 GB/month storage

**Other Options**

- Azure Blob Storage + CDN
- DigitalOcean Spaces
- Vercel Blob Storage (limited free tier)

### Important Notes for Vercel Deployment

⚠️ **Do NOT serve large installer files through Vercel serverless functions or API routes:**

- Vercel has a 50 MB response size limit for serverless functions
- Large files (80-150 MB installers) will cause "Internal Server Error"
- Always use external hosting like GitHub Releases for installer files

The previous API route approach (`/api/download/[filename]`) has been removed because it's incompatible with Vercel's serverless architecture.

## Version Updates

When releasing a new version:

1. **Update version in `apps/desktop/package.json`:**

   ```json
   {
     "version": "1.1.0"
   }
   ```

2. **Rebuild the installers:**

   ```bash
   cd apps/desktop
   pnpm run package:win
   ```

3. **Create a new GitHub Release:**
   - Go to https://github.com/subinsk/ai-file-cleanup/releases
   - Click "Draft a new release"
   - Use tag version: `v1.1.0`
   - Upload the new installer files
   - Add release notes describing what's new
   - Publish the release

4. **Update download page (`apps/web/src/app/download/page.tsx`):**
   - Update version numbers displayed to users (line 38)
   - Update download URLs to point to new version (v1.1.0)
   - Update release notes section (lines 264-302)

   Example URL changes:

   ```tsx
   // From:
   href =
     'https://github.com/subinsk/ai-file-cleanup/releases/download/v1.0.0/AI-File-Cleanup-1.0.0.exe';

   // To:
   href =
     'https://github.com/subinsk/ai-file-cleanup/releases/download/v1.1.0/AI-File-Cleanup-1.1.0.exe';
   ```

5. **Test the download links** before announcing the release

## Code Signing (Recommended for Production)

To prevent Windows SmartScreen warnings, sign your installers:

1. Obtain a code signing certificate (e.g., from DigiCert, Sectigo)

2. Configure electron-builder in `apps/desktop/package.json`:

   ```json
   "win": {
     "certificateFile": "path/to/cert.pfx",
     "certificatePassword": "your-password",
     "signingHashAlgorithms": ["sha256"]
   }
   ```

3. Or use environment variables:
   ```bash
   export CSC_LINK=path/to/cert.pfx
   export CSC_KEY_PASSWORD=your-password
   pnpm run package:win
   ```

## Automated Builds (CI/CD)

Consider setting up automated builds using GitHub Actions. See `.github/workflows/ci-cd.yml` for the existing CI/CD configuration.

To add release builds:

1. Trigger builds on version tags
2. Upload build artifacts to GitHub Releases automatically
3. Notify users of new versions

## File Integrity

For production deployments, generate and publish checksums:

```bash
# Generate SHA256 checksums
certutil -hashfile "AI File Cleanup-Setup-1.0.0.exe" SHA256
```

Display these checksums on the download page so users can verify file integrity.

## Support

For issues with building or deploying, check:

- [electron-builder documentation](https://www.electron.build/)
- [NSIS documentation](https://nsis.sourceforge.io/)
- Project issues on GitHub
