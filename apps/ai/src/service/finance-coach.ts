import { streamRequest, type StreamChunk } from '../utils/streamChat'

export async function generateFinancePlan(
  params: { monthly_income: number; monthly_expenses: number; savings_goal: number; debt?: number; investment_risk?: string; financial_goals: string },
  opts: { onChunk: (c: StreamChunk) => void }
) {
  await streamRequest('/ai/finance-coach/plan', params, opts)
}
