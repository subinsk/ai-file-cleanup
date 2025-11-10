import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import fastGlob from 'fast-glob';
import dotenv from 'dotenv';

// Load environment variables
// In production, .env will be in the resources folder
const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
  // Development: load from project root
  dotenv.config();
} else {
  // Production: load from resources folder
  const envPath = path.join(process.resourcesPath, '.env');
  dotenv.config({ path: envPath });
}

const API_URL = process.env.VITE_API_URL || 'http://127.0.0.1:3001';
// eslint-disable-next-line no-console
console.log('🔧 API URL configured:', API_URL);

// Enable auto-reload in development
if (isDev) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '../../node_modules/.bin/electron'),
      hardResetMethod: 'exit',
    });
  } catch (err) {
    // Silently fail if electron-reload not available
  }
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'AI File Cleanup',
    autoHideMenuBar: true,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers

// Select directory
ipcMain.handle('dialog:selectDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  return result.filePaths[0];
});

// Scan directory for files
ipcMain.handle('files:scanDirectory', async (_, directoryPath: string) => {
  try {
    const patterns = ['**/*.{jpg,jpeg,png,gif,webp}', '**/*.pdf', '**/*.txt'];

    const files = await fastGlob(patterns, {
      cwd: directoryPath,
      absolute: true,
      followSymbolicLinks: false,
    });

    const fileInfos = await Promise.all(
      files.map(async (filePath) => {
        const stats = await fs.stat(filePath);
        return {
          path: filePath,
          name: path.basename(filePath),
          size: stats.size,
          mtime: stats.mtime.toISOString(),
        };
      })
    );

    return fileInfos;
  } catch (error) {
    console.error('Error scanning directory:', error);
    throw error;
  }
});

// Read file content
ipcMain.handle('files:readFile', async (_, filePath: string) => {
  try {
    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

// Move files to trash
ipcMain.handle('files:moveToTrash', async (_, filePaths: string[]) => {
  try {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      throw new Error('No file paths provided');
    }

    // eslint-disable-next-line no-console
    console.log('Received file paths to trash:', filePaths);

    // Validate and normalize file paths, and deduplicate
    const validPaths: string[] = [];
    const invalidPaths: string[] = [];
    const seenPaths = new Set<string>();

    for (const filePath of filePaths) {
      if (!filePath || typeof filePath !== 'string') {
        invalidPaths.push(String(filePath));
        continue;
      }

      // Check if it looks like a file ID (starts with "file_") instead of a path
      if (filePath.startsWith('file_') && !filePath.includes('/') && !filePath.includes('\\')) {
        // eslint-disable-next-line no-console
        console.warn(`Skipping file ID (not a path): ${filePath}`);
        invalidPaths.push(filePath);
        continue;
      }

      // Normalize the path (handle both forward and backslashes)
      // Use path.resolve to get absolute path and normalize separators
      const normalizedPath = path.resolve(filePath);

      // Deduplicate - skip if we've already seen this path
      if (seenPaths.has(normalizedPath)) {
        // eslint-disable-next-line no-console
        console.log(`Skipping duplicate path: ${normalizedPath}`);
        continue;
      }
      seenPaths.add(normalizedPath);

      // Check if file exists
      try {
        await fs.access(normalizedPath);
        validPaths.push(normalizedPath);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`File does not exist: ${normalizedPath}`);
        invalidPaths.push(normalizedPath);
      }
    }

    if (validPaths.length === 0) {
      throw new Error(`No valid file paths found. Invalid paths: ${invalidPaths.join(', ')}`);
    }

    // eslint-disable-next-line no-console
    console.log(`Moving ${validPaths.length} unique file(s) to trash:`, validPaths);

    // Use Electron's native shell.trashItem for reliable cross-platform trash support
    const results = await Promise.allSettled(
      validPaths.map((filePath) => shell.trashItem(filePath))
    );

    // Check for any failures
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      const errors = failures.map((f) =>
        f.status === 'rejected' ? String(f.reason) : 'Unknown error'
      );
      console.error('Some files failed to move to trash:', errors);
      throw new Error(`Failed to move ${failures.length} file(s) to trash: ${errors.join(', ')}`);
    }

    // eslint-disable-next-line no-console
    console.log(`Successfully moved ${validPaths.length} file(s) to trash`);
    return { success: true, count: validPaths.length };
  } catch (error) {
    console.error('Error moving files to trash:', error);
    throw error;
  }
});

// User login
ipcMain.handle('auth:login', async (_, email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, message: data.detail || 'Login failed' };
    }

    const data = await response.json();
    return {
      success: true,
      user: data.user,
      accessToken: data.access_token,
    };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
});

// User signup
ipcMain.handle('auth:signup', async (_, name: string, email: string, password: string) => {
  try {
    // Register user
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, message: data.detail || 'Registration failed' };
    }

    // Auto login after registration
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.ok) {
      return { success: false, message: 'Account created but login failed. Please log in.' };
    }

    const loginData = await loginResponse.json();
    return {
      success: true,
      user: loginData.user,
      accessToken: loginData.access_token,
    };
  } catch (error) {
    console.error('Error signing up:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
});

// Validate license key (API call)
ipcMain.handle('license:validate', async (_, licenseKey: string) => {
  try {
    const response = await fetch(`${API_URL}/desktop/validate-license`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey }),
    });

    if (!response.ok) {
      throw new Error('License validation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error validating license:', error);
    throw error;
  }
});

// Get dedupe preview
ipcMain.handle('dedupe:preview', async (_, data: Record<string, unknown>) => {
  // eslint-disable-next-line no-console
  console.log('🎯 IPC Handler called: dedupe:preview');
  // eslint-disable-next-line no-console, @typescript-eslint/no-explicit-any
  console.log('📊 Number of files received:', data.files ? (data.files as any[]).length : 0);
  try {
    // eslint-disable-next-line no-console
    console.log('📡 Sending request to API:', `${API_URL}/desktop/dedupe/preview`);
    // eslint-disable-next-line no-console
    console.log('📦 Request data:', JSON.stringify(data, null, 2));

    const response = await fetch(`${API_URL}/desktop/dedupe/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // eslint-disable-next-line no-console
    console.log('API response status:', response.status);
    // eslint-disable-next-line no-console
    console.log('API response headers:', Object.fromEntries(response.headers.entries()));

    // Check content type before parsing
    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      let errorText: string;
      if (contentType.includes('application/json')) {
        const errorData = await response.json();
        errorText = errorData.detail || errorData.message || JSON.stringify(errorData);
      } else {
        errorText = await response.text();
        // If it's HTML, try to extract meaningful error
        if (errorText.startsWith('<!DOCTYPE') || errorText.startsWith('<html')) {
          errorText = `Server returned HTML error page (status ${response.status}). The API may not be running or the endpoint doesn't exist.`;
        }
      }
      console.error('API error response:', errorText);
      throw new Error(`Failed to get dedupe preview: ${response.status} - ${errorText}`);
    }

    // Verify we're getting JSON before parsing
    if (!contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Expected JSON but got:', contentType);
      console.error('Response preview:', textResponse.substring(0, 200));
      throw new Error(
        `API returned non-JSON response (${contentType}). The endpoint may be misconfigured.`
      );
    }

    const result = await response.json();
    // eslint-disable-next-line no-console
    console.log('API response data:', result);
    return result;
  } catch (error) {
    console.error('Error getting dedupe preview:', error);
    throw error;
  }
});
