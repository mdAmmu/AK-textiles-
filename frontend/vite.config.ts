import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allows the Cloudflare quick-tunnel URL (used for testing the
    // WhatsApp button on a real phone) to reach this dev server.
    allowedHosts: ['.trycloudflare.com'],
  },
})
