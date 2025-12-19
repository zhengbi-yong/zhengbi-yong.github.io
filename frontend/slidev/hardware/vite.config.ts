import { defineConfig } from 'vite'

export default defineConfig({
  base: '/pre/hardware/',
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  }
})