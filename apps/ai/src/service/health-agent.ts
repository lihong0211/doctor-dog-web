import { streamRequest, type StreamChunk } from '../utils/streamChat'

export async function generateHealthPlan(
  params: { age: number; weight: number; height: number; goal: string; activity_level: string; health_issues?: string },
  opts: { onChunk: (c: StreamChunk) => void }
) {
  await streamRequest('/ai/health-agent/plan', params, opts)
}
