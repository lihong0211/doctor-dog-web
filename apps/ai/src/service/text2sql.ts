/**
 * Text2SQL API：POST /ai/text2sql
 */

import { post, unwrapApiResponse, type ApiResponse } from './request'

const BASE = '/ai/text2sql'

export interface Text2SqlResponse {
  sql: string
  data: Record<string, unknown>[]
  error?: string
}

export interface Text2SqlApiResponse {
  code: number
  msg: string
  data: Text2SqlResponse
}

/** 成功返回 data；失败抛错，且 err.data 含 sql、data 便于前端展示 */
export async function text2sql(params: {
  question: string
  model?: string
  max_rows?: number
}): Promise<Text2SqlResponse> {
  try {
    const res = await post(BASE, params) as unknown as ApiResponse<Text2SqlResponse>
    const data = res?.data ?? { sql: '', data: [] }
    if (res?.code !== 0) {
      const err = new Error(res?.msg ?? data?.error ?? '请求失败') as Error & { data?: Text2SqlResponse }
      err.data = data
      throw err
    }
    return data
  } catch (e: unknown) {
    const ax = e as { response?: { data?: ApiResponse<Text2SqlResponse> } }
    const body = ax.response?.data
    const data = body?.data ?? { sql: '', data: [] }
    const err = new Error(body?.msg ?? (data as Text2SqlResponse & { error?: string }).error ?? '请求失败') as Error & { data?: Text2SqlResponse }
    err.data = data
    throw err
  }
}

// ---------------------------------------------------------------------------
// 人工审核联动：写操作 SQL 走 generate → review(interrupt 暂停) → execute，
// 跟 LangGraph HITL 演示同一套机制（见 runHitl/resumeHitl in ./langgraph.ts）
// ---------------------------------------------------------------------------

export interface Text2SqlInterrupt {
  question: string
  sql: string
}

export interface Text2SqlHitlResult {
  threadId: string
  waitingForInput: boolean
  interrupt?: Text2SqlInterrupt
  sql: string
  answer?: string
  data?: Record<string, unknown>[]
  error?: string | null
  decision?: string
}

/** POST /ai/text2sql/run：SELECT 直接返回结果；写操作命中 interrupt 时 waitingForInput=true */
export async function runText2SqlHitl(params: {
  question: string
  model?: string
  maxRows?: number
  threadId?: string
}): Promise<Text2SqlHitlResult> {
  const res = await post<Text2SqlHitlResult>(`${BASE}/run`, {
    question: params.question,
    model: params.model,
    max_rows: params.maxRows,
    threadId: params.threadId,
  })
  return unwrapApiResponse(res as ApiResponse<Text2SqlHitlResult>)
}

/** POST /ai/text2sql/resume：resume 传 true=批准 / false=拒绝 / 字符串=编辑后批准 */
export async function resumeText2SqlHitl(threadId: string, resume: boolean | string): Promise<Text2SqlHitlResult> {
  const res = await post<Text2SqlHitlResult>(`${BASE}/resume`, { threadId, resume })
  return unwrapApiResponse(res as ApiResponse<Text2SqlHitlResult>)
}
