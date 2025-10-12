import { create } from 'zustand';
import type { DedupeGroup } from '@ai-cleanup/types';
import type { FileInfo } from '../types/electron';

interface LicenseState {
  licenseKey: string | null;
  isValid: boolean;
  user: any | null;
  setLicense: (key: string, valid: boolean, user?: any) => void;
  clearLicense: () => void;
}

export const useLicenseStore = create<LicenseState>((set) => ({
  licenseKey: localStorage.getItem('licenseKey'),
  isValid: false,
  user: null,
  setLicense: (key, valid, user) => {
    localStorage.setItem('licenseKey', key);
    set({ licenseKey: key, isValid: valid, user });
  },
  clearLicense: () => {
    localStorage.removeItem('licenseKey');
    set({ licenseKey: null, isValid: false, user: null });
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

