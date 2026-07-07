/**
 * 知识库 API：/ai/knowledge-base/*
 * 按文档 docs/知识库设计/知识库接口文档.md
 */

import request from './request'
import { get, post, type ApiResponse, unwrapApiResponse } from './request'

const BASE = '/ai/knowledge-base'

export interface KbItem {
  id: number
  name: string
  description: string | null
  create_at: string | null
  update_at: string | null
  /** 关联的向量库 id（首次向量化后回写） */
  vector_db_id?: number | null
  /** 关联的向量库名称 */
  vector_db_name?: string | null
  /** 分段数量 */
  segment_count?: number
}

export interface KbListResponse {
  list: KbItem[]
  names: string[]
}

export interface KbCreateResponse {
  id: number
  name: string
  description?: string | null
  count?: number
  path?: string
}

/** 详情返回的文档/分段（with_documents=1 时） */
export interface KbDetailDocument {
  id?: number
  doc_id?: string
  text?: string
  category?: string | null
  metadata?: unknown
  create_at?: string
}
export interface KbDetailSegment {
  id?: number
  document_id?: number
  text?: string
  metadata?: unknown
}
export interface KbDetailResponse extends KbItem {
  documents?: KbDetailDocument[]
  segments?: KbDetailSegment[]
}

export interface VectorizeResponse {
  vector_db_id: number
  count: number
  created?: boolean
}

/** 分段预览单项（文字块，不落库） */
export interface SegmentPreviewItem {
  doc_id?: string
  text: string
  category?: string | null
}

export interface SegmentPreviewResponse {
  list: SegmentPreviewItem[]
}

/** 按知识库查文档列表（分段预览左侧，knowledge_base_document）1.6 */
export interface KnowledgeBaseDocumentItem {
  id: number
  knowledge_base_id?: number
  file_name: string
  path?: string
  file_id?: string
  status?: string
  segment_count?: number
  create_at?: string
  [key: string]: unknown
}
export interface KnowledgeBaseDocumentsResponse {
  list: KnowledgeBaseDocumentItem[]
  total: number
}
export async function listKnowledgeBaseDocuments(params: {
  kb_id?: number
  kb_name?: string
  kb?: string
}): Promise<KnowledgeBaseDocumentsResponse> {
  const q: Record<string, string | number> = {}
  if (params.kb_id != null) q.kb_id = params.kb_id
  if (params.kb_name != null) q.kb_name = params.kb_name
  if (params.kb != null) q.kb = params.kb
  const data = unwrapApiResponse(
    (await get(BASE + '/documents', { params: q })) as unknown as ApiResponse<KnowledgeBaseDocumentsResponse>
  )
  return { list: data?.list ?? [], total: data?.total ?? 0 }
}

/** 按文档 id 查分段列表（分段预览右侧，knowledge_base_segment，按 index 排序） */
export interface KnowledgeBaseSegmentItem {
  id: number
  document_id: number
  text: string
  index?: number
  parent_id?: number | null
  metadata?: unknown
  [key: string]: unknown
}
export interface KnowledgeBaseSegmentsResponse {
  list: KnowledgeBaseSegmentItem[]
  total: number
}
export async function getDocumentSegments(documentId: number): Promise<KnowledgeBaseSegmentsResponse> {
  const data = unwrapApiResponse(
    (await get(`${BASE}/document/${documentId}/segments`)) as unknown as ApiResponse<KnowledgeBaseSegmentsResponse>
  )
  return { list: data?.list ?? [], total: data?.total ?? 0 }
}

/** 删除知识库文档 */
export async function deleteKnowledgeBaseDocument(params: { document_id?: number; id?: number }): Promise<{ document_id?: number; id?: number }> {
  const body: Record<string, number> = {}
  if (params.document_id != null) body.document_id = params.document_id
  else if (params.id != null) body.id = params.id
  return unwrapApiResponse(
    (await post(BASE + '/document/delete', body)) as unknown as ApiResponse<{ document_id?: number; id?: number }>
  )
}

/** 与 request 的 baseURL 一致，保证预览请求发到同一后端（避免前端在 ai 域名时预览请求落到 ai 域名） */
const getApiBase = () =>
  import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE || 'https://home.doctor-dog.com')

