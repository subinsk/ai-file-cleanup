import { create } from 'zustand';
import type { UserPublic } from '@ai-cleanup/types';

interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  setUser: (user: UserPublic | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

interface UploadState {
  uploadId: string | null;
  files: unknown[];
  selectedFiles: Set<string>;
  setUploadData: (uploadId: string, files: unknown[]) => void;
  toggleFileSelection: (fileId: string) => void;
  selectAll: (fileIds: string[]) => void;
  deselectAll: () => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  uploadId: null,
  files: [],
  selectedFiles: new Set(),
  setUploadData: (uploadId, files) => set({ uploadId, files }),
  toggleFileSelection: (fileId) =>
    set((state) => {
      const newSelected = new Set(state.selectedFiles);
      if (newSelected.has(fileId)) {
        newSelected.delete(fileId);
      } else {
        newSelected.add(fileId);
      }
      return { selectedFiles: newSelected };
    }),
  selectAll: (fileIds) => set({ selectedFiles: new Set(fileIds) }),
  deselectAll: () => set({ selectedFiles: new Set() }),
  reset: () => set({ uploadId: null, files: [], selectedFiles: new Set() }),
}));

