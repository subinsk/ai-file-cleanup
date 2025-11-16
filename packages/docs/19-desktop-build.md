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

For production, host the installers on a CDN or file hosting service:

1. **GitHub Releases** (Free, recommended for open-source)
   - Create a new release on GitHub
   - Upload the installer files as release assets
   - Update URLs in `apps/web/src/app/download/page.tsx` to point to GitHub release URLs
   - Example: `https://github.com/yourusername/ai-file-cleanup/releases/download/v1.0.0/AI-File-Cleanup-Setup-1.0.0.exe`

2. **AWS S3 + CloudFront**
   - Upload installers to S3 bucket
   - Configure CloudFront distribution for fast global downloads
   - Update URLs in download page to CloudFront URLs

3. **Cloudflare R2**
   - Similar to S3 but with free egress
   - Upload files to R2 bucket
   - Use Cloudflare CDN for distribution

4. **Other Options**
   - Azure Blob Storage + CDN
   - DigitalOcean Spaces
   - Vercel Blob Storage

### Updating Download URLs

Edit `apps/web/src/app/download/page.tsx` and update the href attributes:

```tsx
// Change from:
href = '/downloads/AI-File-Cleanup-Setup-1.0.0.exe';

// To your production URL:
href = 'https://your-cdn.com/releases/v1.0.0/AI-File-Cleanup-Setup-1.0.0.exe';
```

## Version Updates

When releasing a new version:

1. Update version in `apps/desktop/package.json`:

   ```json
   {
     "version": "1.1.0"
   }
   ```

2. Rebuild the installers:

   ```bash
   cd apps/desktop
   pnpm run package:win
   ```

3. Upload new files to your hosting service

4. Update download page (`apps/web/src/app/download/page.tsx`):
   - Update version numbers displayed to users
   - Update download URLs to point to new version
   - Update release notes section

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
