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
}

/** POST /ai/langgraph/run（非流式，一次性返回） */
export async function runGraph(
  graph: GraphName,
  input?: RunInput
): Promise<RunResult> {
  const res = await post<RunResult>(`${BASE}/run`, { graph, input })
  const data = unwrapApiResponse(res as ApiResponse<RunResult>)
  return data
}