/** 文档预览 URL（中间「原始文档预览」，GET 返回文件流） */
export function getDocumentPreviewUrl(documentId: number): string {
  const base = getApiBase()
  return `${base}${BASE}/document/${documentId}/preview`
}

/** 分段预览：传文件，返回平铺文字块列表，不落库 */
export async function previewSegments(params: {
  file: File
  chunk_size?: number
  chunk_overlap?: number
}): Promise<SegmentPreviewItem[]> {
  const form = new FormData()
  form.append('file', params.file)
  if (params.chunk_size != null) form.append('chunk_size', String(params.chunk_size))
  if (params.chunk_overlap != null) form.append('chunk_overlap', String(params.chunk_overlap))
  const res = await request.post(BASE + '/segments/preview', form, {
    headers: { 'Content-Type': undefined as unknown as string },
  })
  const data = unwrapApiResponse(res as unknown as ApiResponse<SegmentPreviewResponse>)
  return data?.list ?? []
}

/** 列表 */
export async function listKnowledgeBases(): Promise<KbItem[]> {
  const data = unwrapApiResponse((await get(BASE + '/list')) as unknown as ApiResponse<KbListResponse>)
  return data?.list ?? []
}

/** 创建知识库（仅写 knowledge_base 表，不建向量库；向量库在首次向量化时创建） */
export async function createKnowledgeBase(params: {
  name: string
  db?: string
  description?: string
  parsing_strategy?: unknown
  chunking_strategy?: unknown
}): Promise<KbCreateResponse> {
  const body: Record<string, unknown> = {
    name: params.name,
    description: params.description ?? undefined,
  }
  if (params.db) body.db = params.db
  if (params.parsing_strategy != null) body.parsing_strategy = params.parsing_strategy
  if (params.chunking_strategy != null) body.chunking_strategy = params.chunking_strategy
  return unwrapApiResponse((await post(BASE, body)) as unknown as ApiResponse<KbCreateResponse>)
}

/** 上传资料：新建库（name + file）或追加（kb_id + file） */
export interface UploadKnowledgeBaseDocumentResult {
  file_name: string
  document_id: number
  segment_count?: number
  path?: string
  /** 文件名重复时会覆盖 */
  overwritten?: boolean
  /** 本次上传跳过 OCR 时为 true，后续可调分段接口做 OCR */
  skipped_ocr?: boolean
}
export interface UploadKnowledgeBaseResponse {
  id?: number
  name?: string
  description?: string
  /** 兼容旧返回：单文件上传时可能返回 document_id */
  document_id?: number
  appended?: number
  path?: string
  /** 新返回：本次上传涉及的文档列表 */
  documents?: UploadKnowledgeBaseDocumentResult[]
  total?: number
  /** 重复文件名列表（被覆盖） */
  duplicated_files?: string[]
  /** 本次请求为跳过 OCR 时由服务端返回 */
  skipped_ocr?: boolean
  [key: string]: unknown
}

/** 上传资料（多文件）：新建库（name + files）或追加（kb_id + files）。skip_ocr=true 时仅保存图片不 OCR，分段数为 0，后续可调分段接口做 OCR。 */
export async function uploadKnowledgeBaseFiles(params: {
  files: File[]
  name?: string
  db?: string
  kb_id?: number
  kb_name?: string
  kb?: string
  description?: string
  chunk_size?: number
  chunk_overlap?: number
  /** 为 true 时仅保存文件不 OCR（图片分段数为 0），后续可调 segments/execute 做 OCR */
  skip_ocr?: boolean
}): Promise<UploadKnowledgeBaseResponse> {
  const form = new FormData()
  for (const f of params.files) form.append('files', f)
  if (params.name != null) form.append('name', params.name)
  if (params.db != null) form.append('db', params.db)
  if (params.kb_id != null) form.append('kb_id', String(params.kb_id))
  if (params.kb_name != null) form.append('kb_name', params.kb_name)
  if (params.kb != null) form.append('kb', params.kb)
  if (params.description != null) form.append('description', params.description)
  if (params.chunk_size != null) form.append('chunk_size', String(params.chunk_size))
  if (params.chunk_overlap != null) form.append('chunk_overlap', String(params.chunk_overlap))
  if (params.skip_ocr === true) form.append('skip_ocr', 'true')
  const res = await request.post(BASE + '/upload', form, {
    headers: { 'Content-Type': undefined as unknown as string },
  })
  return unwrapApiResponse(res as unknown as ApiResponse<UploadKnowledgeBaseResponse>) as UploadKnowledgeBaseResponse
}

