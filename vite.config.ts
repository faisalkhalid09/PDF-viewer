import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.wasm'],
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: ['@tldraw/tldraw', 'react-pdf']
  },
  build: {
    // Optimize for Railway deployment
    sourcemap: false, // Disable sourcemaps to reduce build size and time
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        // Split chunks to avoid large bundle sizes
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tldraw: ['@tldraw/tldraw'],
          pdf: ['react-pdf']
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000
  }
})
