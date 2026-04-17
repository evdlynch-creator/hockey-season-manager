import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const stripOrigin = {
  configure: (proxy: any) => {
    proxy.on('proxyReq', (proxyReq: any) => {
      proxyReq.removeHeader('origin');
      proxyReq.removeHeader('referer');
    });
  },
};

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
      '/api/auth': {
        target: 'https://blink.new',
        changeOrigin: true,
        secure: true,
        ...stripOrigin,
      },
      '/api/db': {
        target: 'https://core.blink.new',
        changeOrigin: true,
        secure: true,
        ...stripOrigin,
      },
      '/api/storage': {
        target: 'https://core.blink.new',
        changeOrigin: true,
        secure: true,
        ...stripOrigin,
      },
      '/api/analytics': {
        target: 'https://core.blink.new',
        changeOrigin: true,
        secure: true,
        ...stripOrigin,
      },
    },
  }
});
