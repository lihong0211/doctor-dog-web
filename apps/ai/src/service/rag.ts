/**
 * RAG API：/ai/rag/*
 * 基于知识库的检索与问答，支持 Query 改写（CASEA）与 Rerank（DashScope）
 */

import { get, post, type ApiResponse, unwrapApiResponse } from './request'

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
  /** 落库的 agent_trace 行 id（graph_name="rag"），落库失败时为 null；用来调 /ai/langgraph/trace/feedback */
  traceId?: number | null
}

/** RAGAS 评测打分：null 表示该指标未算（要么没传 ground_truth，要么该指标计算失败） */
export interface RagEvaluateScores {
  faithfulness?: number | null
  answer_relevancy?: number | null
  context_precision?: number | null
  context_recall?: number | null
  answer_correctness?: number | null
  /** 计算失败的指标名 -> 错误信息 */
  _errors?: Record<string, string>
}

export interface RagEvaluateResponse {
  question: string
  answer: string
  contexts: string[]
  ground_truth: string | null
  scores: RagEvaluateScores
}

type RagKbIdentifier =
  | { knowledge_base_id?: number; kb_id?: number }
  | { knowledge_base_name?: string; kb_name?: string; db_name?: string; db?: string; name?: string; kb?: string }

/** RAG 检索（仅向量检索，不生成答案） */
export async function ragSearch(params: RagKbIdentifier & {
  query: string
  top_k?: number
  /** 最低相关度阈值（相似度，0~1，越大越严格）：低于此值的结果会被过滤，不传则不过滤 */
  score_threshold?: number
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
  /** 最低相关度阈值（相似度，0~1，越大越严格）：低于此值的结果会被过滤，不传则不过滤 */
  score_threshold?: number
  model?: string
  enable_query_rewrite?: boolean
  enable_rerank?: boolean
  conversation_history?: string | Array<{ role: string; content: string }>
}): Promise<RagAskResponse> {
  return unwrapApiResponse(
    (await post(BASE + '/ask', params)) as unknown as ApiResponse<RagAskResponse>
  )
}

/**
 * RAGAS 评测：不传 answer/contexts 时会先跑一次真实 RAG（复用 /ai/rag/ask 同一条 rag_chat 链路）
 * 再打分；传了 ground_truth 才会算 context_precision/context_recall/answer_correctness。
 */
export async function ragEvaluate(params: RagKbIdentifier & {
  question: string
  top_k?: number
  ground_truth?: string
  answer?: string
  contexts?: string[]
}): Promise<RagEvaluateResponse> {
  return unwrapApiResponse(
    (await post(BASE + '/evaluate', params)) as unknown as ApiResponse<RagEvaluateResponse>
  )
}

// ---------------------------------------------------------------------------
// RAGAS 测试集：喂知识库分段自动生成「问题-上下文-标准答案」三元组，落库供反复回归评测
// ---------------------------------------------------------------------------

export interface RagTestsetItem {
  id: number
  kb_id: number
  kb_name: string | null
  question: string
  ground_truth: string
  source_context?: string | null
  synthesizer: string | null
  created_at?: string | null
}

/** POST /ai/rag/testset/generate —— 慢接口，实测 10 个分段生成几条题目要 1~2 分钟，务必设够超时 */
export async function generateTestset(kbId: number, size = 10): Promise<{ items: RagTestsetItem[]; total: number }> {
  return unwrapApiResponse(
    (await post(BASE + '/testset/generate', { kb_id: kbId, size }, { timeout: 300_000 })) as unknown as ApiResponse<{
      items: RagTestsetItem[]
      total: number
    }>
  )
}

/** GET /ai/rag/testset/list?kb_id=xxx */
export async function listTestset(kbId: number): Promise<{ items: RagTestsetItem[]; total: number }> {
  return unwrapApiResponse(
    (await get(BASE + '/testset/list', { params: { kb_id: kbId } })) as unknown as ApiResponse<{
      items: RagTestsetItem[]
      total: number
    }>
  )
}

export interface BatchEvalResult {
  id: number
  question: string
  answer: string | null
  scores: RagEvaluateScores
  error: string | null
}

export interface BatchEvalResponse {
  results: BatchEvalResult[]
  summary: RagEvaluateScores
  summaryMin: RagEvaluateScores
  total: number
}

/** POST /ai/rag/testset/evaluate —— 慢接口，耗时 ≈ 题目数 × 15~20s，务必设够超时 */
export async function batchEvaluateTestset(kbId: number, testsetIds?: number[]): Promise<BatchEvalResponse> {
  return unwrapApiResponse(
    (await post(
      BASE + '/testset/evaluate',
      { kb_id: kbId, testsetIds },
      { timeout: 600_000 }
    )) as unknown as ApiResponse<BatchEvalResponse>
  )
}
