import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.message || 'An error occurred';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

export const apiService = {
  // Health check
  async healthCheck() {
    const response = await api.get('/health');
    return response.data;
  },

  // Scan operations
  async startScan(directoryPath: string) {
    const response = await api.post('/api/scan/start', {
      directory_path: directoryPath,
      include_subdirectories: true
    });
    return response.data;
  },

  async getScanStatus(sessionId: string) {
    const response = await api.get(`/api/scan/status/${sessionId}`);
    return response.data;
  },

  async getScanSessions(limit = 10, offset = 0) {
    const response = await api.get('/api/scan/sessions', {
      params: { limit, offset }
    });
    return response.data;
  },

  // Duplicate operations
  async getDuplicates(sessionId?: string, limit = 50, offset = 0) {
    const response = await api.get('/api/duplicates', {
      params: { 
        session_id: sessionId,
        limit,
        offset
      }
    });
    return response.data;
  },

  async getDuplicateStats() {
    const response = await api.get('/api/duplicates/stats');
    return response.data;
  },

  // Cleanup operations
  async executeCleanup(cleanupRules: any) {
    const response = await api.post('/api/cleanup/execute', cleanupRules);
    return response.data;
  },

  async getCleanupStatus(cleanupId: string) {
    const response = await api.get(`/api/cleanup/status/${cleanupId}`);
    return response.data;
  },

  // File operations
  async getFiles(category?: string, fileType?: string, limit = 50, offset = 0) {
    const response = await api.get('/api/files', {
      params: { category, file_type: fileType, limit, offset }
    });
    return response.data;
  },

  async deleteFile(fileId: string) {
    const response = await api.delete(`/api/files/${fileId}`);
    return response.data;
  }
};

export default apiService;
