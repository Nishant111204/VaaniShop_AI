import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 5173 belongs to another local project, so this one uses its own port and fails
// loudly instead of drifting onto someone else's.
const DEV_PORT = 5847
const API_TARGET = process.env.VITE_DEV_API || 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    port: DEV_PORT,
    strictPort: true,
    // The app calls relative /api URLs; in production the backend serves the app itself.
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
  preview: {
    port: DEV_PORT + 1,
    strictPort: true,
  },
})
