import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 3000000  // 3 MB au lieu de 2 MB
      },
      manifest: {
        name: 'NerdsBattle',
        short_name: 'NerdsBattle',
        description: 'Quiz éducatif gamifié pour collégiens et lycéens',
        theme_color: '#10B981',
        background_color: '#FAFAFA',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './src/data'),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('katex') || id.includes('react-katex')) {
              return 'vendor-katex';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            return 'vendor';
          }
          if (id.includes('/courses/') || id.includes('\\courses\\')) {
            const match = id.match(/[/\\]courses[/\\]([^/\\]+)[/\\]/);
            if (match) return `courses-${match[1]}`;
            return 'courses-all';
          }
        }
      }
    }
  }
});
