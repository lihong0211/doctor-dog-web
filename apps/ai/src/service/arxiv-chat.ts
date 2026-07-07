import request from './request'
import { streamRequest, type StreamChunk } from '../utils/streamChat'

export interface ArxivIndexResult {
  index_id: string
  arxiv_id: string
  title: string
  abstract: string
  page_count: number
}

export async function indexArxiv(arxivId: string): Promise<ArxivIndexResult> {
  const res = await request.post('/ai/arxiv-chat/index', { arxiv_id: arxivId }, { timeout: 120000 })
  return res.data
}

export async function askArxiv(
  indexId: string,
  question: string,
  opts: { onChunk: (c: StreamChunk) => void }
) {
  await streamRequest('/ai/arxiv-chat/ask', { index_id: indexId, question }, opts)
}
