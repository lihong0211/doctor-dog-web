const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export interface MossTTSStatus {
  online: boolean
  msg?: string
  health?: Record<string, unknown>
  warmup?: Record<string, unknown>
}

export async function getMossTTSStatus(): Promise<MossTTSStatus> {
  const res = await fetch(`${BASE_URL}/ai/moss-tts/status`)
  if (!res.ok) return { online: false, msg: `HTTP ${res.status}` }
  return res.json()
}

/**
 * 合成语音。text 必填，promptAudio 可选（WAV，用于声音克隆）。
 * 返回可播放的 ObjectURL。
 */
export async function mossTTSSynthesize(
  text: string,
  promptAudio?: File | null,
  demoId?: string,
): Promise<string> {
  const form = new FormData()
  form.append('text', text)
  if (demoId) form.append('demo_id', demoId)
  if (promptAudio) form.append('prompt_audio', promptAudio)

  const res = await fetch(`${BASE_URL}/ai/moss-tts/speech`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { msg?: string; message?: string }
    throw new Error(err.msg || err.message || `HTTP ${res.status}`)
  }

  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
