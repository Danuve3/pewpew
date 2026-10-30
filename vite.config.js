import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Se publica en https://danuve3.github.io/pewpew/
export default defineConfig({
  base: '/pewpew/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'PEW PEW · el matamarcianos que suena a ti',
        short_name: 'PEW PEW',
        description: 'Matamarcianos absurdo en el que todos los efectos de sonido los grabas tú con tu voz.',
        lang: 'es',
        start_url: '/pewpew/',
        scope: '/pewpew/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fbfaf3',
        theme_color: '#fbfaf3',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
