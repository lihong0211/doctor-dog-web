/**
 * 医生智能体 API
 * 对接 POST /ai/doctor/chat、GET /ai/doctor/session/:id
 */

import { get, post, unwrapApiResponse, type ApiResponse } from './request'

const BASE = '/ai/doctor'

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
  phase: 'collecting' | 'completed'
  assessment: string | null
}

/** 会话状态（GET session） */
export interface DoctorSessionResponse {
  session_id: string
  patient_info: PatientInfo
  phase: 'collecting' | 'completed'
  turn_count: number
  completion_pct: number
  assessment: string | null
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
