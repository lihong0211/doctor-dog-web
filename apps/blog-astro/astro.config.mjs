// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeNova from 'starlight-theme-nova';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    starlight({
      title: '技术文档',
      description: '技术学习文档集合',
      defaultLocale: 'zh-CN',
      customCss: ['./src/styles/global.css'],
      plugins: [starlightThemeNova()],
      sidebar: [
        {
          label: '🧩 ALGORITHM',
          items: [{ label: 'LeetCode 题解', link: '/algorithm/' }],
        },
        {
          label: '🧠 AI',
          items: [{ label: 'Home 项目文档', link: '/ai/' }],
        },
        {
          label: '⚙️ BACKEND',
          items: [{ label: 'ACID', link: '/backend/' }],
        },
      ],
    }),
  ],
});
