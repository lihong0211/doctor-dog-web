import { createMcpAgentService } from './mcp-common'

export const resumeAgentService = createMcpAgentService('/ai/mcp-resume')
export type { McpAgentInfo, ChatMessage, ChatStreamCallbacks } from './mcp-common'
