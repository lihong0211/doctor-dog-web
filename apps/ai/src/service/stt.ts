/**
 * STT 语音转文字 API
 * - 流式：上传音频，SSE 按段返回
 * - 实时对讲：WebSocket 持续发 chunk，持续收文字
 */

const API_BASE = import.meta.env.DEV ? '' : 'https://home.doctor-dog.com'

export function getSttWsUrl(): string {
  if (typeof window === 'undefined') return ''
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = import.meta.env.DEV ? 'localhost:3000' : 'home.doctor-dog.com'
  return `${protocol}//${host}/ai/stt/live`
}

export interface SttStreamOptions {
  language?: string
  onText?: (text: string, segment?: { start: number; end: number }) => void
  onError?: (err: Error) => void
}

/**
 * 流式转录：上传音频（文件或 base64），按 SSE 逐段回调 onText
 */
export async function sttStream(
  audio: File | Blob | string,
  opts: SttStreamOptions = {}
): Promise<void> {
  const { language, onText, onError } = opts
  let body: FormData | string
  let contentType: string | undefined
  if (typeof audio === 'string') {
    body = JSON.stringify({
      audio_base64: audio.includes(',') ? audio.split(',')[1] : audio,
      ...(language && { language }),
    })
    contentType = 'application/json'
  } else {
    const form = new FormData()
    form.append('file', audio instanceof File ? audio : new File([audio], 'audio.webm', { type: 'audio/webm' }))
    if (language) form.append('language', language)
    body = form
    contentType = undefined
  }

  try {
    const url = API_BASE ? `${API_BASE}/ai/stt/transcribe_stream` : '/ai/stt/transcribe_stream'
    const res = await fetch(url, {
      method: 'POST',
      headers: contentType ? { 'Content-Type': contentType } : {},
      body: body as BodyInit,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { msg?: string }
      throw new Error(err.msg || `HTTP ${res.status}`)
    }
    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body')
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const obj = JSON.parse(data) as { text?: string; start?: number; end?: number; error?: string }
          if (obj.error) throw new Error(obj.error)
          if (obj.text != null) onText?.(obj.text, obj.start != null && obj.end != null ? { start: obj.start, end: obj.end } : undefined)
        } catch (e) {
          if (e instanceof Error) onError?.(e)
        }
      }
    }
    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6).trim()
      if (data !== '[DONE]') {
        try {
          const obj = JSON.parse(data) as { text?: string; start?: number; end?: number; error?: string }
          if (obj.error) throw new Error(obj.error)
          if (obj.text != null) onText?.(obj.text, obj.start != null && obj.end != null ? { start: obj.start, end: obj.end } : undefined)
        } catch (_) {}
      }
    }
  } catch (e) {
    onError?.(e instanceof Error ? e : new Error(String(e)))
  }
}
