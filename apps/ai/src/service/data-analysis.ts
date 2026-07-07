import request, { unwrapApiResponse, type ApiResponse } from './request'

export interface ColumnInfo {
  name: string
  type: string
}

export interface UploadDataResponse {
  session_id: string
  columns: ColumnInfo[]
  row_count: number
  preview: (string | number | null)[][]
}

export interface QueryDataResponse {
  sql: string
  columns: string[]
  rows: (string | number | null)[][]
}

export async function uploadDataFile(file: File): Promise<UploadDataResponse> {
  const form = new FormData()
  form.append('file', file)
  const res = await request.post('/ai/data-analysis/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  }) as unknown as ApiResponse<UploadDataResponse>
  return unwrapApiResponse(res)
}

export async function queryData(sessionId: string, question: string): Promise<QueryDataResponse> {
  const res = await request.post('/ai/data-analysis/query', {
    session_id: sessionId,
    question,
  }) as unknown as ApiResponse<QueryDataResponse>
  return unwrapApiResponse(res)
}
