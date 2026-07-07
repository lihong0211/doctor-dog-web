import { get, post } from './request'

const BASE = '/ai/function-calling'

/** 工具定义（Info 接口返回） */
export interface FunctionCallingTool {
  name: string
  description: string
  parameters?: Record<string, unknown>
}

/** 助手信息与工具列表 */
export interface FunctionCallingInfo {
  name: string
  description: string
  tools: FunctionCallingTool[]
}

/** 对话消息 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'function'
  content: string
  name?: string | null
  function_call?: { name: string; arguments: string }
}

/** Chat 请求体 */
export interface FunctionCallingChatRequest {
  messages: ChatMessage[]
  model?: string
  system_message?: string
}

/** 步骤类型 */
export interface ChatStep {
  type: 'tool_call_start' | 'tool_call_end'
  data?: unknown
}

/** Chat 响应（完整格式，含 history） */
export interface FunctionCallingChatResponse {
  reply_messages?: ChatMessage[]
  steps?: ChatStep[]
  history?: ChatMessage[]
  final_answer?: string
  error?: string
}

/** Chat 接口实际返回：code、msg、data。data 可能为最终回复字符串，或上述完整对象 */
export type FunctionCallingChatResult = string | FunctionCallingChatResponse

interface InfoApiResponse {
  code: number
  msg: string
  data: FunctionCallingInfo
}

interface ChatApiResponse {
  code: number
  msg: string
  data: FunctionCallingChatResult
}

/** 获取助手信息与工具列表（名称、描述、参数 schema） */
export async function fetchFunctionCallingInfo(): Promise<FunctionCallingInfo> {
  const res = (await get<InfoApiResponse>(`${BASE}/info`)) as unknown as InfoApiResponse
  if (res?.code !== 0) throw new Error(res?.msg || '请求失败')
  if (!res?.data) throw new Error('响应无 data')
  return res.data
}

/** 发送对话消息，执行 Function Calling。返回 data：可能为最终回复字符串，或含 history 的对象 */
export async function functionCallingChat(
  payload: FunctionCallingChatRequest
): Promise<FunctionCallingChatResult> {
  const res = (await post<ChatApiResponse>(`${BASE}/chat`, payload)) as unknown as ChatApiResponse
  if (res?.code !== 0) throw new Error(res?.msg || (typeof res?.data === 'object' && res?.data?.error) || '请求失败')
  if (res?.data === undefined || res?.data === null) throw new Error('响应无 data')
  return res.data
}
