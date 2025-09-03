// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

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
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)), // 👈 définit @ comme racine de /src
    },
  },
  server: {
    hmr: { overlay: false },
  },
  optimizeDeps: {
    esbuildOptions: {
      sourcemap: false,
    },
  },
  define: {
    'process.env': {}, // évite "process is not defined" côté navigateur
  },
});
