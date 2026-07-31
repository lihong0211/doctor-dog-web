import { post } from './request'

const BASE = '/ai/a2a'

/** 链路单步执行记录 */
export interface A2AChainStep {
  step_index: number
  agent_name: string
  agent_version: string
  status: 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'canceled'
  input_summary: string
  output_summary: string
  started_at: string
  ended_at: string
  error_message: string | null
}

/** Artifact Part 的 data 结构（根据 type 不同） */
export interface OutlineArtifactData {
  topic: string
  sections: Array<{ title: string; key_points: string[] }>
}

export interface DocArtifactData {
  title: string
  paragraphs: Array<{ heading: string; text: string }>
}

export interface SummaryArtifactData {
  title: string
  summary: string
  key_points: string[]
}

/** Task 中 status.state 枚举 */
export type A2ATaskState =
  | 'submitted'
  | 'working'
  | 'completed'
  | 'failed'
  | 'input-required'
  | 'canceled'

export interface A2ATask {
  id: string
  contextId: string
  status: {
    state: A2ATaskState
    message?: unknown
    timestamp?: string
  }
  artifacts: Array<{
    artifactId: string
    name: string
    description?: string
    parts: Array<{
      type: string
      data?: OutlineArtifactData | DocArtifactData | SummaryArtifactData
      metadata?: unknown
    }>
    index?: number
    lastChunk?: boolean
    metadata?: unknown
  }>
  history?: unknown[]
  metadata?: unknown
}

export interface A2AChainResult {
  chain: A2AChainStep[]
  tasks: A2ATask[]
  final_task: A2ATask
}

interface A2AApiResponse {
  code: number
  msg: string
  data: A2AChainResult | null
}

/** 执行 A2A 多智能体内容生成链（同步，可能较久） */
export async function runA2AChain(topic: string): Promise<A2AChainResult> {
  const res = (await post<A2AApiResponse>(`${BASE}/chain`, { topic }, { timeout: 120000 })) as unknown as A2AApiResponse
  if (res?.code !== 0) throw new Error(res?.msg || '请求失败')
  if (!res?.data) throw new Error('响应无 data')
  return res.data
}

/** 为处于 input-required 状态的链路补充信息并继续执行（同步，返回完整链路结果） */
export async function resumeA2AChain(contextId: string, answer: string): Promise<A2AChainResult> {
  const res = (await post<A2AApiResponse>(
    `${BASE}/chain/resume`,
    { context_id: contextId, answer },
    { timeout: 120000 }
  )) as unknown as A2AApiResponse
  if (res?.code !== 0) throw new Error(res?.msg || '请求失败')
  if (!res?.data) throw new Error('响应无 data')
  return res.data
}

/** 从 Task 中安全取第一个 artifact 的 data */
export function getTaskArtifactData<T>(task: A2ATask | undefined): T | null {
  const part = task?.artifacts?.[0]?.parts?.[0]
  return (part?.data as T) ?? null
}

/**
 * 按 Agent 名从 chain 找该 Agent 最后一次出现的位置，取对应的 Task。
 * 链路步数不固定（Host Agent 动态路由，某个 Agent 也可能因暂停/续接出现两次），
 * 不能像固定 3 步时那样直接按数组下标取。
 * chain 与 tasks 逐步一一对应，只有网络异常导致某步完全没拿到 Task 时才会少一条
 * （且只会发生在最后一步，因为异常会终止整条链），所以用下标兜底越界即可。
 */
export function getTaskByAgent(result: A2AChainResult | null, agentName: string): A2ATask | undefined {
  if (!result) return undefined
  for (let i = result.chain.length - 1; i >= 0; i--) {
    if (result.chain[i].agent_name === agentName && i < result.tasks.length) {
      return result.tasks[i]
    }
  }
  return undefined
}

const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE || 'https://home.doctor-dog.com')

/** 流式事件：step_start */
export interface A2AStreamStepStart {
  event: 'step_start'
  step?: number
  agent?: string
}

/** 流式事件：step_done，event.data 为该步骤的 artifact data */
export interface A2AStreamStepDone {
  event: 'step_done'
  step?: number
  agent?: string
  data?: OutlineArtifactData | DocArtifactData | SummaryArtifactData
}

/** 流式事件：chain_done，data 为最终摘要，chain 为执行链摘要 */
export interface A2AStreamChainDone {
  event: 'chain_done'
  data?: SummaryArtifactData
  chain?: A2AChainStep[]
}

/** 流式事件：chain_error */
export interface A2AStreamChainError {
  event: 'chain_error'
  error?: string
}

/** 流式事件：chain_paused，某步骤进入 input-required，链路暂停等待用户补充信息 */
export interface A2AStreamChainPaused {
  event: 'chain_paused'
  step?: number
  agent?: string
  context_id?: string
  message?: string
}

export type A2AStreamEvent =
  | A2AStreamStepStart
  | A2AStreamStepDone
  | A2AStreamChainDone
  | A2AStreamChainError
  | A2AStreamChainPaused

export interface A2AStreamCallbacks {
  onStepStart?: (step: number, agent: string) => void
  onStepDone?: (step: number, agent: string, data: unknown) => void
  onChainDone?: (data: SummaryArtifactData | undefined, chain: A2AChainStep[] | undefined) => void
  onChainError?: (error: string) => void
  onChainPaused?: (contextId: string, question: string, agent: string) => void
}

function dispatchA2AStreamEvent(raw: string, callbacks: A2AStreamCallbacks): void {
  try {
    const event = JSON.parse(raw) as A2AStreamEvent
    if (event.event === 'step_start') {
      const e = event as A2AStreamStepStart
      callbacks.onStepStart?.(e.step ?? 0, e.agent ?? '')
    } else if (event.event === 'step_done') {
      const e = event as A2AStreamStepDone
      callbacks.onStepDone?.(e.step ?? 0, e.agent ?? '', e.data)
    } else if (event.event === 'chain_done') {
      const e = event as A2AStreamChainDone
      callbacks.onChainDone?.(e.data, e.chain)
    } else if (event.event === 'chain_error') {
      const e = event as A2AStreamChainError
      callbacks.onChainError?.(e.error ?? '未知错误')
    } else if (event.event === 'chain_paused') {
      const e = event as A2AStreamChainPaused
      callbacks.onChainPaused?.(e.context_id ?? '', e.message ?? '该步骤需要补充信息才能继续', e.agent ?? '')
    }
  } catch {
    // 忽略单行解析错误
  }
}

/** 用 ReadableStream 消费 SSE 流，解析 data: 行，[DONE] 结束；按 event 回调 */
export async function runA2AChainStream(topic: string, callbacks: A2AStreamCallbacks): Promise<void> {
  const url = `${API_BASE}${BASE}/chain/stream`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  })
  if (!res.ok) throw new Error(res.statusText || '请求失败')
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const raw = trimmed.slice(6)
        if (raw === '[DONE]') return
        dispatchA2AStreamEvent(raw, callbacks)
      }
    }
    if (buffer.trim() && buffer.trim().startsWith('data: ')) {
      const raw = buffer.trim().slice(6)
      if (raw !== '[DONE]') {
        dispatchA2AStreamEvent(raw, callbacks)
      }
    }
  } finally {
    reader.releaseLock()
  }
}
