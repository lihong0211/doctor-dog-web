/**
 * Text2SQL API：POST /ai/text2sql
 */

import { post, type ApiResponse } from './request'

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
