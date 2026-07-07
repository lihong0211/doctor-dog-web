import { get, post } from './request'

const BASE = '/ai/mcp-gaode'

export interface GaodeAgentInfo {
  name: string
  description: string
  plugins: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'function'
  content: string
  name?: string | null
  function_call?: { name: string; arguments: string }
}

export interface ReplyMessage {
  role: 'user' | 'assistant' | 'function'
  content: string
  name?: string | null
}

export interface ChatStep {
  type: 'tool_call_start' | 'tool_call_end' | 'assistant'
  tool_name?: string
  arguments?: string
  output?: string
  content?: string
}

export interface ChatResponse {
  reply_messages: ReplyMessage[]
  steps: ChatStep[]
  history: ChatMessage[]
}

interface InfoApiResponse {
  code: number
  msg: string
  data: GaodeAgentInfo
}

interface ChatApiResponse {
  code: number
  msg: string
  data?: ChatResponse
  error?: string
}

/** 获取助手信息与插件列表 */
export async function fetchAgentInfo(): Promise<GaodeAgentInfo> {
  const res = (await get<InfoApiResponse>(`${BASE}/info`)) as unknown as InfoApiResponse
  if (res?.code !== 0) throw new Error(res?.msg || '请求失败')
  if (!res?.data) throw new Error('响应无 data')
  return res.data
}

/** 发送对话并获取回复（普通接口，易超时，建议用 chatStream） */
export async function chat(messages: ChatMessage[]): Promise<ChatResponse> {
  const res = (await post<ChatApiResponse>(`${BASE}/chat`, { messages })) as unknown as ChatApiResponse
  if (res?.code !== 0) throw new Error(res?.msg || res?.error || '请求失败')
  if (!res?.data) throw new Error('响应无 data')
  return res.data
}

const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE || 'https://home.doctor-dog.com')

export interface ChatStreamCallbacks {
  onStep: (messages: ChatMessage[]) => void
  onDone: (data: ChatResponse) => void
  onError: (message: string) => void
}

/** 流式对话：NDJSON 按行推送 step / done / error，不设超时 */
export async function chatStream(
  messages: ChatMessage[],
  callbacks: ChatStreamCallbacks
): Promise<void> {
  const url = `${API_BASE}${BASE}/chat-stream`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) throw new Error(res.statusText)
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
        if (!trimmed) continue
        try {
          const obj = JSON.parse(trimmed) as { event: string; data?: unknown }
          if (obj.event === 'step' && obj.data) {
            const messages = Array.isArray(obj.data) ? (obj.data as ChatMessage[]) : []
            callbacks.onStep(messages)
          } else if (obj.event === 'done' && obj.data) callbacks.onDone(obj.data as ChatResponse)
          else if (obj.event === 'error') callbacks.onError((obj.data as { message?: string })?.message ?? '未知错误')
        } catch {
          // 忽略单行解析错误
        }
      }
    }
    if (buffer.trim()) {
      try {
        const obj = JSON.parse(buffer.trim()) as { event: string; data?: unknown }
        if (obj.event === 'step' && obj.data) {
          const messages = Array.isArray(obj.data) ? (obj.data as ChatMessage[]) : []
          callbacks.onStep(messages)
        } else if (obj.event === 'done' && obj.data) callbacks.onDone(obj.data as ChatResponse)
        else if (obj.event === 'error') callbacks.onError((obj.data as { message?: string })?.message ?? '未知错误')
      } catch {
        // ignore
      }
    }
  } finally {
    reader.releaseLock()
  }
}