/** 上传资料（单文件兼容）：内部转为 files 字段 */
export async function uploadKnowledgeBaseFile(params: {
  file: File
  name?: string
  db?: string
  kb_id?: number
  kb_name?: string
  kb?: string
  description?: string
  chunk_size?: number
  chunk_overlap?: number
}): Promise<UploadKnowledgeBaseResponse> {
  return uploadKnowledgeBaseFiles({ ...params, files: [params.file] })
}

/** 详情（可选 with_documents） */
export async function getKnowledgeBaseDetail(params: {
  id?: number
  name?: string
  with_documents?: boolean
}): Promise<KbDetailResponse> {
  const q: Record<string, string> = {}
  if (params.id != null) q.id = String(params.id)
  if (params.name != null) q.name = params.name
  if (params.with_documents === true) q.with_documents = '1'
  const data = unwrapApiResponse(
    (await get(BASE + '/detail', { params: q })) as unknown as ApiResponse<KbDetailResponse>
  )
  return data as KbDetailResponse
}

/** 更新知识库（仅元信息，不替换文档/分段） */
export async function updateKnowledgeBase(params: {
  id: number
  name?: string
  description?: string
  parsing_strategy?: unknown
  chunking_strategy?: unknown
}): Promise<{ id: number; name: string }> {
  return unwrapApiResponse((await post(BASE + '/update', params)) as unknown as ApiResponse<{ id: number; name: string }>)
}

/** 删除知识库（若有 vector_db_id 会先删向量库再删 knowledge_base） */
export async function deleteKnowledgeBase(params: { id?: number; name?: string }): Promise<{ id: number; name: string }> {
  return unwrapApiResponse((await post(BASE + '/delete', params)) as unknown as ApiResponse<{ id: number; name: string }>)
}

/** 执行分段（用法一）：对已入库文档列表按分段参数重新分段并落库。POST /ai/knowledge-base/segments/execute */
const EXECUTE_SEGMENTS_TIMEOUT_MS = 5 * 60 * 1000 // 5 分钟，分段可能较耗时

export interface ExecuteSegmentsResultItem {
  document_id: number
  segment_count: number
  error?: string
}
export interface ExecuteSegmentsResponse {
  results: ExecuteSegmentsResultItem[]
  chunk_size: number
  chunk_overlap: number
}
export async function executeSegments(params: {
  document_ids: number[]
  chunk_size?: number
  chunk_overlap?: number
}): Promise<ExecuteSegmentsResponse> {
  const data = unwrapApiResponse(
    (await post(BASE + '/segments/execute', params, { timeout: EXECUTE_SEGMENTS_TIMEOUT_MS })) as unknown as ApiResponse<ExecuteSegmentsResponse>
  )
  return {
    results: data?.results ?? [],
    chunk_size: data?.chunk_size ?? params.chunk_size ?? 1000,
    chunk_overlap: data?.chunk_overlap ?? params.chunk_overlap ?? 200,
  }
}

/** 分段向量化（按知识库 id，从 knowledge_base_segment 建/重建向量库并回写 vector_db_id），超时 5 分钟 */
const VECTORIZE_TIMEOUT_MS = 5 * 60 * 1000

export async function vectorizeKnowledgeBase(params: { knowledge_base_id: number }): Promise<VectorizeResponse> {
  return unwrapApiResponse(
    (await post(BASE + '/vectorize', params, { timeout: VECTORIZE_TIMEOUT_MS })) as unknown as ApiResponse<VectorizeResponse>
  )
}

/** 按知识库 id 重建关联向量库索引 */
export async function rebuildKnowledgeBase(params: { id?: number; name?: string; db?: string }): Promise<{ id: number; name: string; count: number }> {
  return unwrapApiResponse(
    (await post(BASE + '/rebuild', params)) as unknown as ApiResponse<{ id: number; name: string; count: number }>
  )
}
