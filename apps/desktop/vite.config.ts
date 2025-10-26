import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron', 'sharp', 'image-hash', 'pdf-parse'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ai-cleanup/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@ai-cleanup/ui/styles.css': path.resolve(__dirname, '../../packages/ui/src/styles.css'),
      '@ai-cleanup/types': path.resolve(__dirname, '../../packages/types/src'),
      '@ai-cleanup/core': path.resolve(__dirname, '../../packages/core/src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
  optimizeDeps: {
    exclude: ['@ai-cleanup/core', 'sharp', 'image-hash', 'pdf-parse', 'file-type'],
    include: ['@ai-cleanup/ui', '@ai-cleanup/types'],
  },
});
