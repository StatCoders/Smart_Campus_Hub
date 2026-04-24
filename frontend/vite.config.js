import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep lucide-react in a separate chunk
          if (id.includes('lucide-react')) {
            return 'lucide';
          }
          // Separate dashboard components
          if (id.includes('src/components/dashboard')) {
            return 'dashboard-components';
          }
          // Separate services
          if (id.includes('src/services')) {
            return 'services';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
