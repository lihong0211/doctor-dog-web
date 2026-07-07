/**
 * 精选 AI 产品集 - 按思维导图分类整理
 * 可用于门户、导航或筛选；url 为空表示待补充
 */

export interface AIProduct {
  name: string
  url: string
}

export interface AICategory {
  key: string
  label: string
  products: AIProduct[]
}

/** 按分类整理的 AI 产品（图中全部条目） */
export const AI_PRODUCTS_BY_CATEGORY: AICategory[] = [
  {
    key: 'voice',
    label: '语音',
    products: [
      { name: '讯飞智作', url: 'https://www.xfyun.cn/' },
      { name: '微软语音', url: 'https://azure.microsoft.com/zh-cn/products/ai-services/text-to-speech' },
      { name: '火山语音', url: 'https://www.volcengine.com/product/speech' },
      { name: '剪映', url: 'https://www.capcut.cn/' },
      { name: 'OpenAI Voice', url: 'https://openai.com' },
      { name: 'ElevenLabs', url: 'https://elevenlabs.io' },
      { name: 'ACE Studio', url: 'https://acestudio.ai' },
      { name: 'AIVA', url: 'https://www.aiva.ai' },
      { name: 'Mubert', url: 'https://mubert.com' },
      { name: 'SUNO', url: 'https://suno.com' },
      { name: 'Stable Audio', url: 'https://stability.ai/stable-audio' },
      { name: 'udio', url: 'https://udio.com' },
      { name: '网易天音', url: 'https://tianyin.music.163.com' },
    ],
  },
  {
    key: 'design',
    label: '设计',
    products: [
      { name: '万知', url: 'https://wanzhi.com' },
      { name: 'Tome', url: 'https://tome.app' },
      { name: 'Gamma', url: 'https://gamma.app' },
      { name: 'Canva', url: 'https://www.canva.cn' },
      { name: 'Beautiful.ai', url: 'https://www.beautiful.ai' },
    ],
  },
  {
    key: 'music',
    label: '音乐',
    products: [
      { name: '3DFY AI', url: 'https://3dfy.ai' },
      { name: 'Luma AI', url: 'https://lumalabs.ai' },
      { name: 'Meshy AI', url: 'https://www.meshy.ai' },
      { name: 'Spline AI', url: 'https://spline.design' },
    ],
  },
  {
    key: '3d',
    label: '3D',
    products: [
      { name: '3DFY AI', url: 'https://3dfy.ai' },
      { name: 'Luma AI', url: 'https://lumalabs.ai' },
      { name: 'Meshy AI', url: 'https://www.meshy.ai' },
      { name: 'Spline AI', url: 'https://spline.design' },
    ],
  },
  {
    key: 'llm-cn',
    label: 'LLM（中国）',
    products: [
      { name: 'DeepSeek', url: 'https://www.deepseek.com' },
      { name: 'Kimi', url: 'https://kimi.moonshot.cn' },
      { name: '万知', url: 'https://wanzhi.com' },
      { name: '文心一言', url: 'https://yiyan.baidu.com' },
      { name: '星火', url: 'https://xinghuo.xfyun.cn' },
      { name: '智谱清言', url: 'https://chatglm.cn' },
      { name: '混元', url: 'https://hunyuan.tencent.com' },
      { name: '百川', url: 'https://www.baichuan.ai' },
      { name: '豆包', url: 'https://www.doubao.com' },
      { name: '通义千问', url: 'https://tongyi.aliyun.com' },
    ],
  },
  {
    key: 'llm-global',
    label: 'LLM（全球）',
    products: [
      { name: 'ChatGPT', url: 'https://chat.openai.com' },
      { name: 'Claude', url: 'https://claude.ai' },
      { name: 'Gemini', url: 'https://gemini.google.com' },
      { name: 'Grok xAI', url: 'https://x.ai' },
      { name: 'Llama', url: 'https://llama.meta.com' },
      { name: 'Mistral', url: 'https://mistral.ai' },
    ],
  },
  {
    key: 'image',
    label: '图像',
    products: [
      { name: 'Blockadelabs', url: 'https://www.blockadelabs.com' },
      { name: 'Civitai', url: 'https://civitai.com' },
      { name: 'Clipdrop', url: 'https://clipdrop.co' },
      { name: 'DALL-E', url: 'https://openai.com/dall-e-3' },
      { name: 'Deep Dream', url: 'https://deepdreamgenerator.com' },
      { name: 'DreamStudio', url: 'https://dreamstudio.ai' },
      { name: 'Dreamina', url: 'https://dreamina.capcut.cn' },
      { name: 'Firefly', url: 'https://www.adobe.com/products/firefly.html' },
      { name: 'Gemini', url: 'https://gemini.google.com' },
      { name: 'Krea.ai', url: 'https://krea.ai' },
      { name: 'Latent', url: 'https://fal.ai' },
      { name: 'Leonardo', url: 'https://leonardo.ai' },
      { name: 'Lexica', url: 'https://lexica.art' },
      { name: 'LibLibAI', url: 'https://www.liblib.art' },
      { name: 'Magnific', url: 'https://magnific.ai' },
      { name: 'Midjourney', url: 'https://www.midjourney.com' },
      { name: 'OpenArt', url: 'https://openart.ai' },
      { name: 'Vega AI', url: 'https://vega.volcengine.com' },
      { name: 'Wujie AI', url: 'https://www.wujieai.com' },
    ],
  },
  {
    key: 'search',
    label: '搜索',
    products: [
      { name: '秘塔 AI 搜索', url: 'https://metaso.cn' },
      { name: '天工 AI', url: 'https://tiangong.kuaishou.com' },
      { name: 'Perplexity', url: 'https://www.perplexity.ai' },
    ],
  },
  {
    key: 'digital-human',
    label: '数字人',
    products: [
      { name: '讯飞智作', url: 'https://www.xfyun.cn/' },
      { name: '商汤如影', url: 'https://www.sensetime.com' },
      { name: 'Synthesia', url: 'https://www.synthesia.io' },
      { name: 'RaskAI', url: 'https://www.rask.ai' },
      { name: 'HeyGen', url: 'https://www.heygen.com' },
      { name: 'D-ID', url: 'https://www.d-id.com' },
    ],
  },
  {
    key: 'programming',
    label: '编程',
    products: [
      { name: 'Github Copilot', url: 'https://github.com/features/copilot' },
      { name: 'Cursor', url: 'https://cursor.com' },
    ],
  },
  {
    key: 'video',
    label: '视频',
    products: [
      { name: '度加', url: 'https://dujia.baidu.com' },
      { name: '剪映', url: 'https://dreamina.capcut.cn' },
      { name: 'Viggle', url: 'https://viggle.ai' },
      { name: 'Diffusion', url: 'https://stability.ai/stable-video' },
      { name: 'Sora', url: 'https://openai.com/sora' },
      { name: 'Runway', url: 'https://runwayml.com' },
      { name: 'Pixverse', url: 'https://pixverse.ai' },
      { name: 'Pika', url: 'https://pika.art' },
      { name: 'Moonvalley', url: 'https://moonvalley.ai' },
      { name: 'Kaiber', url: 'https://kaiber.ai' },
      { name: 'AnimateDiff (replicate)', url: 'https://replicate.com' },
    ],
  },
  {
    key: 'peripheral',
    label: '周边',
    products: [
      { name: 'Hugging Face', url: 'https://huggingface.co' },
      { name: 'Coze', url: 'https://www.coze.cn' },
      { name: 'Dify', url: 'https://dify.ai' },
      { name: '魔搭', url: 'https://modelscope.cn' },
      { name: '百炼', url: 'https://bailian.console.aliyun.com/cn-beijing/?tab=model#/model-market' },
      { name: 'Ollama', url: 'https://ollama.com' },
    ],
  },
]

/** 扁平列表（去重按名称），便于搜索或与门户合并 */
export function getUniqueProducts(): AIProduct[] {
  const seen = new Set<string>()
  const list: AIProduct[] = []
  for (const cat of AI_PRODUCTS_BY_CATEGORY) {
    for (const p of cat.products) {
      const key = p.name.trim().toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        list.push(p)
      }
    }
  }
  return list
}
