/**
 * 视频理解 API
 * POST /ai/video/understand
 * - 表单上传: video=@file, question=string
 * - JSON: { video_base64: string, question: string }
 * 响应: JSON { result? | text? | answer? }
 */

const API_BASE = import.meta.env.DEV ? '' : 'https://home.doctor-dog.com'

export async function videoUnderstand(
  video: File | Blob | string,
  question: string
): Promise<string> {
  const url = API_BASE ? `${API_BASE}/ai/video/understand` : '/ai/video/understand'
  let res: Response
  if (typeof video === 'string') {
    const base64 = video.includes(',') ? video.split(',')[1] : video
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_base64: base64, question }),
    })
  } else {
    const form = new FormData()
    form.append('video', video instanceof File ? video : new File([video], 'video.mp4', { type: 'video/mp4' }))
    form.append('question', question)
    res = await fetch(url, {
      method: 'POST',
      body: form,
    })
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { msg?: string; message?: string }
    throw new Error(err.msg || err.message || `请求失败 ${res.status}`)
  }
  const data = await res.json() as { result?: string; text?: string; answer?: string }
  return data.result ?? data.text ?? data.answer ?? ''
}
