import request, { unwrapApiResponse, type ApiResponse } from './request'
import { streamRequest, type StreamRequestOptions } from '../utils/streamChat'

export interface Memory {
  id: number
  content: string
  type: string
}

export async function memoryChatStream(
  userId: string,
  message: string,
  opts: StreamRequestOptions
): Promise<void> {
  await streamRequest('/ai/memory-chat/chat', { user_id: userId, message }, opts)
}

export async function getMemories(userId: string): Promise<Memory[]> {
  const res = await request.get('/ai/memory-chat/memories', {
    params: { user_id: userId },
  }) as unknown as ApiResponse<Memory[]>
  return unwrapApiResponse(res)
}

export async function clearMemories(userId: string): Promise<void> {
  await request.delete('/ai/memory-chat/memories', {
    data: { user_id: userId },
  })
}
