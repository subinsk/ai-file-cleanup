import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),

  // File operations
  scanDirectory: (path: string) => ipcRenderer.invoke('files:scanDirectory', path),
  readFile: (path: string) => ipcRenderer.invoke('files:readFile', path),
  moveToTrash: (paths: string[]) => ipcRenderer.invoke('files:moveToTrash', paths),

  // License
  validateLicense: (key: string) => ipcRenderer.invoke('license:validate', key),

  // Dedupe
  getDedupePreview: (data: any) => ipcRenderer.invoke('dedupe:preview', data),
});

