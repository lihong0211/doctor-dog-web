/**
 * SSE 流式请求工具函数（使用 fetch 实现真流式）
 * 通用工具，不包含具体接口地址和参数，由调用方传入
 */

export interface StreamChunk {
  thinking?: string
  response?: string
  done: boolean
}

export interface StreamRequestOptions {
  onChunk?: (chunk: StreamChunk) => void
  onError?: (error: Error) => void
}

function getBaseUrl(): string {
  return import.meta.env.DEV ? '' : 'https://home.doctor-dog.com'
}

/**
 * 发起 SSE 流式 POST 请求（fetch + ReadableStream，真流式逐块返回）
 * @param url - 接口地址（如 /ai/ollama/chat）
 * @param data - 请求体
 * @param opts - onChunk / onError 回调
 */
export async function streamRequest(
  url: string,
  data: Record<string, unknown>,
  opts: StreamRequestOptions = {}
): Promise<void> {
  const { onChunk, onError } = opts

  try {
    const baseUrl = getBaseUrl()
    const fullUrl = baseUrl ? `${baseUrl}${url}` : url

    const res = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
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
        if (line.startsWith('data: ')) {
          const raw = line.slice(6)
          if (raw === '[DONE]') {
            continue
          }
          try {
            const chunk = JSON.parse(raw) as { thinking?: string; response?: string; done?: boolean }
            onChunk?.({
              thinking: chunk.thinking ?? '',
              response: chunk.response ?? '',
              done: chunk.done ?? false,
            })
          } catch {
            // ignore parse error
          }
        }
      }
    }

    if (buffer.startsWith('data: ')) {
      const raw = buffer.slice(6)
      if (raw !== '[DONE]') {
        try {
          const chunk = JSON.parse(raw) as { thinking?: string; response?: string; done?: boolean }
          onChunk?.({
            thinking: chunk.thinking ?? '',
            response: chunk.response ?? '',
            done: chunk.done ?? false,
          })
        } catch {
          // ignore
        }
      }
    }
    onChunk?.({ done: true })
  } catch (e) {
    onError?.(e instanceof Error ? e : new Error(String(e)))
  }
}
