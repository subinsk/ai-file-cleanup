import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import fastGlob from 'fast-glob';
import trash from 'trash';

const isDev = process.env.NODE_ENV === 'development';

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
    const patterns = [
      '**/*.{jpg,jpeg,png,gif,webp}',
      '**/*.pdf',
      '**/*.txt',
    ];

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
    await trash(filePaths);
    return { success: true };
  } catch (error) {
    console.error('Error moving files to trash:', error);
    throw error;
  }
});

// Validate license key (API call)
ipcMain.handle('license:validate', async (_, licenseKey: string) => {
  try {
    const response = await fetch('http://localhost:3001/desktop/validate-license', {
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
ipcMain.handle('dedupe:preview', async (_, data: any) => {
  try {
    const response = await fetch('http://localhost:3001/desktop/dedupe/preview', {
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

