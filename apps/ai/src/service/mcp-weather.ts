import { get } from './request'

const BASE = '/ai/mcp-weather'

export interface WeatherAgentInfo {
  name: string
  description: string
  plugins: string[]
  mcp_server?: string | null
  config_required?: boolean
  config_hint?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'function'
  content: string
  name?: string | null
  function_call?: { name: string; arguments: string }
}

export interface ChatResponse {
  reply_messages: ChatMessage[]
  steps: Array<{ type: string; data?: unknown }>
  history: ChatMessage[]
  final_answer?: string
  error?: string
}

interface InfoApiResponse {
  code: number
  msg: string
  data: WeatherAgentInfo
}

/** 获取天气助手信息与插件列表；未配置时 data 含 config_required、config_hint */
export async function fetchWeatherAgentInfo(): Promise<WeatherAgentInfo> {
  const res = (await get<InfoApiResponse>(`${BASE}/info`)) as unknown as InfoApiResponse
  if (res?.code !== 0) throw new Error(res?.msg || '请求失败')
  if (!res?.data) throw new Error('响应无 data')
  return res.data
}

const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE || 'https://home.doctor-dog.com')

export interface WeatherChatStreamCallbacks {
  onStep: (messages: ChatMessage[]) => void
  onError: (message: string) => void
}

/**
 * 流式对话：NDJSON，仅 event 为 step | error（无 done）。
 * 流结束后用最后一次 onStep 的 messages 作为下一轮 history。
 */
export async function weatherChatStream(
  messages: ChatMessage[],
  callbacks: WeatherChatStreamCallbacks
): Promise<ChatMessage[]> {
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
  let lastMessages: ChatMessage[] = []
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
            lastMessages = Array.isArray(obj.data) ? (obj.data as ChatMessage[]) : []
            callbacks.onStep(lastMessages)
          } else if (obj.event === 'error') {
            callbacks.onError((obj.data as { message?: string })?.message ?? '未知错误')
          }
        } catch {
          // 忽略单行解析错误
        }
      }
    }
    if (buffer.trim()) {
      try {
        const obj = JSON.parse(buffer.trim()) as { event: string; data?: unknown }
        if (obj.event === 'step' && obj.data) {
          lastMessages = Array.isArray(obj.data) ? (obj.data as ChatMessage[]) : []
          callbacks.onStep(lastMessages)
        } else if (obj.event === 'error') {
          callbacks.onError((obj.data as { message?: string })?.message ?? '未知错误')
        }
      } catch {
        // ignore
      }
    }
  } finally {
    reader.releaseLock()
  }
  return lastMessages
}
