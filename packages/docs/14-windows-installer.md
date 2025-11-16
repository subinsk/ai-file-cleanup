# Windows Installer Configuration Guide

## Overview

This guide explains the Windows installer setup for the AI File Cleanup desktop application using electron-builder and NSIS (Nullsoft Scriptable Install System).

---

## Prerequisites

### Software Requirements

1. **Node.js 18+** - Required for building the application
2. **pnpm 8+** - Package manager
3. **Windows 10/11** - For building Windows installers
4. **NSIS 3.x** (Optional) - electron-builder includes it, but you can install separately

### Optional for Code Signing

- **Code Signing Certificate** - For production releases
- **Windows SDK** - For SignTool.exe (code signing utility)

---

## Configuration

### package.json Configuration

The `apps/desktop/package.json` includes comprehensive electron-builder configuration:

```json
{
  "build": {
    "appId": "com.aicleanup.desktop",
    "productName": "AI File Cleanup",
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ],
      "icon": "assets/icon.ico",
      "requestedExecutionLevel": "asInvoker",
      "artifactName": "${productName}-Setup-${version}.${ext}",
      "publisherName": "AI File Cleanup Team"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "allowElevation": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "perMachine": false,
      "license": "LICENSE.txt",
      "include": "installer.nsh"
    }
  }
}
```

### Key Configuration Options

#### Windows Target (`win`)

- **target**: Build both NSIS installer and portable executable
- **arch**: Support both 64-bit (x64) and 32-bit (ia32) architectures
- **icon**: Path to application icon (.ico format)
- **requestedExecutionLevel**: "asInvoker" (no admin required)
- **artifactName**: Output filename pattern
- **publisherName**: Company/team name

#### NSIS Options (`nsis`)

- **oneClick**: false - Allow user to customize installation
- **allowToChangeInstallationDirectory**: true - User can choose install path
- **allowElevation**: true - Can request admin if needed
- **createDesktopShortcut**: true - Add desktop shortcut
- **createStartMenuShortcut**: true - Add Start Menu shortcut
- **perMachine**: false - Install for current user only (no admin required)
- **deleteAppDataOnUninstall**: false - Keep user data on uninstall
- **runAfterFinish**: true - Launch app after installation
- **license**: "LICENSE.txt" - Show license agreement during install
- **include**: "installer.nsh" - Custom NSIS script for advanced options

---

## Building Installers

### 1. Prepare Assets

Create icon files in `apps/desktop/assets/`:

```
apps/desktop/assets/
├── icon.ico          # Windows icon (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
├── icon.icns         # macOS icon (for future)
└── icon.png          # Linux icon (512x512 PNG)
```

### 2. Build Application

```bash
cd apps/desktop

# Build the Electron app
pnpm build

# This compiles:
# - Renderer process (React app) → dist/
# - Main process (Electron) → dist/electron/
```

### 3. Package for Windows

#### NSIS Installer (Recommended)

```bash
# Build NSIS installer for Windows
pnpm package:win

# Output: dist-package/AI File Cleanup-Setup-1.0.0.exe
```

#### Portable Executable

The configuration also creates a portable version:

```bash
# Same command creates both
pnpm package:win

# Output:
# - dist-package/AI File Cleanup-Setup-1.0.0.exe (NSIS)
# - dist-package/AI File Cleanup-1.0.0-win.exe (Portable)
```

#### All Platforms

```bash
# Build for all platforms (requires appropriate OS)
pnpm package

# Output:
# - Windows: .exe
# - macOS: .dmg
# - Linux: .AppImage
```

---

## Installer Types

### 1. NSIS Installer (.exe)

**Features:**

- ✅ Customizable installation path
- ✅ Desktop and Start Menu shortcuts
- ✅ Uninstaller included
- ✅ Add/Remove Programs entry
- ✅ Per-user installation (no admin)
- ✅ License agreement screen
- ✅ Custom install pages

**Default Install Location:**

```
C:\Users\<Username>\AppData\Local\Programs\AI File Cleanup\
```

**User Data Location:**

```
C:\Users\<Username>\AppData\Roaming\AI File Cleanup\
```

