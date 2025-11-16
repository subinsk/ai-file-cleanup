# Cross-Platform Testing Guide

## Overview

This guide provides instructions for testing the AI File Cleanup system across different platforms and browsers.

---

## Testing Matrix

### 1. Operating Systems

| Platform                  | Priority | Status     |
| ------------------------- | -------- | ---------- |
| **Windows 10/11**         | HIGH     | ⏳ Pending |
| **macOS (Intel)**         | MEDIUM   | ⏳ Pending |
| **macOS (Apple Silicon)** | MEDIUM   | ⏳ Pending |
| **Ubuntu 22.04 LTS**      | LOW      | ⏳ Pending |
| **Fedora**                | LOW      | ⏳ Pending |

### 2. Web Browsers

| Browser             | Versions         | Priority | Status     |
| ------------------- | ---------------- | -------- | ---------- |
| **Chrome/Chromium** | Latest, Latest-1 | HIGH     | ⏳ Pending |
| **Firefox**         | Latest, ESR      | HIGH     | ⏳ Pending |
| **Safari**          | Latest (macOS)   | HIGH     | ⏳ Pending |
| **Edge**            | Latest           | MEDIUM   | ⏳ Pending |
| **Mobile Safari**   | iOS 15+          | MEDIUM   | ⏳ Pending |
| **Mobile Chrome**   | Android 11+      | MEDIUM   | ⏳ Pending |

### 3. Screen Resolutions

| Device Type  | Resolution | Priority |
| ------------ | ---------- | -------- |
| Desktop 4K   | 3840x2160  | MEDIUM   |
| Desktop FHD  | 1920x1080  | HIGH     |
| Desktop HD   | 1366x768   | MEDIUM   |
| Tablet       | 1024x768   | HIGH     |
| Mobile Large | 414x896    | HIGH     |
| Mobile Small | 375x667    | HIGH     |

---

## Testing Tools

### Automated Cross-Browser Testing

**Playwright (Already Configured)**

```bash
cd apps/web
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit
```

**BrowserStack (Optional)**

- Real device testing
- Multiple OS/browser combinations
- Free tier available

### Manual Testing Tools

**Windows:**

- WSL2 for Linux testing
- Windows Sandbox for clean environment
- Hyper-V for VMs

**macOS:**

- Parallels/VMware for Windows testing
- Docker for Linux testing

**Linux:**

- VirtualBox for Windows/macOS
- WINE for Windows apps

---

## Web App Testing

### Test Checklist

#### Functionality (All Browsers)

- [ ] User registration
- [ ] User login/logout
- [ ] File upload (drag & drop)
- [ ] File upload (file picker)
- [ ] Duplicate detection
- [ ] Results display
- [ ] ZIP download
- [ ] Quota display
- [ ] Navigation between pages
- [ ] Responsive layout

#### Browser-Specific Issues

**Chrome/Chromium:**

- [ ] File drag-and-drop
- [ ] Download behavior
- [ ] Local storage

**Firefox:**

- [ ] File upload speed
- [ ] Canvas rendering (if used)
- [ ] Cookie behavior

**Safari:**

- [ ] File input handling
- [ ] Date picker
- [ ] Flexbox/Grid layout
- [ ] LocalStorage limits

**Edge:**

- [ ] Compatibility mode issues
- [ ] Download prompts

#### Mobile Browsers

- [ ] Touch interactions
- [ ] File upload (camera/gallery)
- [ ] Pinch-to-zoom disabled where appropriate
- [ ] Responsive breakpoints
- [ ] Keyboard behavior

### Visual Regression Testing

**Percy (Optional)**

```bash
# Install Percy
pnpm add -D @percy/cli @percy/playwright

# Run with Percy
pnpm exec percy exec -- playwright test
```

**Manual Screenshots**

```bash
# Take screenshots in all browsers
pnpm exec playwright test --screenshot=on
```

---

## Desktop App Testing

### Windows Testing

**Windows 10:**

```bash
# Build installer
cd apps/desktop
pnpm package:win

# Install on clean Windows 10 VM
# Test all features
```

**Checklist:**

- [ ] Installation (NSIS installer)
- [ ] Installation (Portable .exe)
- [ ] First launch
- [ ] License activation
- [ ] Directory selection (C:\, D:\, network drives)
- [ ] File scanning
- [ ] Duplicate detection
- [ ] Move to Recycle Bin
- [ ] Settings persistence
- [ ] Auto-update (if implemented)
- [ ] Uninstallation
- [ ] Data cleanup after uninstall

