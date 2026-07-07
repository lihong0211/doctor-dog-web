import request from './request'
import { streamRequest, type StreamChunk } from '../utils/streamChat'

export interface Scenario {
  key: string
  name: string
  context: string
}

export async function getScenarios(): Promise<Scenario[]> {
  const res = await request.get('/ai/negotiation/scenarios')
  return res.data
}

export async function negotiationChat(
  params: { message: string; scenario: string; user_role: string; history: { role: string; content: string }[] },
  opts: { onChunk: (c: StreamChunk) => void }
) {
  await streamRequest('/ai/negotiation/chat', params, opts)
}
