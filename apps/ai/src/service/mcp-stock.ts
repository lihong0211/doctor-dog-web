import { createMcpAgentService } from './mcp-common'

export const stockAgentService = createMcpAgentService('/ai/mcp-stock')
export type { McpAgentInfo, ChatMessage, ChatStreamCallbacks } from './mcp-common'
