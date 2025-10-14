/**
 * Application configuration
 * Reads from environment variables (VITE_ prefix for renderer process)
 */

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

export type Config = typeof config;
