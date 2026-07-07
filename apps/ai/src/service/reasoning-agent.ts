const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export async function reasoningChat(
  question: string,
  opts: { onThink: (text: string) => void; onAnswer: (text: string) => void; onDone?: () => void }
) {
  const res = await fetch(`${BASE_URL}/ai/reasoning-agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.body) throw new Error('No response body')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (raw === '[DONE]') { opts.onDone?.(); return }
      try {
        const obj = JSON.parse(raw)
        if (obj.type === 'think') opts.onThink(obj.content || '')
        else if (obj.type === 'answer') opts.onAnswer(obj.content || '')
      } catch { /* ignore */ }
    }
  }
}
