import { streamRequest, type StreamChunk } from '../utils/streamChat'

export async function analyzeStartup(
  params: { idea: string; industry?: string; target_market?: string },
  opts: { onChunk: (c: StreamChunk) => void }
) {
  await streamRequest('/ai/startup-trend/analyze', params, opts)
}
