# @ai-cleanup/desktop

Electron desktop application for local file deduplication with AI-powered similarity detection.

## Features

- 🔑 **License Activation** - Validate license key before use
- 📁 **Directory Scanner** - Scan local folders with fast-glob
- 🔍 **Smart Detection** - AI-powered duplicate detection
- 📊 **Review Interface** - Browse and select duplicates
- 🗑️ **Recycle Bin** - Safe file deletion to Recycle Bin/Trash

## Tech Stack

- **Framework:** Electron 28
- **Renderer:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** @ai-cleanup/ui
- **State Management:** Zustand
- **File Operations:** fast-glob, trash
- **Build Tool:** Electron Builder

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Backend API running (for license validation)

### Development

```bash
# Install dependencies (from project root)
pnpm install

# Start development mode
pnpm --filter @ai-cleanup/desktop dev

# This will start:
# 1. Vite dev server (React app)
# 2. Electron app (loads React from Vite)
```

### Building

```bash
# Build for production
pnpm --filter @ai-cleanup/desktop build

# Package for Windows
pnpm --filter @ai-cleanup/desktop package:win

# Package for macOS
pnpm --filter @ai-cleanup/desktop package:mac

# Package for Linux
pnpm --filter @ai-cleanup/desktop package:linux
```

## Project Structure

```
apps/desktop/
├── electron/                   # Electron main process
│   ├── main.ts                 # Main process (IPC handlers)
│   └── preload.ts              # Preload script (context bridge)
├── src/                        # React renderer
│   ├── pages/                  # Application pages
│   │   ├── LicensePage.tsx     # License validation
│   │   ├── ScanPage.tsx        # Directory scanning
│   │   └── ReviewPage.tsx      # Duplicate review
│   ├── lib/                    # Utilities
│   │   └── store.ts            # Zustand stores
│   ├── types/                  # TypeScript definitions
│   │   └── electron.d.ts       # Electron API types
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # React entry point
│   └── index.css               # Global styles
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript (renderer)
├── tsconfig.electron.json      # TypeScript (main process)
└── package.json                # Dependencies & scripts
```

## Features

### License Activation
- Validates license key with backend API
- Stores validated license in localStorage
- Auto-validates on startup

### Directory Scanner
- Select any folder on your computer
- Scans for images, PDFs, and text files
- Uses fast-glob for efficient file discovery
- Shows file count and total size

### Duplicate Detection
- Computes file hashes locally
- Sends to backend for AI similarity analysis
- Groups similar files together
- Shows similarity scores and reasons

### Review Interface
- Expandable duplicate groups
- Visual file cards with metadata
- Select/deselect duplicates
- Move to Recycle Bin safely

### Recycle Bin Integration
- Uses `trash` npm package
- Cross-platform support
- Safe deletion (files can be recovered)
- Batch file deletion

## IPC Communication

The desktop app uses Electron IPC for communication between renderer and main process:

### Dialog APIs
- `selectDirectory()` - Open folder picker

### File Operations
- `scanDirectory(path)` - Scan folder for files
- `readFile(path)` - Read file contents
- `moveToTrash(paths)` - Move files to trash

### License APIs
- `validateLicense(key)` - Validate license with API

### Dedupe APIs
- `getDedupePreview(data)` - Get duplicate analysis

## Security

### Content Security Policy
- Restricts resource loading
- Prevents XSS attacks
- Safe script execution

### Context Isolation
- Renderer process isolated from Node.js
- IPC communication via preload script
- No direct Node.js access in renderer

### Secure IPC
- Type-safe IPC handlers
- Input validation
- Error handling

## Supported File Types

- **Images:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **Documents:** `.pdf`
- **Text:** `.txt`

## Build Configuration

### Windows
- **Target:** NSIS installer
- **Output:** `.exe` installer
- **Icon:** `assets/icon.ico`

### macOS
- **Target:** DMG image
- **Output:** `.dmg` file
- **Icon:** `assets/icon.icns`

### Linux
- **Target:** AppImage
- **Output:** `.AppImage` file
- **Icon:** `assets/icon.png`

## Development Notes

### Hot Reload
- React code hot reloads automatically (Vite)
- Electron main process requires restart
- Changes to preload.ts require full restart

### Debugging
- Renderer: Chrome DevTools (auto-opens in dev mode)
- Main process: `console.log` or attach debugger
- IPC: Log in both renderer and main process

### TypeScript
- Strict mode enabled
- Full type coverage
- Electron API types included

## Packaging

### Before Packaging
1. Update version in `package.json`
2. Add application icons to `assets/`
3. Test build with `pnpm build`
4. Test package with `pnpm package`

### Distribution
1. Sign the application (Windows: Authenticode, macOS: Apple ID)
2. Notarize for macOS (required for Catalina+)
3. Upload to distribution platform

## Troubleshooting

### Electron not starting
```bash
# Clear Electron cache
rm -rf node_modules/electron
pnpm install
```

### Build errors
```bash
# Clean build directories
rm -rf dist dist-package

# Rebuild
pnpm build
```

### License validation fails
- Ensure backend API is running
- Check API URL configuration
- Verify license key format

### Files not moving to trash
- Check file permissions
- Ensure files are not in use
- Verify `trash` package installation

## Known Limitations

- Maximum file size: Limited by available memory
- Large directory scans: May take time
- Network required: For license validation
- API dependency: Backend must be running

## Future Enhancements

- Offline mode (cached analysis)
- Custom file type filters
- Scheduling and automation
- Progress notifications
- Conflict resolution UI

## License

Private - Part of AI File Cleanup System

## Support

For issues and questions:
- Check backend API logs
- Review Electron console output
- Verify file permissions
- Test with smaller directories

