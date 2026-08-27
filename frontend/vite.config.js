import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-square.png', 'logo-new.jpg'],
      manifest: {
        short_name: "IN-TA",
        name: "IN-TA Solutions",
        icons: [
          {
            src: "/favicon-square.png",
            type: "image/png",
            sizes: "192x192"
          },
          {
            src: "/favicon-square.png",
            type: "image/png",
            sizes: "512x512"
          }
        ],
        start_url: "/",
        display: "standalone",
        theme_color: "#6366f1",
        background_color: "#ffffff"
      }
    })
  ],
})
