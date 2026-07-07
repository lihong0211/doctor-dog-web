import { streamRequest, type StreamChunk } from '../utils/streamChat'

export async function planRecipe(
  params: { ingredients: string; servings: number; dietary?: string; cuisine?: string; meal_type?: string },
  opts: { onChunk: (c: StreamChunk) => void }
) {
  await streamRequest('/ai/recipe-agent/plan', params, opts)
}
