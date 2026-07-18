import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/en/',
  server: {
    port: 3389,
    // host: '0.0.0.0',
    proxy: {
      '/english': {
        target: 'http://localhost:3000/',
        changeOrigin: true,
      },
      '/peach': {
        target: 'http://localhost:3000/',
        changeOrigin: true,
      },
      '/en-desktop': {
        target: 'http://localhost:3000/',
        changeOrigin: true,
      },
      // Go 统一后端（商品、订单、用户、抢购）
      '/go-api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/go-api/, ''),
      },
      // 同上，兼容直接请求 /api 的情况
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        generatorOpts: {
          jsescOption: {
            minimal: true,
          },
        },
        plugins: [
          // 在compile启用hash之前不打开，否则会不一致导致找不到key
          [
            'formatjs',
            {
              idInterpolationPattern: '[sha512:contenthash:base64:6]',
              ast: true,
            },
          ],
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // @ts-ignore
      '@': path.resolve(__dirname, './src'),
      '@chat': path.resolve(__dirname, './src'),
    },
  },
});
