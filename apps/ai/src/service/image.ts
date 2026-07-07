/**
 * 图片生成 API
 * POST /ai/image/generate 请求体：{ prompt, model? }，响应：图片 Blob
 */

const API_BASE = import.meta.env.DEV ? '' : 'https://home.doctor-dog.com'

/**
 * 生成图片，返回 Blob
 */
export async function imageGenerate(prompt: string, model?: string): Promise<Blob> {
  const url = API_BASE ? `${API_BASE}/ai/image/generate` : '/ai/image/generate'
  const body: { prompt: string; model?: string } = { prompt }
  if (model) body.model = model
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { msg?: string; message?: string }
    throw new Error(err.msg || err.message || '生成失败')
  }
  return res.blob()
}
