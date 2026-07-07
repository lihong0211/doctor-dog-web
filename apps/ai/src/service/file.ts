/**
 * 知识库文件 API：列表、预览 URL
 * 后端约定：上传存 ./data/uploads/，GET /ai/files/list、GET /ai/files/:id/preview 提供列表与预览
 */

import { get, type ApiResponse, unwrapApiResponse } from './request'

export interface FileItem {
  id: string
  name: string
  size: number
  url?: string
  preview_url?: string
  create_at?: string
}

export interface FileListResponse {
  list: FileItem[]
}

/** 某知识库/向量库下的文件列表（用于文档列表展示、预览）；后端接收 kb_id */
export async function listFiles(kbId: number | string): Promise<FileItem[]> {
  const data = unwrapApiResponse(
    (await get('/ai/files/list', { params: { kb_id: kbId } })) as ApiResponse<FileListResponse>
  )
  return data?.list ?? []
}

/** 获取用于预览或下载的文件 URL（相对路径需拼 baseURL，或后端返回绝对 path） */
export function getFilePreviewUrl(item: FileItem): string {
  const base = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE || '')
  const path = item.preview_url || item.url || `/ai/files/${item.id}/preview`
  return path.startsWith('http') ? path : `${base}${path}`
}

/** 是否支持浏览器内直接预览（PDF/TXT 可，DOCX/PPT 一般需后端转 PDF） */
export function canPreviewInBrowser(item: FileItem): boolean {
  const name = (item.name || '').toLowerCase()
  return name.endsWith('.pdf') || name.endsWith('.txt') || name.endsWith('.md')
}
