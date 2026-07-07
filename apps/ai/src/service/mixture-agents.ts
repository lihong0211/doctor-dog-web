import request, { unwrapApiResponse, type ApiResponse } from './request'

export type StreamChunkMixture =
  | { type: 'models'; data: { model: string; answer: string }[] }
  | { type: 'aggregate'; response: string }

export async function getAvailableModels(): Promise<string[]> {
  const res = await request.get('/ai/mixture-agents/models') as unknown as ApiResponse<string[]>
  return unwrapApiResponse(res)
}

export async function mixtureChat(
  question: string,
  models: string[],
  opts: { onChunk: (c: StreamChunkMixture) => void; onError?: (e: unknown) => void }
): Promise<void> {
  const { streamRequest } = await import('../utils/streamChat')
  await streamRequest('/ai/mixture-agents/chat', { question, models }, {
    onChunk: (raw) => {
      const r = raw as unknown as StreamChunkMixture
      if (r.type) opts.onChunk(r)
    },
    onError: opts.onError,
  })
}
