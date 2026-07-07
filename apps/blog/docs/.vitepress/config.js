import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/blog/',
  title: '技术文档',
  description: '技术学习文档集合',
  lang: 'zh-CN',
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: 'https://doctor-dog.com/static/favicon.ico' }],
  ],

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
    ],
    socialLinks: [
      // 可以添加 GitHub 等链接
    ],

    // 侧边栏：三大板块
    sidebar: {
      '/': [
        {
          text: '🧩 ALGORITHM',
          collapsed: false,
          items: [
            { text: 'LeetCode 题解', link: '/ALGORITHM/README' },
          ],
        },
        {
          text: '🧠 AI',
          collapsed: false,
          items: [
            {
              text: 'Home 项目文档',
              link: '/AI/home/README',
              items: [
                { text: '向量库', link: '/AI/home/01_vector_db' },
                { text: 'RAG', link: '/AI/home/02_rag' },
                { text: '知识库', link: '/AI/home/03_knowledge_base' },
                { text: 'Agent', link: '/AI/home/04_agent' },
                { text: 'A2A', link: '/AI/home/05_a2a' },
                { text: 'MCP', link: '/AI/home/06_mcp' },
                { text: 'Chat', link: '/AI/home/07_chat' },
                { text: 'Tools', link: '/AI/home/08_tools' },
                { text: 'Finetuning', link: '/AI/home/09_finetuning' },
              ],
            },
            {
              text: 'Base 基础文档',
              link: '/AI/base/AIGC',
              items: [
                { text: 'Transformer', link: '/AI/base/TRANSFORMER' },
                { text: 'RAG', link: '/AI/base/RAG' },
                { text: 'LANGCHAIN', link: '/AI/base/LANGCHAIN' },
                { text: 'GPT', link: '/AI/base/GPT' },
                { text: 'MODELS', link: '/AI/base/MODELS' },
              ],
            },
          ],
        },
        {
          text: '⚙️ BACKEND',
          collapsed: false,
          items: [
            { text: '概览', link: '/BACKEND/index' },
            { text: '进程 / 线程 / 协程', link: '/BACKEND/进程-线程-协程' },
            { text: '协程', link: '/BACKEND/协程' },
            { text: '死锁', link: '/BACKEND/死锁' },
            { text: '分库分表策略', link: '/BACKEND/分库分表策略' },
            { text: 'ACID', link: '/BACKEND/ACID' },
          ],
        },
      ],
    },

    footer: {
      message: '技术文档集合',
      copyright: 'Copyright © 2024',
    },
  },
})

