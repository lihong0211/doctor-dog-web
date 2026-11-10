import { createMcpAgentService } from './mcp-common'

export const newsAgentService = createMcpAgentService('/ai/mcp-news')
export type { McpAgentInfo, ChatMessage, ChatStreamCallbacks } from './mcp-common'
