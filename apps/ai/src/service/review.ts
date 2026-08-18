/**
 * 集中审核列表 API：text2sql / hitl 命中 interrupt 时落的待审核记录，
 * 对应后端 service/ai/review.py
 */

import { get, post, unwrapApiResponse, type ApiResponse } from './request'

const BASE = '/ai/review'

export type ReviewSource = 'text2sql' | 'hitl'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface ReviewTask {
  id: number
  source: ReviewSource
  threadId: string
  question: string
  /** text2sql 是 SQL 文本，hitl 是 AI 建议文本 */
  content: string
  /** 仅 text2sql 可能有：枚举值核对警告 */
  warnings: string[]
  status: ReviewStatus
  result: Record<string, unknown> | null
  createdAt: string | null
  resolvedAt: string | null
}

/** GET /ai/review/list?status=pending */
export async function listReviewTasks(status?: ReviewStatus, limit = 50): Promise<{ tasks: ReviewTask[]; total: number }> {
  const res = await get<{ tasks: ReviewTask[]; total: number }>(`${BASE}/list`, { params: { status, limit } })
  return unwrapApiResponse(res as ApiResponse<{ tasks: ReviewTask[]; total: number }>)
}

/** POST /ai/review/{id}/approve  content 传编辑后的内容，不传则原样批准 */
export async function approveReviewTask(id: number, content?: string): Promise<ReviewTask> {
  const res = await post<ReviewTask>(`${BASE}/${id}/approve`, content ? { content } : {})
  return unwrapApiResponse(res as ApiResponse<ReviewTask>)
}

/** POST /ai/review/{id}/reject */
export async function rejectReviewTask(id: number): Promise<ReviewTask> {
  const res = await post<ReviewTask>(`${BASE}/${id}/reject`, {})
  return unwrapApiResponse(res as ApiResponse<ReviewTask>)
}
