export interface ElectronAPI {
  selectDirectory: () => Promise<string>;
  scanDirectory: (path: string) => Promise<FileInfo[]>;
  readFile: (path: string) => Promise<ArrayBuffer>;
  moveToTrash: (paths: string[]) => Promise<{ success: boolean }>;
  validateLicense: (key: string) => Promise<{ valid: boolean; user?: any }>;
  getDedupePreview: (data: any) => Promise<any>;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  mtime: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

