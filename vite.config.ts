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
  },
  preview: {
    port: 5000,
    strictPort: true,
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://blink.new https://cdn.blink.new blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https://*.blink.new https://*.blinkpowered.com https://*.firebasestorage.app https://cdn.blink.new; font-src 'self' data: https:; frame-src 'self' https://*.blink.new https://*.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Server': 'Hidden'
    }
  }
});
