import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-blkout.svg', 'images/blkoutlogo_wht_transparent.png'],
      manifest: {
        name: 'BLKOUT Events - Community Calendar',
        short_name: 'BLKOUT Events',
        description: 'Community events calendar for Black queer liberation',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['events', 'community', 'social'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: 'screenshot-narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      },
      workbox: {
        // Cache strategies for different asset types
        runtimeCaching: [
          {
            // Cache API responses from IVOR Core
            urlPattern: /^https:\/\/ivor\.blkoutuk\.cloud\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ivor-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Cache event images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'event-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            // Cache font files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ],
        // Don't precache everything - just essential assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Skip waiting so updates apply immediately
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: true, // Enable PWA in dev for testing
        type: 'module'
      }
    })
  ],
  server: {
    port: 5174,
    host: true
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
