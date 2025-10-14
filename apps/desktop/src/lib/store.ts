import { create } from 'zustand';
import type { DedupeGroup } from '@ai-cleanup/types';
import type { FileInfo } from '../types/electron';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  setUser: (user: User, token?: string) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('user'),
  setUser: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    if (token) {
      localStorage.setItem('accessToken', token);
    }
    set({ user, accessToken: token || localStorage.getItem('accessToken'), isAuthenticated: true });
  },
  clearUser: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));

interface LicenseState {
  licenseKey: string | null;
  isValid: boolean;
  setLicense: (key: string, valid: boolean) => void;
  clearLicense: () => void;
}

export const useLicenseStore = create<LicenseState>((set) => ({
  licenseKey: localStorage.getItem('licenseKey'),
  isValid: localStorage.getItem('licenseValid') === 'true',
  setLicense: (key, valid) => {
    localStorage.setItem('licenseKey', key);
    localStorage.setItem('licenseValid', String(valid));
    set({ licenseKey: key, isValid: valid });
  },
  clearLicense: () => {
    localStorage.removeItem('licenseKey');
    localStorage.removeItem('licenseValid');
    set({ licenseKey: null, isValid: false });
  },
}));

interface ScanState {
  directoryPath: string | null;
  files: FileInfo[];
  groups: DedupeGroup[];
  selectedFiles: Set<string>;
  isScanning: boolean;
  isAnalyzing: boolean;
  setDirectory: (path: string) => void;
  setFiles: (files: FileInfo[]) => void;
  setGroups: (groups: DedupeGroup[]) => void;
  toggleFileSelection: (filePath: string) => void;
  selectAll: (filePaths: string[]) => void;
  deselectAll: () => void;
  setScanning: (scanning: boolean) => void;
  setAnalyzing: (analyzing: boolean) => void;
  reset: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  directoryPath: null,
  files: [],
  groups: [],
  selectedFiles: new Set(),
  isScanning: false,
  isAnalyzing: false,
  setDirectory: (path) => set({ directoryPath: path }),
  setFiles: (files) => set({ files }),
  setGroups: (groups) => set({ groups }),
  toggleFileSelection: (filePath) =>
    set((state) => {
      const newSelected = new Set(state.selectedFiles);
      if (newSelected.has(filePath)) {
        newSelected.delete(filePath);
      } else {
        newSelected.add(filePath);
      }
      return { selectedFiles: newSelected };
    }),
  selectAll: (filePaths) => set({ selectedFiles: new Set(filePaths) }),
  deselectAll: () => set({ selectedFiles: new Set() }),
  setScanning: (scanning) => set({ isScanning: scanning }),
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  reset: () => set({ directoryPath: null, files: [], groups: [], selectedFiles: new Set() }),
}));
