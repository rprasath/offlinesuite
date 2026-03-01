import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@tools': '/src/tools',
      '@components': '/src/components',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
    },
  },
  build: {
    rollupOptions: {
      external: ['onnxruntime-web/webgpu'],
      output: {
        manualChunks: {
          'passport-photo': [
            './src/tools/passport-photo/index.jsx',
          ],
          // Add more tool chunks as needed
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@imgly/background-removal'] 
  }
})
