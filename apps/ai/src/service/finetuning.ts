const BASE = '/ai/finetuning'
const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE || 'https://home.doctor-dog.com')

export interface FinetuningMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface FinetuningOptions {
  temperature?: number
  num_predict?: number
  top_p?: number
  repeat_penalty?: number
}

export interface FinetuningChatRequest {
  messages: FinetuningMessage[]
  stream?: boolean
  compare?: boolean
  options?: FinetuningOptions
}

/** 非流式响应 */
export interface FinetuningChatResponse {
  code?: number
  msg?: string
  message?: { role: string; content: string; base_content?: string; lora_content?: string }
  base?: string
  lora?: string
}

/** 非流式对话 */
export async function finetuningChat(payload: FinetuningChatRequest): Promise<FinetuningChatResponse> {
  const url = `${API_BASE}${BASE}/chat`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, stream: false }),
  })
  const data = (await res.json()) as FinetuningChatResponse
  if (data?.code !== 0) throw new Error(data?.msg || '请求失败')
  return data
}

export interface FinetuningStreamCallbacks {
  onChunk: (content: string) => void
  onDone: () => void
  onError: (err: string) => void
}

/** 流式对话（普通模式） */
export async function finetuningChatStream(
  payload: Omit<FinetuningChatRequest, 'stream'>,
  callbacks: FinetuningStreamCallbacks
): Promise<void> {
  const url = `${API_BASE}${BASE}/chat`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, stream: true, compare: false }),
  })
  if (!res.ok) throw new Error(res.statusText || '请求失败')
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const raw = trimmed.slice(6)
        if (raw === '[DONE]') {
          callbacks.onDone()
          return
        }
        try {
          const obj = JSON.parse(raw) as { response?: string; error?: string }
          if (obj.error) callbacks.onError(obj.error)
          else if (obj.response) callbacks.onChunk(obj.response)
        } catch {
          // ignore
        }
      }
    }
    if (buffer.trim().startsWith('data: ')) {
      const raw = buffer.trim().slice(6)
      if (raw === '[DONE]') callbacks.onDone()
    }
  } finally {
    reader.releaseLock()
  }
}

export interface FinetuningCompareStreamCallbacks {
  onBaseChunk: (content: string) => void
  onLoraChunk: (content: string) => void
  onBaseDone?: () => void
  onLoraDone?: () => void
  onDone: () => void
  onError: (err: string) => void
}

/** 流式对话（对比 base / lora） */
export async function finetuningChatStreamCompare(
  payload: Omit<FinetuningChatRequest, 'stream' | 'compare'>,
  callbacks: FinetuningCompareStreamCallbacks
): Promise<void> {
  const url = `${API_BASE}${BASE}/chat`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, stream: true, compare: true }),
  })
  if (!res.ok) throw new Error(res.statusText || '请求失败')
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const raw = trimmed.slice(6)
        if (raw === '[DONE]') {
          callbacks.onDone()
          return
        }
        try {
          const obj = JSON.parse(raw) as {
            source?: 'base' | 'lora'
            content?: string
            done?: boolean
            error?: string
          }
          if (obj.error) callbacks.onError(obj.error)
          else if (obj.source === 'base') {
            if (obj.done) callbacks.onBaseDone?.()
            else if (obj.content !== undefined) callbacks.onBaseChunk(obj.content)
          } else if (obj.source === 'lora') {
            if (obj.done) callbacks.onLoraDone?.()
            else if (obj.content !== undefined) callbacks.onLoraChunk(obj.content)
          }
        } catch {
          // ignore
        }
      }
    }
    if (buffer.trim().startsWith('data: ')) {
      const raw = buffer.trim().slice(6)
      if (raw === '[DONE]') callbacks.onDone()
    }
  } finally {
    reader.releaseLock()
  }
}
