import request, { unwrapApiResponse, type ApiResponse } from './request'

export interface ScrapeResult {
  url: string
  title: string
  word_count: number
  extracted: Record<string, unknown>
}

export async function extractWebContent(
  url: string,
  schema?: Record<string, string>
): Promise<ScrapeResult> {
  const res = await request.post('/ai/web-scraper/extract', { url, schema }, {
    timeout: 60000,
  }) as unknown as ApiResponse<ScrapeResult>
  return unwrapApiResponse(res)
}
