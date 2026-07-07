/**
 * 业务 API 接口
 */

import { streamRequest, type StreamChunk } from '../utils/streamChat'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  /** 当前消息附带的图片（base64，不含 data URL 前缀），用于 OCR/视觉模型 */
  images?: string[]
}

export interface ChatOptions {
  onChunk?: (chunk: StreamChunk) => void
  onError?: (error: Error) => void
  model?: string
  temperature?: number
  num_predict?: number
  /** 对话历史，带上后模型有上下文记忆 */
  messages?: ChatMessage[]
  /** 本条 user 消息附带的图片（base64），用于 deepseek-ocr 等视觉模型 */
  images?: string[]
}

/**
 * 聊天接口（支持传入 messages 实现多轮记忆）
 */
export async function chat(prompt: string, opts: ChatOptions = {}): Promise<void> {
  const {
    onChunk,
    onError,
    model = 'my-deepseek-r1-1.5',
    temperature = 0.45,
    num_predict = 2048,
    messages: history = [],
    images = [],
  } = opts

  const lastUserMessage: ChatMessage = {
    role: 'user',
    content: prompt,
    ...(images.length > 0 && { images }),
  }
  const messages = [...history, lastUserMessage]

  await streamRequest(
    '/ai/chat',
    {
      messages,
      model,
      stream: true,
      keep_alive: true,
      options: { temperature, num_predict },
    },
    { onChunk, onError }
  )
}

/**
 * OCR 识别接口（固定 OCR 模型，只收图）
 * POST /ai/orc 请求体：{ images: ["<base64>"] 或 image: "<base64>", stream: true, options: {} }
 */
export async function ocr(opts: {
  images: string[]
  onChunk?: (chunk: StreamChunk) => void
  onError?: (error: Error) => void
}): Promise<void> {
  const { images, onChunk, onError } = opts
  const body: Record<string, unknown> = {
    stream: true,
    options: {},
  }
  if (images.length === 1) {
    body.image = images[0]
  } else {
    body.images = images
  }
  await streamRequest('/ai/orc', body, { onChunk, onError })
}
