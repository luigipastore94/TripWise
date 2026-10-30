import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const buildTimestampLabel = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date());

export default defineConfig({
  define: {
    __APP_BUILD_LABEL__: JSON.stringify(buildTimestampLabel)
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'TripWise - Travel Companion',
        short_name: 'TripWise',
        description: 'App collaborativa universale per itinerari, mappe, spese condivise e documenti di viaggio offline.',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache OpenStreetMap, Carto Voyager HD & Esri Satellite tiles for offline viewing of explored areas
            urlPattern:
              /^https:\/\/(?:[a-c]\.tile\.openstreetmap\.org|[a-d]\.basemaps\.cartocdn\.com|server\.arcgisonline\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tripwise-map-tiles-cache',
              expiration: {
                maxEntries: 650,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          map: ['leaflet']
        }
      }
    }
  }
});
