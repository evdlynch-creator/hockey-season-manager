import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5000,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/blink-proxy/auth': {
        target: 'https://blink.new',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/blink-proxy\/auth/, ''),
      },
      '/blink-proxy/core': {
        target: 'https://core.blink.new',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/blink-proxy\/core/, ''),
      },
    },
  }
});
