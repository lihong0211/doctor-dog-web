import { streamRequest, type StreamChunk } from '../utils/streamChat'

export async function planTravel(
  params: { destination: string; days: number; budget?: string; preferences?: string; travel_style?: string },
  opts: { onChunk: (c: StreamChunk) => void }
) {
  await streamRequest('/ai/travel-agent/plan', params, opts)
}
