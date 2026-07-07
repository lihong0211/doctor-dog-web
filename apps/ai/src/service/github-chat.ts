import request, { unwrapApiResponse, type ApiResponse } from './request'
import { streamRequest, type StreamRequestOptions } from '../utils/streamChat'

export interface IndexResult {
  index_id: string
  file_count: number
  chunk_count: number
  owner: string
  repo: string
}

export async function indexRepo(repoUrl: string, token?: string): Promise<IndexResult> {
  const res = await request.post('/ai/github-chat/index', {
    repo_url: repoUrl,
    github_token: token || undefined,
  }, { timeout: 300000 }) as unknown as ApiResponse<IndexResult>
  return unwrapApiResponse(res)
}

export async function askGithub(
  indexId: string,
  question: string,
  opts: StreamRequestOptions
): Promise<void> {
  await streamRequest('/ai/github-chat/ask', { index_id: indexId, question }, opts)
}