**Windows 11:**

- [ ] Same as Windows 10
- [ ] Windows 11-specific UI integration
- [ ] Windows 11 context menus

**Windows-Specific Issues:**

- File path encoding (Unicode)
- Long file paths (>260 chars)
- Junction points/symlinks
- Network drives (UNC paths)
- Administrator vs. standard user
- Windows Defender SmartScreen

### macOS Testing

**Intel Mac:**

```bash
# Build DMG
cd apps/desktop
pnpm package:mac

# Install on macOS
# Test all features
```

**Apple Silicon Mac:**

- Same as Intel, but native ARM build

**Checklist:**

- [ ] DMG installation
- [ ] Gatekeeper approval
- [ ] First launch security prompt
- [ ] License activation
- [ ] Directory selection
- [ ] File scanning
- [ ] Duplicate detection
- [ ] Move to Trash (.Trash)
- [ ] Settings persistence
- [ ] Uninstallation (drag to Trash)

**macOS-Specific Issues:**

- Gatekeeper (unsigned app warning)
- File permissions
- Sandboxing
- HFS+ vs. APFS
- Spotlight indexing interference
- Dark mode support

### Linux Testing

**Ubuntu/Debian:**

```bash
# Build AppImage
cd apps/desktop
pnpm package:linux

# Run on Ubuntu
chmod +x *.AppImage
./AI-File-Cleanup-*.AppImage
```

**Checklist:**

- [ ] AppImage execution
- [ ] License activation
- [ ] Directory selection
- [ ] File scanning
- [ ] Duplicate detection
- [ ] Move to Trash (~/.local/share/Trash)
- [ ] Settings persistence
- [ ] Desktop integration

**Linux-Specific Issues:**

- Different trash locations per distro
- File permissions (chmod/chown)
- SELinux/AppArmor policies
- Different desktop environments (GNOME, KDE, XFCE)
- Wayland vs. X11

---

## API Testing

### Cross-Platform API Clients

**Test with:**

```bash
# cURL (all platforms)
curl -X GET http://localhost:3001/health

# Postman (all platforms)
# Import API collection and run tests

# Python requests
pip install requests
python test_api.py
```

### Database Compatibility

**PostgreSQL versions:**

- [ ] PostgreSQL 15 (primary)
- [ ] PostgreSQL 14 (compatibility)
- [ ] PostgreSQL 16 (future-proofing)

**pgvector extension:**

- [ ] Verify vector operations work
- [ ] Test similarity searches
- [ ] Performance benchmarks

---

## Performance Testing

### Metrics to Collect

| Metric                         | Target  | Acceptable |
| ------------------------------ | ------- | ---------- |
| Page Load Time                 | < 2s    | < 3s       |
| File Upload (10MB)             | < 5s    | < 10s      |
| Duplicate Detection (20 files) | < 30s   | < 60s      |
| Download ZIP (50MB)            | < 10s   | < 20s      |
| API Response Time              | < 500ms | < 1s       |

### Tools

**Web Performance:**

```bash
# Lighthouse
pnpm exec lighthouse http://localhost:3000

# WebPageTest
# Use online tool: webpagetest.org
```

**API Performance:**

```bash
# Apache Bench
ab -n 1000 -c 10 http://localhost:3001/health

# k6 (load testing)
k6 run load-test.js
```

**Desktop Performance:**

- Task Manager (Windows)
- Activity Monitor (macOS)
- htop (Linux)

---

## Accessibility Testing

### Tools

**Automated:**

```bash
# axe-core (via Playwright)
pnpm add -D @axe-core/playwright
```

**Manual:**

- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard navigation only
- High contrast mode
- Color blindness simulators

### Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Proper heading hierarchy
- [ ] Alt text for images
- [ ] Form labels
- [ ] Focus indicators visible
- [ ] Color contrast ratio > 4.5:1
- [ ] ARIA attributes where needed

---

## Security Testing

### Cross-Platform Security Issues

**Windows:**

- [ ] File path traversal
- [ ] DLL hijacking prevention
- [ ] Registry key security
- [ ] Windows Defender compatibility

**macOS:**

