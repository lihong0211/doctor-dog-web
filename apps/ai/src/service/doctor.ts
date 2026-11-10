/**
 * 医生智能体 API
 * 对接 POST /ai/doctor/chat、GET /ai/doctor/session/:id、GET /ai/doctor/history
 */

import { del, get, post, unwrapApiResponse, type ApiResponse } from './request'

const BASE = '/ai/doctor'

/** 问诊阶段：collecting=采集中，confirming=已汇总待患者确认，completed=已生成诊断 */
export type DoctorPhase = 'collecting' | 'confirming' | 'completed'

/** 患者信息字段（与后端 DoctorState.patient_info 对齐） */
export interface PatientInfo {
  name?: string
  age?: string
  gender?: string
  chief_complaint?: string
  symptom_onset?: string
  symptom_duration?: string
  severity?: string
  accompanying_symptoms?: string
  aggravating_factors?: string
  relieving_factors?: string
  past_medical_history?: string
  current_medications?: string
  allergies?: string
  family_history?: string
}

/** 单次对话响应 */
export interface DoctorChatResponse {
  session_id: string
  reply: string
  patient_info: PatientInfo
  completion_pct: number
  phase: DoctorPhase
  assessment: string | null
}

/** 会话状态（GET session） */
export interface DoctorSessionResponse {
  session_id: string
  patient_info: PatientInfo
  phase: DoctorPhase
  turn_count: number
  completion_pct: number
  assessment: string | null
  messages: { role: 'user' | 'assistant'; content: string }[]
  audit_summary: string | null
}

/**
 * POST /ai/doctor/chat
 * 发送一条患者消息，返回医生回复及当前问诊状态
 */
export async function doctorChat(
  sessionId: string | null,
  message: string
): Promise<DoctorChatResponse> {
  const body: { message: string; session_id?: string } = { message: message.trim() }
  if (sessionId) body.session_id = sessionId
  const res = await post<DoctorChatResponse>(`${BASE}/chat`, body)
  return unwrapApiResponse(res as ApiResponse<DoctorChatResponse>)
}

/**
 * GET /ai/doctor/session/:sessionId
 * 获取当前会话问诊状态（不触发对话）
 */
export async function getDoctorSession(sessionId: string): Promise<DoctorSessionResponse> {
  const res = await get<DoctorSessionResponse>(`${BASE}/session/${encodeURIComponent(sessionId)}`)
  return unwrapApiResponse(res as ApiResponse<DoctorSessionResponse>)
}

/** 历史会话列表项 */
export interface DoctorHistoryItem {
  session_id: string
  chief_complaint: string | null
  phase: DoctorPhase
  turn_count: number
  completion_pct: number
  updated_at: string | null
}

/**
 * GET /ai/doctor/history
 * 历史问诊会话列表，按最近更新时间倒序
 */
export async function getDoctorHistory(): Promise<DoctorHistoryItem[]> {
  const res = await get<DoctorHistoryItem[]>(`${BASE}/history`)
  return unwrapApiResponse(res as ApiResponse<DoctorHistoryItem[]>)
}

/**
 * DELETE /ai/doctor/session/:sessionId
 * 从历史问诊列表中删除一条会话
 */
export async function deleteDoctorSession(sessionId: string): Promise<void> {
  const res = await del<null>(`${BASE}/session/${encodeURIComponent(sessionId)}`)
  unwrapApiResponse(res as ApiResponse<null>)
}

/**
 * POST /ai/doctor/session/:sessionId/audit
 * AI 审核这次问诊：逐轮提问质量评价 + 会话质量总评 + prompt 优化建议
 */
export async function auditDoctorSession(sessionId: string): Promise<string> {
  const res = await post<{ session_id: string; audit_summary: string }>(
    `${BASE}/session/${encodeURIComponent(sessionId)}/audit`
  )
  return unwrapApiResponse(res as ApiResponse<{ session_id: string; audit_summary: string }>).audit_summary
}
