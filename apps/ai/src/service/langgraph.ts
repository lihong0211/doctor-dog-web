/**
 * LangGraph API：图结构 GET，执行 POST
 */

import { get, post, unwrapApiResponse, type ApiResponse } from './request'

const BASE = '/ai/langgraph'

export type NodeType =
  | 'input'
  | 'llm'
  | 'tool'
  | 'condition'
  | 'output'
  | 'process'

export interface GraphNodeData {
  id: string
  name: string
  type: NodeType
  icon?: string
  description?: string
}

export interface GraphEdgeData {
  source: string
  target: string
  type?: 'normal' | 'conditional' | 'parallel'
}

export interface GraphData {
  nodes: GraphNodeData[]
  edges: GraphEdgeData[]
  executionOrder?: string[]
}

export type GraphName = 'router' | 'loop' | 'parallel'

/** 图结构缓存：同一 name 只请求一次，切换时直接返回缓存 */
const graphCache = new Map<GraphName, GraphData>()

/** GET /ai/langgraph/graph?name=xxx（结果按 name 缓存） */
export async function getGraph(name: GraphName = 'router'): Promise<GraphData> {
  if (graphCache.has(name)) return graphCache.get(name)!
  const res = await get<GraphData>(`${BASE}/graph`, { params: { name } })
  const data = unwrapApiResponse(res as ApiResponse<GraphData>)
  graphCache.set(name, data)
  return data
}

export interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface RunInput {
  query?: string
  intent?: string
  response?: string
  history?: HistoryMessage[]
  [key: string]: unknown
}

export interface RunStep {
  nodeId: string
  status: string
  duration_ms: number
  output?: Record<string, unknown>
  /** 后端返回的步序号（0-based），循环图中同一节点会出现多次 */
  stepIndex?: number
}

export interface RunResult {
  graphData?: GraphData
  steps: RunStep[]
  finalState?: Record<string, unknown>
  executionOrder: string[]
  /** 本次执行的总步数（含循环重复执行），后端返回 */
  totalSteps?: number
  /** 本次执行落的 agent_trace 行 id，落库失败时为 null；用它调 submitTraceFeedback */
  traceId?: number | null
}

/**
 * POST /ai/langgraph/run（非流式，一次性返回）
 * threadId：仅 router 图的 chat 分支会用（服务端 checkpointer 记住上下文），传了就不需要再传 history；
 * loop/parallel 没接 checkpointer，仍走 history 兼容路径。
 */
export async function runGraph(
  graph: GraphName,
  input?: RunInput,
  threadId?: string
): Promise<RunResult> {
  const res = await post<RunResult>(`${BASE}/run`, { graph, input, threadId })
  const data = unwrapApiResponse(res as ApiResponse<RunResult>)
  return data
}

// ---------------------------------------------------------------------------
// 人工处理（HITL）：analyze → review(interrupt 暂停) → process | END
// ---------------------------------------------------------------------------

export interface HitlInterrupt {
  question: string
  suggestion: string
}

export interface HitlRunResult {
  threadId: string
  waitingForInput: boolean
  interrupt?: HitlInterrupt
  finalState?: Record<string, unknown>
  response?: string
}

/** 发起一次 HITL 流程：命中 interrupt 时 waitingForInput=true，需要调 resumeHitl 才能继续 */
export async function runHitl(threadId: string, query: string): Promise<HitlRunResult> {
  const res = await post<HitlRunResult>(`${BASE}/run`, { graph: 'hitl', threadId, query })
  return unwrapApiResponse(res as ApiResponse<HitlRunResult>)
}

/** resume 传 true=批准 / false=拒绝 / 字符串=编辑后批准 */
export async function resumeHitl(threadId: string, resume: boolean | string): Promise<HitlRunResult> {
  const res = await post<HitlRunResult>(`${BASE}/run`, { graph: 'hitl', threadId, resume })
  return unwrapApiResponse(res as ApiResponse<HitlRunResult>)
}

// ---------------------------------------------------------------------------
// 回流机制：反馈采集 + bad case 挖掘
// ---------------------------------------------------------------------------

export type TraceRating = 'good' | 'bad'

/** POST /ai/langgraph/trace/feedback */
export async function submitTraceFeedback(traceId: number, rating: TraceRating, note?: string): Promise<void> {
  const res = await post<{ traceId: number; rating: TraceRating }>(`${BASE}/trace/feedback`, {
    traceId,
    rating,
    note,
  })
  unwrapApiResponse(res as ApiResponse<{ traceId: number; rating: TraceRating }>)
}

export interface BadCase {
  id: number
  graph_name: string
  thread_id: string | null
  user_id: string | null
  input_summary: string | null
  output_summary: string | null
  status: string
  error_message: string | null
  feedback: TraceRating | null
  feedback_note: string | null
  created_at: string | null
}

/** GET /ai/langgraph/trace/bad-cases?graph=xxx&limit=n */
export async function listBadCases(graph?: string, limit = 50): Promise<{ cases: BadCase[]; total: number }> {
  const res = await get<{ cases: BadCase[]; total: number }>(`${BASE}/trace/bad-cases`, {
    params: { graph, limit },
  })
  return unwrapApiResponse(res as ApiResponse<{ cases: BadCase[]; total: number }>)
}

// ---------------------------------------------------------------------------
// 副作用回滚：Saga 补偿事务演示（create_booking → charge_payment，真实 MySQL 副作用）
// ---------------------------------------------------------------------------

export interface SagaResult {
  status: 'committed' | 'rolled_back'
  completed: string[]
  compensated: string[]
  error: string | null
  threadId: string
}

/** POST /ai/langgraph/saga-demo */
export async function runSagaDemo(item: string, amount: number, failPayment: boolean): Promise<SagaResult> {
  const res = await post<SagaResult>(`${BASE}/saga-demo`, { item, amount, failPayment })
  return unwrapApiResponse(res as ApiResponse<SagaResult>)
}