- [ ] Entitlements (sandboxing)
- [ ] Keychain access
- [ ] File quarantine attributes

**Linux:**

- [ ] AppArmor/SELinux profiles
- [ ] File permissions
- [ ] Sudo/root prevention

**Web:**

- [ ] XSS prevention (all browsers)
- [ ] CSRF tokens
- [ ] CSP headers
- [ ] Cookie security flags

---

## Test Execution

### Phase 1: Local Testing (1-2 days)

**Developer machine:**

1. Test on your primary OS
2. Test in all major browsers
3. Run automated E2E tests
4. Fix any obvious issues

### Phase 2: VM/Cloud Testing (2-3 days)

**Virtual machines:**

1. Set up VMs for each target OS
2. Run manual test checklist
3. Document platform-specific issues
4. Create compatibility matrix

### Phase 3: Real Device Testing (2-3 days)

**Physical devices:**

1. Test on real Windows/Mac/Linux machines
2. Test mobile devices
3. Test various screen sizes
4. Collect user feedback

### Phase 4: Beta Testing (1 week)

**Real users:**

1. Invite 5-10 beta testers
2. Provide test scenarios
3. Collect feedback
4. Fix reported issues

---

## Issue Tracking

### Platform-Specific Issues Template

```markdown
## Issue: [Title]

**Platform:** Windows 10 / macOS 13 / Ubuntu 22.04  
**Browser:** Chrome 120 (if web issue)  
**Component:** Web App / Desktop App / API  
**Severity:** Critical / High / Medium / Low

**Description:**
[Describe the issue]

**Steps to Reproduce:**

1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[Attach screenshots]

**Workaround:**
[If any]

**Related Issues:**
[Link to similar issues]
```

---

## Compatibility Matrix

### Web App

| Browser | Windows | macOS | Linux | Mobile |
| ------- | ------- | ----- | ----- | ------ |
| Chrome  | ✅      | ✅    | ✅    | ✅     |
| Firefox | ✅      | ✅    | ✅    | ✅     |
| Safari  | N/A     | ✅    | N/A   | ✅     |
| Edge    | ✅      | ✅    | ✅    | ✅     |

### Desktop App

| Feature             | Windows        | macOS     | Linux       |
| ------------------- | -------------- | --------- | ----------- |
| Installation        | ✅ NSIS        | ✅ DMG    | ✅ AppImage |
| License Activation  | ✅             | ✅        | ✅          |
| File Scanning       | ✅             | ✅        | ✅          |
| Duplicate Detection | ✅             | ✅        | ✅          |
| Move to Trash       | ✅ Recycle Bin | ✅ Trash  | ✅ ~/.Trash |
| Auto-update         | ⏳ Future      | ⏳ Future | ⏳ Future   |

### API

| Feature        | Linux | Windows | macOS |
| -------------- | ----- | ------- | ----- |
| FastAPI Server | ✅    | ✅      | ✅    |
| PostgreSQL     | ✅    | ✅      | ✅    |
| ML Service     | ✅    | ✅      | ✅    |
| Docker         | ✅    | ✅      | ✅    |

---

## Known Issues & Workarounds

### Windows

**Issue:** Long file paths (>260 characters)  
**Workaround:** Enable long path support in registry or use UNC paths

**Issue:** Windows Defender false positive  
**Workaround:** Submit app to Microsoft for analysis, or code sign

### macOS

**Issue:** "App cannot be opened" (Gatekeeper)  
**Workaround:** Right-click → Open, or System Preferences → Security

**Issue:** Rosetta 2 required for Intel apps on Apple Silicon  
**Workaround:** Build universal binary (x64 + arm64)

### Linux

**Issue:** Trash location varies by distro  
**Workaround:** Check multiple locations or use `gio trash`

**Issue:** AppImage doesn't integrate with desktop  
**Workaround:** Use AppImageLauncher or create .desktop file

---

## Resources

- [Can I Use](https://caniuse.com/) - Browser compatibility
- [BrowserStack](https://www.browserstack.com/) - Cross-browser testing
- [Sauce Labs](https://saucelabs.com/) - Automated testing
- [Percy](https://percy.io/) - Visual regression
- [MDN Web Docs](https://developer.mozilla.org/) - Browser APIs

---

**Last Updated:** January 2025  
**Status:** ⏳ Pending Execution  
**Estimated Time:** 1-2 weeks for complete testing
