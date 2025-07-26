import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Product Inventory Checker',
        short_name: 'Inventory',
        description: 'Web application for checking products in inventory using barcodes',
        theme_color: '#2563eb',
        background_color: '#f9fafb',
        display: 'standalone',
        start_url: '.',
        icons: [
          {
            src: 'image.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'image.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
}) 