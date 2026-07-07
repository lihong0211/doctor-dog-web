import request, { unwrapApiResponse, type ApiResponse } from './request'
import { streamRequest, type StreamRequestOptions } from '../utils/streamChat'

export interface IndexResult {
  index_id: string
  video_id: string
  segment_count: number
  language: string
}

export async function indexVideo(videoUrl: string): Promise<IndexResult> {
  const res = await request.post('/ai/youtube-chat/index', {
    video_url: videoUrl,
  }, { timeout: 120000 }) as unknown as ApiResponse<IndexResult>
  return unwrapApiResponse(res)
}

export async function askYoutube(
  indexId: string,
  question: string,
  opts: StreamRequestOptions
): Promise<void> {
  await streamRequest('/ai/youtube-chat/ask', { index_id: indexId, question }, opts)
}
