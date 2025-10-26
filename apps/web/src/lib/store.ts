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
  sessionId: string | null;
  sessionStatus: string;
  progress: number;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  duplicateGroups: unknown[];
  processingStats: Record<string, unknown>;
  errorMessage: string | null;
  selectedFiles: Set<string>;
  setSessionData: (
    sessionId: string,
    status: string,
    progress: number,
    totalFiles: number,
    processedFiles: number,
    failedFiles: number,
    duplicateGroups: unknown[],
    processingStats: Record<string, unknown>,
    errorMessage?: string
  ) => void;
  updateSessionStatus: (
    status: string,
    progress: number,
    processedFiles: number,
    failedFiles: number,
    duplicateGroups: unknown[],
    processingStats: Record<string, unknown>,
    errorMessage?: string
  ) => void;
  toggleFileSelection: (fileId: string) => void;
  selectAll: (fileIds: string[]) => void;
  deselectAll: () => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  sessionId: null,
  sessionStatus: 'idle',
  progress: 0,
  totalFiles: 0,
  processedFiles: 0,
  failedFiles: 0,
  duplicateGroups: [],
  processingStats: {},
  errorMessage: null,
  selectedFiles: new Set(),
  setSessionData: (
    sessionId,
    status,
    progress,
    totalFiles,
    processedFiles,
    failedFiles,
    duplicateGroups,
    processingStats,
    errorMessage = undefined
  ) =>
    set({
      sessionId,
      sessionStatus: status,
      progress,
      totalFiles,
      processedFiles,
      failedFiles,
      duplicateGroups,
      processingStats,
      errorMessage,
    }),
  updateSessionStatus: (
    status,
    progress,
    processedFiles,
    failedFiles,
    duplicateGroups,
    processingStats,
    errorMessage = undefined
  ) =>
    set((_state) => ({
      sessionStatus: status,
      progress,
      processedFiles,
      failedFiles,
      duplicateGroups,
      processingStats,
      errorMessage,
    })),
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
  reset: () =>
    set({
      sessionId: null,
      sessionStatus: 'idle',
      progress: 0,
      totalFiles: 0,
      processedFiles: 0,
      failedFiles: 0,
      duplicateGroups: [],
      processingStats: {},
      errorMessage: null,
      selectedFiles: new Set(),
    }),
}));
