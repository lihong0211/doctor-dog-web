import { streamRequest, type StreamChunk } from '../utils/streamChat'

export async function wellbeingChat(
  message: string,
  sessionId: string,
  mood: string,
  opts: { onChunk: (c: StreamChunk) => void }
) {
  await streamRequest('/ai/wellbeing/chat', { message, session_id: sessionId, mood }, opts)
}
