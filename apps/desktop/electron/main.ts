import { app, BrowserWindow, ipcMain, dialog } from 'electron';
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
    // Dynamic import for ES-only module
    const trash = (await import('trash')).default;
    await trash(filePaths);
    return { success: true };
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
  try {
    const response = await fetch(`${API_URL}/desktop/dedupe/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to get dedupe preview');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting dedupe preview:', error);
    throw error;
  }
});