### 2. Portable Executable (.exe)

**Features:**

- ✅ Single executable file
- ✅ No installation required
- ✅ Run from USB drive
- ✅ No registry changes
- ✅ User data in same directory

**Usage:**

- Download and run directly
- No installation wizard
- Perfect for testing or portable use

### 3. MSI Installer (Future)

**Configuration in package.json:**

```json
"msi": {
  "oneClick": false,
  "createDesktopShortcut": true,
  "perMachine": false,
  "upgradeCode": "a3e4f5c6-1234-5678-90ab-cdef12345678"
}
```

**To Build:**

```bash
# Add msi to target
electron-builder --win msi
```

---

## Custom NSIS Script

The `installer.nsh` file allows advanced customization:

### Features Implemented

1. **Custom Installation Steps**
   - Create application data directory
   - Set proper permissions
   - Write registry keys

2. **Uninstall Cleanup**
   - Remove registry keys
   - Clean up shortcuts
   - Optional: Remove user data

3. **Add/Remove Programs Integration**
   - Display name
   - Version information
   - Publisher details
   - Uninstall link

### Customization Examples

#### Add File Association

```nsis
!macro customInstall
  ; Associate .cleanup files with the app
  WriteRegStr HKCR ".cleanup" "" "AIFileCleanup.File"
  WriteRegStr HKCR "AIFileCleanup.File" "" "AI File Cleanup Project"
  WriteRegStr HKCR "AIFileCleanup.File\DefaultIcon" "" "$INSTDIR\AI File Cleanup.exe,0"
  WriteRegStr HKCR "AIFileCleanup.File\shell\open\command" "" '"$INSTDIR\AI File Cleanup.exe" "%1"'
!macroend
```

#### Custom Installer Pages

```nsis
!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
  ; Add custom text
!macroend
```

---

## Code Signing (Production)

### Why Code Sign?

- ✅ Removes "Unknown Publisher" warnings
- ✅ Builds user trust
- ✅ Required for some enterprise deployments
- ✅ Prevents Windows SmartScreen warnings

### How to Code Sign

1. **Obtain Certificate**
   - Purchase from DigiCert, Sectigo, etc.
   - Cost: ~$200-400/year
   - Requires company verification

2. **Configure electron-builder**

```json
{
  "win": {
    "certificateFile": "path/to/certificate.pfx",
    "certificatePassword": "password",
    "signingHashAlgorithms": ["sha256"],
    "signDlls": true
  }
}
```

3. **Use Environment Variables (Recommended)**

```bash
# Windows
set CSC_LINK=C:\path\to\certificate.pfx
set CSC_KEY_PASSWORD=your_password

# Linux/macOS
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password

# Then build
pnpm package:win
```

4. **Build with Signing**

```bash
# electron-builder will automatically sign during build
pnpm package:win
```

---

## Testing Installers

### 1. Test Installation

```bash
# Run the installer
AI File Cleanup-Setup-1.0.0.exe

# Follow installation wizard
# - Choose installation directory
# - Accept license
# - Select shortcuts
# - Complete installation
```

### 2. Verify Installation

Check these locations:

```
✅ Executable: C:\Users\<User>\AppData\Local\Programs\AI File Cleanup\
✅ Desktop Shortcut: C:\Users\<User>\Desktop\AI File Cleanup.lnk
✅ Start Menu: C:\Users\<User>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\AI File Cleanup\
✅ Registry: HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\AI File Cleanup
```

### 3. Test Functionality

- ✅ Launch application
- ✅ Activate license key
- ✅ Scan directory
- ✅ Find duplicates
- ✅ Move to trash

### 4. Test Uninstallation

```bash
# Via Add/Remove Programs
# Or run uninstaller directly:
"C:\Users\<User>\AppData\Local\Programs\AI File Cleanup\Uninstall AI File Cleanup.exe"
```

### 5. Verify Cleanup

After uninstall, check:

```
✅ Executable removed
✅ Desktop shortcut removed
✅ Start Menu entry removed
✅ Registry keys removed
❓ User data (should remain unless user chose to delete)
```

---

## Troubleshooting

