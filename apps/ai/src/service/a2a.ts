import { post } from './request'

const BASE = '/ai/a2a'

/** 链路单步执行记录 */
export interface A2AChainStep {
  step_index: number
  agent_name: string
  agent_version: string
  status: 'completed' | 'failed'
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

/** 执行 A2A 三智能体内容生成链（同步，可能较久） */
export async function runA2AChain(topic: string): Promise<A2AChainResult> {
  const res = (await post<A2AApiResponse>(`${BASE}/chain`, { topic }, { timeout: 120000 })) as unknown as A2AApiResponse
  if (res?.code !== 0) throw new Error(res?.msg || '请求失败')
  if (!res?.data) throw new Error('响应无 data')
  return res.data
}

/** 从 Task 中安全取第一个 artifact 的 data */
export function getTaskArtifactData<T>(task: A2ATask | undefined): T | null {
  const part = task?.artifacts?.[0]?.parts?.[0]
  return (part?.data as T) ?? null
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

export type A2AStreamEvent = A2AStreamStepStart | A2AStreamStepDone | A2AStreamChainDone | A2AStreamChainError

export interface A2AStreamCallbacks {
  onStepStart?: (step: number, agent: string) => void
  onStepDone?: (step: number, agent: string, data: unknown) => void
  onChainDone?: (data: SummaryArtifactData | undefined, chain: A2AChainStep[] | undefined) => void
  onChainError?: (error: string) => void
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
          }
        } catch {
          // 忽略单行解析错误
        }
      }
    }
    if (buffer.trim() && buffer.trim().startsWith('data: ')) {
      const raw = buffer.trim().slice(6)
      if (raw !== '[DONE]') {
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
          }
        } catch {
          // ignore
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/** 根据流式 step_done 与 chain_done 组装的「类 A2AChainResult」，供页面复用展示 */
export function buildChainResultFromStream(
  stepsData: (OutlineArtifactData | DocArtifactData | SummaryArtifactData | null)[],
  chain: A2AChainStep[],
  finalSummary: SummaryArtifactData | null
): A2AChainResult {
  const makeTask = (data: OutlineArtifactData | DocArtifactData | SummaryArtifactData | null): A2ATask =>
    data
      ? {
          id: '',
          contextId: '',
          status: { state: 'completed' },
          artifacts: [{ artifactId: '', name: '', parts: [{ type: 'data', data }] }],
        }
      : ({ id: '', contextId: '', status: { state: 'failed' }, artifacts: [] } as A2ATask)

  const tasks: A2ATask[] = [
    makeTask(stepsData[0] ?? null),
    makeTask(stepsData[1] ?? null),
    makeTask(stepsData[2] ?? finalSummary),
  ]
  const final_task = tasks[2] ?? makeTask(finalSummary)
  return { chain, tasks, final_task }
}
