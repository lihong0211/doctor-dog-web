/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/ai/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
  server: {
    proxy: {
      '/ai': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        bypass(req) {
          const url = req.url || ''
          const isFrontendOwned =
            url === '/ai' ||
            url === '/ai/' ||
            url.startsWith('/ai/@') ||
            url.startsWith('/ai/src/') ||
            url.startsWith('/ai/node_modules/') ||
            url.startsWith('/ai/docs/') ||
            url === '/ai/portal.html' ||
            url === '/ai/waves.html' ||
            url.startsWith('/ai/hub') ||
            url.startsWith('/ai/models') ||
            url.startsWith('/ai/experience') ||
            url.startsWith('/ai/skills') ||
            url.startsWith('/ai/apps') ||
            url.startsWith('/ai/portal')
          if (isFrontendOwned) return url
        },
      },
    },
  },
})
