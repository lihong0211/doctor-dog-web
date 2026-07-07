/**
 * TTS 文字转语音 API
 * POST /ai/tts 请求体：{ text: string }，响应：音频二进制或 JSON { audio_base64 }
 */

const API_BASE = import.meta.env.DEV ? '' : 'https://home.doctor-dog.com'

/**
 * 合成语音，返回可播放的 Blob
 */
export async function ttsSynthesize(text: string): Promise<Blob> {
  const url = API_BASE ? `${API_BASE}/ai/tts` : '/ai/tts'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string; msg?: string }
    throw new Error(err.message || err.msg || `HTTP ${res.status}`)
  }
  const contentType = res.headers.get('Content-Type') || ''
  if (contentType.includes('application/json')) {
    const data = await res.json() as { audio_base64?: string; audio?: string }
    const base64 = data.audio_base64 ?? data.audio
    if (!base64) throw new Error('接口未返回音频数据')
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: 'audio/mpeg' })
  }
  return res.blob()
}
