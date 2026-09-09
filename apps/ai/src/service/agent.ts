/**
 * Agent API：智能体列表、图结构、执行
 * 对齐后端 agent.py：list_agents, get_agent_schema, run_agent_and_collect_steps
 */

import { get, post, unwrapApiResponse, type ApiResponse } from './request'

const BASE = '/ai/agent'

function getBaseUrl(): string {
  return import.meta.env.DEV ? '' : 'https://home.doctor-dog.com'
}

export type AgentId = 'research_agent' | 'fund_qa_agent' | 'wealth_advisor_agent'

export interface AgentMeta {
  id: AgentId | string
  name: string
  description: string
  type: 'reactive' | 'deliberative' | 'hybrid'
  icon: string
}

export type NodeType = 'input' | 'llm' | 'tool' | 'condition' | 'output' | 'process'

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

export interface AgentRunStep {
  nodeId: string
  status?: string
  duration_ms: number
  output?: Record<string, unknown>
  stepIndex?: number
  label?: string
}

export interface AgentRunResult {
  agentMeta?: AgentMeta
  graphData?: GraphData
  steps: AgentRunStep[]
  finalState?: Record<string, unknown>
  executionOrder: string[]
  totalSteps?: number
  error?: string
  allowed?: string[]
}

/** 各智能体默认输入（与后端 DEFAULT_INPUTS 对齐） */
export const DEFAULT_INPUTS: Record<string, Record<string, unknown>> = {
  research_agent: {
    research_topic: '新能源汽车行业投资机会',
    industry_focus: '电动汽车制造、电池技术',
    time_horizon: '中期',
    perception_data: null,
    world_model: null,
    reasoning_plans: null,
    selected_plan: null,
    final_report: null,
    current_phase: 'perception',
    error: null,
  },
  fund_qa_agent: {
    messages: [{ role: 'user', content: '上海迪士尼乐园的开放时间是多少？' }],
  },
  wealth_advisor_agent: {
    user_query: '根据当前市场情况，我应该如何调整投资组合？',
    customer_profile: null,
    query_type: null,
    processing_mode: null,
    market_data: null,
    analysis_results: null,
    final_response: null,
    current_phase: null,
    error: null,
  },
}

/** GET /ai/agent/schema?agent_id=xxx */
export async function getAgentSchema(agentId: string): Promise<GraphData | null> {
  try {
    const res = await get<GraphData>(`${BASE}/schema`, { params: { agent_id: agentId } })
    const data = unwrapApiResponse(res as ApiResponse<GraphData>)
    return data
  } catch {
    return null
  }
}

/**
 * POST /ai/agent/run - 执行智能体（非流式）
 * 请求体：agent_id（可选）、input（可选，不传用该智能体默认输入）
 * 错误：code !== 0 抛错；或 code=0 时 data.error 存在，返回的 data 中带 error、可选 allowed
 */
export async function runAgent(
  agentId: string,
  inputData?: Record<string, unknown>
): Promise<AgentRunResult> {
  const res = await post<AgentRunResult>(
    `${BASE}/run`,
    { agent_id: agentId, stream: false, input: inputData },
    { timeout: 300_000 },
  )
  const data = unwrapApiResponse(res as ApiResponse<AgentRunResult>)
  return data
}

export interface AgentStreamCallbacks {
  onInit?: (graphData: GraphData, agentMeta: AgentMeta) => void
  onStep?: (step: AgentRunStep) => void
  onDone?: (result: AgentRunResult) => void
  onError?: (error: Error) => void
}

/**
 * POST /ai/agent/run - 执行智能体（流式 SSE）
 * 依次触发 onInit → onStep（每步一次）→ onDone
 */
export async function runAgentStream(
  agentId: string,
  inputData: Record<string, unknown> | undefined,
  callbacks: AgentStreamCallbacks,
): Promise<void> {
  const { onInit, onStep, onDone, onError } = callbacks
  try {
    const res = await fetch(`${getBaseUrl()}${BASE}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, stream: true, input: inputData }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { msg?: string }
      throw new Error(err.msg ?? `HTTP ${res.status}`)
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let streamEnded = false

    const handleLine = (line: string): boolean => {
      if (!line.startsWith('data: ')) return false
      const raw = line.slice(6).trim()
      if (raw === '[DONE]') return true
      try {
        const event = JSON.parse(raw) as { type: string; error?: string } & Record<string, unknown>
        if (event.type === 'init') {
          onInit?.(event.graphData as GraphData, event.agentMeta as AgentMeta)
        } else if (event.type === 'step') {
          onStep?.(event.step as AgentRunStep)
        } else if (event.type === 'done') {
          const { type: _t, ...rest } = event
          onDone?.(rest as unknown as AgentRunResult)
          return true
        } else if (event.type === 'error') {
          onError?.(new Error(typeof event.error === 'string' ? event.error : '执行失败'))
          return true
        }
      } catch {
        // ignore malformed JSON lines
      }
      return false
    }

    while (!streamEnded) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (handleLine(line)) {
          streamEnded = true
          break
        }
      }
      if (streamEnded) break
    }
    if (!streamEnded && buffer) handleLine(buffer)
  } catch (e) {
    onError?.(e instanceof Error ? e : new Error(String(e)))
  }
}
