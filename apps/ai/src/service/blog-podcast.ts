import request from './request'

export interface BlogScript {
  title: string
  original_summary: string
  podcast_script: string
}

export async function getBlogScript(url: string): Promise<BlogScript> {
  const res = await request.post('/ai/blog-podcast/script', { url }, { timeout: 60000 })
  return res.data
}

export async function getBlogAudio(url: string, voice: string): Promise<string> {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${BASE_URL}/ai/blog-podcast/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, voice }),
  })
  if (!res.ok) throw new Error('音频生成失败')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
