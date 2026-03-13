import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Raise the warning threshold — 600 kB gzipped is acceptable for a full SPA
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // PDF / canvas export libs — heavy, only needed on export pages
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'export-libs'
          }
          // Radix UI primitives — large but stable, cache well separately
          if (id.includes('@radix-ui')) {
            return 'radix-ui'
          }
          // Lucide icons — large icon set, stable across releases
          if (id.includes('lucide-react')) {
            return 'icons'
          }
          // Core React runtime
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core'
          }
          // Routing
          if (id.includes('react-router')) {
            return 'router'
          }
          // State management + validation
          if (id.includes('zustand') || id.includes('zod') || id.includes('immer')) {
            return 'state'
          }
        },
      },
    },
  },
})
