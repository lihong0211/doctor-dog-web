const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export interface TarotCard {
  name: string
  meaning: string
  reversed: boolean
  position: string
}

export async function tarotRead(
  question: string,
  spreadType: string,
  opts: { onCards: (cards: TarotCard[]) => void; onChunk: (text: string) => void; onDone?: () => void }
) {
  const res = await fetch(`${BASE_URL}/ai/tarot/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, spread_type: spreadType }),
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
        if (obj.type === 'cards') opts.onCards(obj.cards)
        else if (obj.type === 'reading') opts.onChunk(obj.response || '')
      } catch { /* ignore */ }
    }
  }
}
