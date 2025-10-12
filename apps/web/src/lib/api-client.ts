import type {
  LoginRequest,
  LoginResponse,
  UserPublic,
  DedupePreviewRequest,
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
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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
  }

  async getCurrentUser(): Promise<UserPublic> {
    return this.fetch<UserPublic>('/auth/me');
  }

  // File Upload
  async uploadFiles(files: File[]): Promise<{ uploadId: string; files: unknown[] }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseUrl}/dedupe/preview`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Deduplication
  async getDedupePreview(data: DedupePreviewRequest): Promise<DedupePreviewResponse> {
    return this.fetch<DedupePreviewResponse>('/dedupe/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async downloadZip(uploadId: string, fileIds: string[]): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/dedupe/zip`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
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
