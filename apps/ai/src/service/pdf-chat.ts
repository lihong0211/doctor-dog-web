import request from './request'
import { streamRequest, type StreamChunk } from '../utils/streamChat'

export interface PDFIndexResult {
  index_id: string
  page_count: number
  chunk_count: number
}

export async function indexPDF(file: File): Promise<PDFIndexResult> {
  const form = new FormData()
  form.append('pdf', file)
  const res = await request.post('/ai/pdf-chat/index', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
  return res.data
}

export async function askPDF(
  indexId: string,
  question: string,
  opts: { onChunk: (c: StreamChunk) => void }
) {
  await streamRequest('/ai/pdf-chat/ask', { index_id: indexId, question }, opts)
}
