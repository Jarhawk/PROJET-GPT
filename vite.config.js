import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      srcDir: 'public',
      filename: 'service-worker.js',
      manifest: {
        name: 'MamaStock',
        short_name: 'MamaStock',
        description: 'Application de gestion de stock pour Mama Shelter',
        start_url: '/',
        display: 'standalone',
        background_color: '#f0f0f5',
        theme_color: '#bfa14d',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 👈 définit @ comme racine de /src
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
