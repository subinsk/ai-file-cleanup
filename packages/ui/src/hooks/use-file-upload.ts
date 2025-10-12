import { useState, useCallback } from 'react';

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export interface UseFileUploadOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload({ onSuccess, onError }: UseFileUploadOptions = {}) {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const uploadFiles = useCallback(
    async (files: File[], endpoint: string) => {
      setState({ isUploading: true, progress: 0, error: null });

      try {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });

        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setState((prev) => ({ ...prev, progress }));
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            setState({ isUploading: false, progress: 100, error: null });
            onSuccess?.(data);
          } else {
            const error = new Error(`Upload failed with status ${xhr.status}`);
            setState({ isUploading: false, progress: 0, error: error.message });
            onError?.(error);
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          const error = new Error('Network error during upload');
          setState({ isUploading: false, progress: 0, error: error.message });
          onError?.(error);
        });

        // Send request
        xhr.open('POST', endpoint);
        xhr.send(formData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setState({ isUploading: false, progress: 0, error: errorMessage });
        onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    },
    [onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, error: null });
  }, []);

  return {
    ...state,
    uploadFiles,
    reset,
  };
}

