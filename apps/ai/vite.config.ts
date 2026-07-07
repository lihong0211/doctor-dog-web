import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/ai/',
  plugins: [react()],
  server: {
    proxy: {
      // '/ai': {
      //   target: 'https://home.doctor-dog.com',
      //   changeOrigin: true,
      // },
      '/ai': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
