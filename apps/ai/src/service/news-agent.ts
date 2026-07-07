import request, { unwrapApiResponse, type ApiResponse } from './request'

export interface NewsArticle {
  title: string
  url: string
  source: string
  published_at: string
  summary: string
}

export interface NewsSummary {
  summary: string
  article_count: number
  generated_at: string
}

export async function fetchNewsArticles(): Promise<NewsArticle[]> {
  const res = await request.get('/ai/news/articles', { timeout: 60000 }) as unknown as ApiResponse<NewsArticle[]>
  return unwrapApiResponse(res)
}

export async function getNewsSummary(): Promise<NewsSummary> {
  const res = await request.get('/ai/news/summary', { timeout: 60000 }) as unknown as ApiResponse<NewsSummary>
  return unwrapApiResponse(res)
}
