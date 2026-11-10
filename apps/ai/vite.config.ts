/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('../..', import.meta.url)), '')
  const localAutoConnect = command === 'serve' && mode !== 'test' && Boolean(env.KG_API_KEY)
  return {
  base: '/ai/',
  plugins: [react()],
  define: { __KG_LOCAL_AUTO_CONNECT__: JSON.stringify(localAutoConnect) },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    server: {
      deps: {
        inline: ['@ant-design/colors', '@ant-design/icons', '@ant-design/icons-svg'],
      },
    },
  },
  server: {
    proxy: {
      '/ai/kg': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        headers: env.KG_API_KEY ? { 'X-API-Key': env.KG_API_KEY } : undefined,
      },
      '/ai': {
        target: 'http://localhost:3001',
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
  }
})
