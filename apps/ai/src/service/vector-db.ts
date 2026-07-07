/**
 * 向量库 API，对齐 docs/vector-db.md 与后端 routes/ai.py：/ai/vector-db/*
 */

import { get, post, type ApiResponse, unwrapApiResponse } from './request'

const BASE = '/ai/vector-db'

export interface VectorDbItem {
  id: number
  name: string
  description: string | null
  create_at: string | null
  update_at: string | null
}

export interface VectorDbDetail extends VectorDbItem {
  documents?: VectorDbDocumentItem[]
}

export interface VectorDbDocumentItem {
  id: number
  vector_db_id: number
  doc_id: string
  text: string
  category: string | null
  metadata?: unknown
  create_at?: string | null
}

export interface VectorDbCategoryItem {
  id: number
  vector_db_id: number
  name: string
  sort_order: number
  create_at?: string
}

export interface ListVectorDbsResponse {
  list: VectorDbItem[]
  names?: string[]
}

export interface CreateVectorDbPayload {
  name: string
  description?: string
  documents?: { id?: string; text: string; content?: string; category?: string; metadata?: unknown }[]
}

export interface CreateVectorDbResponse {
  id?: number
  name: string
  description?: string | null
  count: number
  path: string
  documents?: unknown[]
}

export interface DocumentsPaginatedResponse {
  list: VectorDbDocumentItem[]
  total: number
  page: number
  page_size: number
}

export interface SearchResultItem {
  rank: number
  distance: number
  doc: { text?: string; content?: string; category?: string; metadata?: unknown }
}

export interface SearchResponse {
  db?: string
  query?: string
  results: SearchResultItem[]
}

/** 从 MySQL 列出向量库 */
export async function listVectorDbs(): Promise<ListVectorDbsResponse> {
  const data = unwrapApiResponse((await get(BASE + '/list')) as unknown as ApiResponse<ListVectorDbsResponse>)
  return { list: data?.list ?? [], names: data?.names ?? [] }
}

/** 创建向量库（documents 可为空） */
export async function createVectorDb(payload: CreateVectorDbPayload): Promise<CreateVectorDbResponse> {
  return unwrapApiResponse((await post(BASE, payload)) as unknown as ApiResponse<CreateVectorDbResponse>)
}

/** 获取详情，with_documents 为 true 时带文档列表 */
export async function getVectorDbDetail(params: {
  db_id?: number
  db_name?: string
  id?: number
  name?: string
  with_documents?: boolean
}): Promise<VectorDbDetail> {
  const q: Record<string, string | number | boolean> = {}
  if (params.db_id != null) q.db_id = params.db_id
  if (params.db_name != null) q.db_name = params.db_name
  if (params.id != null) q.id = params.id
  if (params.name != null) q.name = params.name
  if (params.with_documents === true) q.with_documents = true
  return unwrapApiResponse(
    (await get(BASE + '/detail', { params: q })) as unknown as ApiResponse<VectorDbDetail>
  )
}

/** 分页查询文档，可按 category 筛选 */
export async function getVectorDbDocuments(params: {
  db_id?: number
  db_name?: string
  page?: number
  page_size?: number
  category?: string
}): Promise<DocumentsPaginatedResponse> {
  const data = unwrapApiResponse(
    (await get(BASE + '/documents', { params: params as Record<string, unknown> })) as unknown as ApiResponse<DocumentsPaginatedResponse>
  )
  return {
    list: data?.list ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    page_size: data?.page_size ?? 20,
  }
}

/** 追加一条文档 */
export async function addDocument(params: {
  db_id?: number
  db_name?: string
  doc_id?: string
  text: string
  category?: string
  metadata?: unknown
}): Promise<{ doc_id: string; db_name: string; total: number }> {
  return unwrapApiResponse(
    (await post(BASE + '/document/add', params)) as unknown as ApiResponse<{ doc_id: string; db_name: string; total: number }>
  )
}

/** 更新单条文档（按 doc_id 或 index） */
export async function updateDocument(params: {
  db_id?: number
  db_name?: string
  doc_id?: string
  index?: number
  text: string
  category?: string
}): Promise<{ doc_id: string; db_name: string }> {
  return unwrapApiResponse(
    (await post(BASE + '/document/update', params)) as unknown as ApiResponse<{ doc_id: string; db_name: string }>
  )
}

/** 删除单条文档 */
export async function deleteDocument(params: {
  db_id?: number
  db_name?: string
  doc_id: string
}): Promise<{ doc_id: string; db_name: string; total: number }> {
  return unwrapApiResponse(
    (await post(BASE + '/document/delete', params)) as unknown as ApiResponse<{ doc_id: string; db_name: string; total: number }>
  )
}

/** 列出分类 */
export async function getVectorDbCategories(params: {
  db_id?: number
  db_name?: string
}): Promise<VectorDbCategoryItem[]> {
  const data = unwrapApiResponse(
    (await get(BASE + '/categories', { params })) as unknown as ApiResponse<{ list?: VectorDbCategoryItem[] }>
  )
  return data?.list ?? []
}

/** 仅更新向量库元信息（说明、名称），不重建索引、不碰文档 */
export async function updateVectorDbMeta(params: {
  id: number
  description?: string
  name?: string
}): Promise<{ id: number; name?: string }> {
  return unwrapApiResponse(
    (await post(BASE + '/update-meta', params)) as unknown as ApiResponse<{ id: number; name?: string }>
  )
}

/** 按 id 删除向量库 */
export async function deleteVectorDb(params: { id: number }): Promise<{ id: number; name: string }> {
  const res = await post(BASE + '/delete', params)
  const data = unwrapApiResponse(res as unknown as ApiResponse<{ id: number; name: string }>)
  return data
}

/** 按 MySQL 该库文档列表重建向量索引（可传 id/name/db_id/db_name） */
export async function rebuildVectorDb(params: { id?: number; name?: string; db_id?: number; db_name?: string }): Promise<{ id: number; name: string; count: number }> {
  const body = { ...params }
  if (params.name != null && params.db_name == null) body.db_name = params.name
  return unwrapApiResponse(
    (await post(BASE + '/rebuild', body)) as unknown as ApiResponse<{ id: number; name: string; count: number }>
  )
}

/** 检索 */
const SEARCH_URL = BASE + '/search'
export async function searchVectorDb(params: { db: string; db_name?: string; query: string; top_k?: number }): Promise<SearchResponse> {
  const body = { db: params.db, db_name: params.db_name ?? params.db, query: params.query, top_k: params.top_k ?? 3 }
  const data = unwrapApiResponse(
    (await post(SEARCH_URL, body)) as unknown as ApiResponse<SearchResponse>
  )
  return { ...data, results: data?.results ?? [] }
}
