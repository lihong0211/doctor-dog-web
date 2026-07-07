/**
 * RAG API：/ai/rag/*
 * 基于知识库的检索与问答，支持 Query 改写（CASEA）与 Rerank（DashScope）
 */

import { post, type ApiResponse, unwrapApiResponse } from './request'

const BASE = '/ai/rag'

export interface RagSearchSource {
  doc_id?: number
  id?: number
  text?: string
  category?: string | null
  metadata?: unknown
  rank: number
  distance?: number | null
  relevance_score?: number | null
}

export interface RagSearchResponse {
  knowledge_base: string
  query: string
  rewritten_query?: string | null
  before: RagSearchSource[]
  results: Array<{
    rank: number
    distance: number
    doc: {
      id?: number
      text: string
      category?: string | null
      metadata?: unknown
    }
  }>
}

export interface RagAskResponse {
  answer: string
  sources: RagSearchSource[]
  model: string
  rewritten_query?: string | null
  before: RagSearchSource[]
}

type RagKbIdentifier =
  | { knowledge_base_id?: number; kb_id?: number }
  | { knowledge_base_name?: string; kb_name?: string; db_name?: string; db?: string; name?: string; kb?: string }

/** RAG 检索（仅向量检索，不生成答案） */
export async function ragSearch(params: RagKbIdentifier & {
  query: string
  top_k?: number
  enable_query_rewrite?: boolean
  enable_rerank?: boolean
}): Promise<RagSearchResponse> {
  return unwrapApiResponse(
    (await post(BASE + '/search', params)) as unknown as ApiResponse<RagSearchResponse>
  )
}

/** RAG 问答（检索 + 生成答案，支持 Query 改写和 Rerank） */
export async function ragAsk(params: RagKbIdentifier & {
  question?: string
  query?: string
  top_k?: number
  model?: string
  enable_query_rewrite?: boolean
  enable_rerank?: boolean
  conversation_history?: string | Array<{ role: string; content: string }>
}): Promise<RagAskResponse> {
  return unwrapApiResponse(
    (await post(BASE + '/ask', params)) as unknown as ApiResponse<RagAskResponse>
  )
}