### Issue: "Unknown Publisher" Warning

**Problem:** Windows SmartScreen blocks installation

**Solution:**

1. Click "More info"
2. Click "Run anyway"
3. **OR** Code sign the application (production)

### Issue: Antivirus False Positive

**Problem:** Antivirus flags the installer

**Solution:**

1. Add exception in antivirus
2. Upload installer to antivirus vendors
3. Code sign the application
4. Use electron-builder's antivirus optimization

### Issue: Icon Not Showing

**Problem:** Application icon doesn't display

**Solution:**

1. Ensure icon.ico exists at `apps/desktop/assets/icon.ico`
2. ICO should contain multiple sizes (16, 32, 48, 64, 128, 256)
3. Rebuild with `pnpm build && pnpm package:win`
4. Clear icon cache: `ie4uinit.exe -show`

### Issue: Installation Fails

**Problem:** Installer crashes or fails

**Solution:**

1. Check logs in `%TEMP%\AI File Cleanup Setup Log.txt`
2. Ensure no previous version running
3. Try portable version first
4. Run installer as administrator (if needed)

### Issue: Application Won't Start

**Problem:** Application crashes on launch

**Solution:**

1. Check Event Viewer for errors
2. Verify all dependencies included
3. Test with portable version
4. Check for antivirus interference

---

## Distribution

### 1. Local Distribution

**For testing/demo:**

```bash
# Build installer
pnpm package:win

# Share the .exe file
# Users double-click to install
```

### 2. GitHub Releases

```bash
# Tag release
git tag v1.0.0
git push origin v1.0.0

# Upload installer to GitHub Releases
# Users download from Releases page
```

### 3. Website Download

- Host .exe on website
- Provide download link
- Include installation instructions
- List system requirements

### 4. Auto-Update (Future)

electron-builder supports auto-update:

```json
{
  "publish": [
    {
      "provider": "github",
      "owner": "your-username",
      "repo": "ai-file-cleanup"
    }
  ]
}
```

```javascript
// In main process
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();
```

---

## Installer Size Optimization

### Current Size Estimate

- **Uncompressed:** ~150-200 MB
- **Compressed (NSIS):** ~60-80 MB

### Optimization Techniques

1. **Exclude Dev Dependencies**

   ```json
   "files": [
     "dist/**/*",
     "!node_modules/**/*"
   ]
   ```

2. **Use ASAR Archive**

   ```json
   "asar": true
   ```

3. **Tree Shaking**
   - Ensure proper imports (not `import *`)
   - Use production builds

4. **External Dependencies**
   - Move large dependencies to external downloads
   - Download on first run

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Windows Installer

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build application
        run: |
          cd apps/desktop
          pnpm build
          pnpm package:win

      - name: Upload installer
        uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: apps/desktop/dist-package/*.exe

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: apps/desktop/dist-package/*.exe
```

---

## Best Practices

### Do's ✅

1. **Always test installers** on clean Windows installation
2. **Provide clear installation instructions** in README
3. **Include license agreement** (LICENSE.txt)
4. **Use descriptive filenames** (e.g., `AI-File-Cleanup-Setup-1.0.0.exe`)
5. **Version your releases** consistently
6. **Test both 32-bit and 64-bit** if supporting both
7. **Code sign for production** releases
8. **Create checksums** (SHA256) for downloads
9. **Document system requirements** clearly
10. **Test uninstallation** process

### Don'ts ❌

1. **Don't require admin** unless absolutely necessary
2. **Don't modify system files** unnecessarily
3. **Don't delete user data** on uninstall without permission
4. **Don't bundle unnecessary files** (increases size)
5. **Don't hardcode paths** - use proper directories
6. **Don't skip testing** on different Windows versions
7. **Don't forget to update version** numbers
8. **Don't ignore antivirus** warnings during development

---

## Resources

- [electron-builder Documentation](https://www.electron.build/)
- [NSIS Documentation](https://nsis.sourceforge.io/Docs/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Code Signing Guide](https://www.electron.build/code-signing)

---

**Last Updated:** January 2025  
**Status:** ✅ Ready for Building  
**Platform:** Windows 10/11
