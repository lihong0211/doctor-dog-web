import { get } from './request'

export interface McpAgentInfo {
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

interface InfoApiResponse {
  code: number
  msg: string
  data: McpAgentInfo
}

export interface ChatStreamCallbacks {
  onStep: (messages: ChatMessage[]) => void
  onError: (message: string) => void
}

const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE || 'https://home.doctor-dog.com')

/**
 * 为一个 `/ai/mcp-xxx` 系列接口生成 fetchAgentInfo + chatStream 两个方法。
 * 5 个新接入的本地 MCP 助手（stock/scraper/data-analysis/resume/news）除了 URL 前缀外
 * 请求/响应结构完全一致，用这个工厂避免每个助手都复制一份 mcp-weather.ts。
 */
export function createMcpAgentService(base: string) {
  async function fetchAgentInfo(): Promise<McpAgentInfo> {
    const res = (await get<InfoApiResponse>(`${base}/info`)) as unknown as InfoApiResponse
    if (res?.code !== 0) throw new Error(res?.msg || '请求失败')
    if (!res?.data) throw new Error('响应无 data')
    return res.data
  }

  /**
   * 流式对话：NDJSON，仅 event 为 step | error（无 done）。
   * 流结束后用最后一次 onStep 的 messages 作为下一轮 history。
   */
  async function chatStream(messages: ChatMessage[], callbacks: ChatStreamCallbacks): Promise<ChatMessage[]> {
    const url = `${API_BASE}${base}/chat-stream`
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

    const handleLine = (line: string) => {
      const trimmed = line.trim()
      if (!trimmed) return
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

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        lines.forEach(handleLine)
      }
      if (buffer.trim()) handleLine(buffer)
    } finally {
      reader.releaseLock()
    }
    return lastMessages
  }

  return { fetchAgentInfo, chatStream }
}

export type McpAgentService = ReturnType<typeof createMcpAgentService>
