import { createMcpAgentService } from './mcp-common'

export const scraperAgentService = createMcpAgentService('/ai/mcp-scraper')
export type { McpAgentInfo, ChatMessage, ChatStreamCallbacks } from './mcp-common'
