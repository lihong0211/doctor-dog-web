import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from './knowledge-graph'

const transport = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('./request', () => ({
  default: transport,
  unwrapApiResponse: (response: { data: unknown }) => response.data,
}))

beforeEach(() => {
  vi.resetAllMocks()
  transport.get.mockResolvedValue({ code: 0, data: {} })
  transport.post.mockResolvedValue({ code: 0, data: {} })
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('knowledge graph production access', () => {
  it('uses the non-secret server-auth flag in production', () => {
    vi.stubEnv('DEV', false)
    vi.stubGlobal('__KG_AUTO_CONNECT__', true)
    expect(api.isAutoConnectEnabled()).toBe(true)
    vi.stubGlobal('__KG_AUTO_CONNECT__', false)
    expect(api.isAutoConnectEnabled()).toBe(false)
  })

  it('sends every KG request to the same origin without a browser key', async () => {
    const signal = new AbortController().signal
    await api.getOverview('', signal)
    await api.getGraph('', { query: '诺兰' }, signal)
    await api.searchGraph('', 'cypher', 'question', signal)
    await api.mergeSearch('', 'question', { cypher: {}, local: null, global: null }, signal)
    await api.answerQuestion('', 'question', { items: [] }, signal)
    expect(transport.get).toHaveBeenCalledTimes(2)
    expect(transport.post).toHaveBeenCalledTimes(3)
    for (const args of [...transport.get.mock.calls, ...transport.post.mock.calls]) {
      const config = args[args.length - 1]
      expect(config.baseURL).toBe('')
      expect(config.signal).toBe(signal)
      expect(config.headers).toBeUndefined()
    }
  })
})
