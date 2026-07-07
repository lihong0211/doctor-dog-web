import { get } from './request'

const BASE = '/ai/mcp-ppt'

export interface PptAgentInfo {
  name: string
  description: string
  plugins: string[]
  mcp_server?: string | null
  config_required?: boolean
  config_hint?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'function'
  content: string
  name?: string | null
  function_call?: { name: string; arguments: string }
}

interface InfoApiResponse {
  code: number
  msg: string
  data: PptAgentInfo
}

/** 获取 PPT 助手信息与插件列表 */
export async function fetchPptAgentInfo(): Promise<PptAgentInfo> {
  const res = (await get<InfoApiResponse>(`${BASE}/info`)) as unknown as InfoApiResponse
  if (res?.code !== 0) throw new Error(res?.msg || '请求失败')
  if (!res?.data) throw new Error('响应无 data')
  return res.data
}

const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE || 'https://home.doctor-dog.com')

// ─────────────────────────────────────────────
// 一、生成 PPT
// ─────────────────────────────────────────────

/** steps 每一步结构：{ type: "step", data: ChatMessage[] } */
export interface PptChatStep {
  type: string
  data: ChatMessage[]
}

export interface PptChatData {
  final_answer: string
  steps: PptChatStep[]
  history: ChatMessage[]
  reply_messages?: ChatMessage[]
}

/** 发起 PPT 生成对话 */
export async function pptChat(messages: ChatMessage[]): Promise<PptChatData> {
  const res = await fetch(`${API_BASE}${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.msg || '生成失败')
  return json.data as PptChatData
}

/**
 * 从 steps 的 function 消息中提取 ppt_id（推荐，更可靠）
 * steps[].data[] 中 role=function 的 content 是 JSON，包含 ppt_id
 */
export function extractPptIdFromSteps(steps: PptChatStep[]): string | null {
  for (const step of steps ?? []) {
    for (const msg of step.data ?? []) {
      if (msg.role === 'function' && msg.content) {
        try {
          const parsed = JSON.parse(msg.content)
          if (parsed.ppt_id) return parsed.ppt_id
        } catch { /* ignore */ }
      }
    }
  }
  return null
}

/**
 * 从 final_answer 文本中正则提取 ppt_id（兜底方案）
 */
export function extractPptIdFromText(text: string): string | null {
  return (
    text.match(/"ppt_id"\s*:\s*"([^"]+)"/)?.[1] ??
    text.match(/任务ID[：:]\s*([A-Za-z0-9]+)/)?.[1] ??
    null
  )
}

export interface PptStatusData {
  ppt_id: string
  ppt_title?: string
  /** 1=生成中 2=成功(progress=100) 3=失败 */
  status: 1 | 2 | 3
  progress: number
  state_description: string
  page_count: number
  preview_url: string
  process_url: string
  first_image_up_at?: string
  created_at?: string
  updated_at?: string
}

/** 查询 PPT 生成进度（每 5s 轮询一次） */
export async function getPptStatus(pptId: string): Promise<PptStatusData> {
  const res = await fetch(`${API_BASE}${BASE}/status?ppt_id=${encodeURIComponent(pptId)}`)
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.msg || '获取状态失败')
  return json.data as PptStatusData
}

// ─────────────────────────────────────────────
// 支付
// ─────────────────────────────────────────────

export interface PaymentOrderData {
  out_trade_no: string
  amount: number
  qrcode_url: string
}

/** 创建支付订单 */
export async function createPaymentOrder(pptId: string): Promise<PaymentOrderData> {
  const res = await fetch(`${API_BASE}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ biz_id: pptId, biz_type: 'ppt_download', subject: 'PPT下载', amount: 1.5 }),
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.msg || '创建订单失败')
  return json.data as PaymentOrderData
}

/** 用户申报已付款 */
export async function claimPayment(outTradeNo: string): Promise<void> {
  const res = await fetch(`${API_BASE}/payment/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ out_trade_no: outTradeNo }),
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.msg || '申报失败')
}

export interface PaymentStatusData {
  out_trade_no: string
  biz_id: string
  /** 0=待支付 1=待确认 2=已确认可下载 3=已关闭/拒绝 */
  status: 0 | 1 | 2 | 3
  status_desc: string
  amount: number
  paid: boolean
}

/** 查询订单支付状态（每 5s 轮询） */
export async function getPaymentStatus(outTradeNo: string): Promise<PaymentStatusData> {
  const res = await fetch(`${API_BASE}/payment/status?out_trade_no=${encodeURIComponent(outTradeNo)}`)
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.msg || '获取支付状态失败')
  return json.data as PaymentStatusData
}

/** 获取微信收款二维码图片 URL（直接作为 <img src> 使用） */
export function getQrcodeUrl(): string {
  return `${API_BASE}/payment/qrcode`
}

// ─────────────────────────────────────────────
// 下载
// ─────────────────────────────────────────────

/**
 * 获取 CDN 下载直链（推荐）
 * GET /ai/mcp-ppt/download-url?ppt_id={ppt_id}
 * 链接有效期约 1 小时，每次下载时实时获取
 */
export async function getPptCdnDownloadUrl(pptId: string): Promise<string> {
  const res = await fetch(`${API_BASE}${BASE}/download-url?ppt_id=${encodeURIComponent(pptId)}`)
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.msg || '获取下载链接失败')
  return json.data.download_url as string
}

/**
 * 后端代理下载链接（备选，需支付凭证）
 * GET /ai/mcp-ppt/download?ppt_id={ppt_id}&out_trade_no={out_trade_no}
 */
export function getPptProxyDownloadUrl(pptId: string, outTradeNo: string): string {
  return `${API_BASE}${BASE}/download?ppt_id=${encodeURIComponent(pptId)}&out_trade_no=${encodeURIComponent(outTradeNo)}`
}

/**
 * 获取在线编辑器链接（可选）
 * GET /ai/mcp-ppt/editor?ppt_id={ppt_id}
 */
export async function getPptEditorUrl(pptId: string): Promise<{ url: string; expire_time: string }> {
  const res = await fetch(`${API_BASE}${BASE}/editor?ppt_id=${encodeURIComponent(pptId)}`)
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.msg || '获取编辑器链接失败')
  return json.data as { url: string; expire_time: string }
}

// ─────────────────────────────────────────────
// 历史记录
// ─────────────────────────────────────────────

export interface PptHistoryItem {
  ppt_id: string
  title?: string        // 后端字段名为 title
  ppt_title?: string   // 兼容旧字段
  /** 1=生成中 2=成功 3=失败 */
  status: 1 | 2 | 3
  progress: number
  preview_url?: string
  page_count?: number
  prompt?: string
  create_at?: string    // 后端字段名为 create_at
  created_at?: string  // 兼容旧字段
}

export interface PptHistoryResult {
  items: PptHistoryItem[]
  total: number
}

/**
 * 查询服务端 PPT 生成历史记录
 * GET /ai/mcp-ppt/history?page=1&page_size=20
 */
export async function getPptHistory(page = 1, pageSize = 20): Promise<PptHistoryResult> {
  const res = await fetch(`${API_BASE}${BASE}/history?page=${page}&page_size=${pageSize}`)
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.msg || '获取历史记录失败')
  const data = json.data ?? {}
  // 后端返回 data.list，兼容 data.items / data 直接是数组
  const rawItems = data.list ?? data.items ?? (Array.isArray(data) ? data : [])
  return {
    items: Array.isArray(rawItems) ? (rawItems as PptHistoryItem[]) : [],
    total: data.total ?? 0,
  }
}
