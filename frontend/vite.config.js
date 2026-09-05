import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3002,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5160',
        changeOrigin: true,
        secure: false
      },
      '/hubs': {
        target: 'http://127.0.0.1:5160',
        ws: true,
        secure: false
      }
    }
  }
})
