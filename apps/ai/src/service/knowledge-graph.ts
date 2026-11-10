import request, { unwrapApiResponse, type ApiResponse } from './request'

declare const __KG_LOCAL_AUTO_CONNECT__: boolean

export function isLocalAutoConnectEnabled(): boolean {
  return import.meta.env.DEV && __KG_LOCAL_AUTO_CONNECT__
}

export type SearchMode = 'cypher' | 'local' | 'global'
export interface GraphNode { id: string; name: string; type: string; properties: Record<string, unknown> }
export interface GraphEdge { id: string; source: string; target: string; type: string }
export interface GraphData { nodes: GraphNode[]; edges: GraphEdge[]; truncated: boolean }
export interface GraphOverview {
  entities: number; relations: number; movies: number; communities: number
  entity_types: { type: string; count: number }[]
  community_levels: { level: number; count: number }[]
}
export interface SearchResult { error?: string | null; [key: string]: unknown }
export interface MergeContext extends SearchResult {
  items?: { source: string; text: string; score?: number }[]
  communities?: { key?: string; title?: string; summary?: string; score?: number }[]
}
export interface GraphQuery { query?: string; entity_type?: string; entity_id?: string; limit?: number }

const auth = (key: string, signal?: AbortSignal) => ({
  ...(key ? { headers: { 'X-API-Key': key } } : {}), signal,
})
const base = '/ai/kg'

export async function getOverview(key: string, signal?: AbortSignal): Promise<GraphOverview> {
  const response = await request.get<never, ApiResponse<GraphOverview>>(`${base}/overview`, auth(key, signal))
  return unwrapApiResponse(response)
}

export async function getGraph(key: string, params: GraphQuery, signal?: AbortSignal): Promise<GraphData> {
  const response = await request.get<never, ApiResponse<GraphData>>(`${base}/graph`, {
    ...auth(key, signal), params: { limit: 120, ...params },
  })
  return unwrapApiResponse(response)
}

export async function searchGraph(key: string, mode: SearchMode, question: string, signal?: AbortSignal) {
  const response = await request.post<never, ApiResponse<SearchResult>>(`${base}/search`,
    { question, mode }, auth(key, signal))
  return unwrapApiResponse(response)
}

export async function mergeSearch(key: string, question: string, results: Record<SearchMode, SearchResult | null>, signal?: AbortSignal) {
  const response = await request.post<never, ApiResponse<MergeContext>>(`${base}/merge`,
    { question, ...results }, auth(key, signal))
  return unwrapApiResponse(response)
}

export async function answerQuestion(key: string, question: string, context: MergeContext, signal?: AbortSignal) {
  const response = await request.post<never, ApiResponse<{ answer: string }>>(`${base}/answer`,
    { question, context }, auth(key, signal))
  return unwrapApiResponse(response)
}
