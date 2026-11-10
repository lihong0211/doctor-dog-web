import { createMcpAgentService } from './mcp-common'

export const dataAnalysisAgentService = createMcpAgentService('/ai/mcp-data-analysis')
export type { McpAgentInfo, ChatMessage, ChatStreamCallbacks } from './mcp-common'
