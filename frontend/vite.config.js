import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    basicSsl(),
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      },
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
