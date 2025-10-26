import type {
  LoginRequest,
  LoginResponse,
  UserPublic,
  DedupePreviewResponse,
  GenerateLicenseResponse,
  ListLicensesResponse,
  RevokeLicenseResponse,
} from '@ai-cleanup/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get access token from localStorage
    const accessToken =
      typeof window !== 'undefined' ? localStorage.getItem('api_access_token') : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if token exists
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: response.statusText || 'An error occurred',
      }));
      throw new Error(error.detail || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.fetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    await this.fetch('/auth/logout', { method: 'POST' });
    // Clear stored token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('api_access_token');
    }
  }

  async getCurrentUser(): Promise<UserPublic> {
    return this.fetch<UserPublic>('/auth/me');
  }

  // File Upload with Session Management
  async uploadFiles(
    files: File[]
  ): Promise<{ sessionId: string; status: string; message: string }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    // Get access token for multipart request
    const accessToken =
      typeof window !== 'undefined' ? localStorage.getItem('api_access_token') : null;
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}/uploads/upload`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    // Upload session created successfully

    return {
      sessionId: result.session_id,
      status: result.status,
      message: result.message,
    };
  }

  // Session Status Management
  async getSessionStatus(sessionId: string): Promise<{
    session_id: string;
    status: string;
    progress: number;
    total_files: number;
    processed_files: number;
    failed_files: number;
    duplicate_groups: any[];
    processing_stats: any;
    error_message?: string;
  }> {
    const accessToken =
      typeof window !== 'undefined' ? localStorage.getItem('api_access_token') : null;
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}/uploads/sessions/${sessionId}`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Failed to get session status' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async listUserSessions(): Promise<any[]> {
    const accessToken =
      typeof window !== 'undefined' ? localStorage.getItem('api_access_token') : null;
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}/uploads/sessions`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to list sessions' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async cleanupSessionFiles(sessionId: string, selectedFiles: string[]): Promise<Blob> {
    const accessToken =
      typeof window !== 'undefined' ? localStorage.getItem('api_access_token') : null;
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}/uploads/sessions/${sessionId}/cleanup`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ selectedFiles }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to cleanup files' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.blob();
  }

  async deleteSession(sessionId: string): Promise<void> {
    const accessToken =
      typeof window !== 'undefined' ? localStorage.getItem('api_access_token') : null;
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}/uploads/sessions/${sessionId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete session' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
  }
  async getDedupePreview(data: { files: any[] }): Promise<DedupePreviewResponse> {
    return this.fetch<DedupePreviewResponse>('/dedupe/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async downloadZip(uploadId: string, fileIds: string[]): Promise<Blob> {
    const accessToken =
      typeof window !== 'undefined' ? localStorage.getItem('api_access_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}/dedupe/zip`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ uploadId, fileIds }),
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }

  // License Management
  async generateLicenseKey(): Promise<GenerateLicenseResponse> {
    return this.fetch<GenerateLicenseResponse>('/license/generate', {
      method: 'POST',
    });
  }

  async listLicenseKeys(): Promise<ListLicensesResponse> {
    return this.fetch<ListLicensesResponse>('/license/list');
  }

  async revokeLicenseKey(key: string): Promise<RevokeLicenseResponse> {
    return this.fetch<RevokeLicenseResponse>(`/license/${key}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_URL);
