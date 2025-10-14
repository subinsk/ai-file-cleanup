interface User {
  id: string;
  email: string;
  name?: string;
}

export interface ElectronAPI {
  selectDirectory: () => Promise<string>;
  scanDirectory: (path: string) => Promise<FileInfo[]>;
  readFile: (path: string) => Promise<ArrayBuffer>;
  moveToTrash: (paths: string[]) => Promise<{ success: boolean }>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; user?: User; accessToken?: string; message?: string }>;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; user?: User; accessToken?: string; message?: string }>;
  validateLicense: (key: string) => Promise<{ valid: boolean; message?: string }>;
  getDedupePreview: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
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
