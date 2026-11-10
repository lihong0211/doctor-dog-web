import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import KnowledgeGraph from './KnowledgeGraph'
import KnowledgeGraphCanvas from './KnowledgeGraphCanvas'
import * as api from '../../service/knowledge-graph'

vi.mock('../../service/knowledge-graph', () => ({
  getOverview: vi.fn(), getGraph: vi.fn(), searchGraph: vi.fn(), mergeSearch: vi.fn(), answerQuestion: vi.fn(),
  isLocalAutoConnectEnabled: vi.fn(),
}))
const chart = vi.hoisted(() => ({ init: vi.fn(), setOption: vi.fn(), dispatchAction: vi.fn(),
  on: vi.fn(), off: vi.fn(), resize: vi.fn(), dispose: vi.fn() }))
vi.mock('echarts/core', () => ({ use: vi.fn(), init: chart.init }))
vi.mock('echarts/charts', () => ({ GraphChart: {} }))
vi.mock('echarts/components', () => ({ TooltipComponent: {} }))
vi.mock('echarts/renderers', () => ({ CanvasRenderer: {} }))

const overview = { entities: 1595, relations: 2916, movies: 100, communities: 134,
  entity_types: [{ type: 'Movie', count: 100 }], community_levels: [{ level: 0, count: 91 }] }
const graph = { nodes: [{ id: 'movie-1', name: '肖申克的救赎', type: 'Movie',
  properties: { imdb_id: 'tt0111161', year: 1994, rating: 9.7 } }], edges: [], truncated: false }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.isLocalAutoConnectEnabled).mockReturnValue(false)
  chart.init.mockReturnValue(chart)
  Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockImplementation(() => ({
    matches: false, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(),
    removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })) })
  vi.mocked(api.getOverview).mockResolvedValue(overview)
  vi.mocked(api.getGraph).mockResolvedValue(graph)
  vi.mocked(api.searchGraph).mockImplementation(async (_key, mode) => mode === 'cypher'
    ? { cypher: 'MATCH (m:Movie) RETURN m.name LIMIT 50', rows: [{ name: '肖申克的救赎' }], error: null }
    : { facts: [{ text: '肖申克的救赎于1994年上映' }], error: null })
  vi.mocked(api.mergeSearch).mockResolvedValue({ items: [{ text: '肖申克的救赎于1994年上映', source: 'local' }], communities: [] })
  vi.mocked(api.answerQuestion).mockResolvedValue({ answer: '根据图谱，肖申克的救赎于1994年上映。' })
})

async function connect() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('KG API Key'), 'test-key')
  await user.click(screen.getByRole('button', { name: '连接图谱' }))
  await screen.findByText('1595')
  return user
}

async function ask() {
  const user = await connect()
  await user.click(screen.getByRole('tab', { name: '检索问答' }))
  await user.type(screen.getByLabelText('问题'), '1994 年上映了哪些电影？')
  await user.click(screen.getByRole('button', { name: '开始检索' }))
}

describe('KnowledgeGraph', () => {
  it('automatically connects with server-side local credentials and can ask without a browser key', async () => {
    vi.mocked(api.isLocalAutoConnectEnabled).mockReturnValue(true)
    render(<KnowledgeGraph />)
    await screen.findByText('1595')
    expect(screen.queryByLabelText('KG API Key')).not.toBeInTheDocument()
    expect(screen.getByText('使用本地环境配置自动连接。')).toBeInTheDocument()
    expect(api.getOverview).toHaveBeenCalledWith('', expect.any(AbortSignal))
    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: '检索问答' }))
    await user.type(screen.getByLabelText('问题'), '1994 年上映了哪些电影？')
    await user.click(screen.getByRole('button', { name: '开始检索' }))
    expect(await screen.findByText('根据图谱，肖申克的救赎于1994年上映。')).toBeInTheDocument()
    expect(api.searchGraph).toHaveBeenCalledWith('', 'cypher', '1994 年上映了哪些电影？', expect.any(AbortSignal))
  })

  it('keeps the graph instance and viewport when selection changes', () => {
    const onSelect = vi.fn()
    const { rerender } = render(<KnowledgeGraphCanvas graph={graph} selectedId={null} onSelect={onSelect} />)
    rerender(<KnowledgeGraphCanvas graph={graph} selectedId="movie-1" onSelect={onSelect} />)
    expect(chart.init).toHaveBeenCalledTimes(1)
    expect(chart.dispatchAction).toHaveBeenCalledWith({ type: 'highlight', seriesIndex: 0, dataIndex: 0 })
  })

  it('waits for an explicit connection and shows real node details after connecting', async () => {
    render(<KnowledgeGraph />)
    expect(screen.getByRole('button', { name: '连接图谱' })).toBeDisabled()
    expect(screen.getByText('输入访问密钥，连接电影知识图谱')).toBeInTheDocument()
    const user = await connect()
    await user.click(screen.getByRole('button', { name: '查看实体 肖申克的救赎' }))
    expect(screen.getByText('tt0111161')).toBeInTheDocument()
    expect(screen.getByText('imdb_id')).toBeInTheDocument()
  })

  it('keeps successful routes and generates an answer when Global fails', async () => {
    vi.mocked(api.searchGraph).mockImplementation(async (_key, mode) => {
      if (mode === 'global') throw new Error('模型暂不可用')
      return { rows: [{ name: '肖申克的救赎' }], facts: [], error: null }
    })
    render(<KnowledgeGraph />)
    await ask()
    expect(await screen.findByText('根据图谱，肖申克的救赎于1994年上映。')).toBeInTheDocument()
    expect(screen.getByText('模型暂不可用')).toBeInTheDocument()
    expect(screen.getAllByText('已完成').length).toBeGreaterThanOrEqual(2)
  })

  it('stops without generating an answer when all routes fail', async () => {
    vi.mocked(api.searchGraph).mockRejectedValue(new Error('图谱暂不可用'))
    render(<KnowledgeGraph />)
    await ask()
    expect(await screen.findByText('三路检索均未成功，请检查错误后重试。')).toBeInTheDocument()
    expect(screen.queryByText('根据图谱，肖申克的救赎于1994年上映。')).not.toBeInTheDocument()
    expect(screen.getAllByText('图谱暂不可用')).toHaveLength(3)
    expect(api.mergeSearch).not.toHaveBeenCalled()
    expect(api.answerQuestion).not.toHaveBeenCalled()
  })

  it('ignores an older graph response after a newer reset completes', async () => {
    let resolveOld!: (value: typeof graph) => void
    render(<KnowledgeGraph />)
    const user = await connect()
    vi.mocked(api.getGraph).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
    await user.type(screen.getByLabelText('搜索实体'), '旧查询')
    await user.click(screen.getByRole('button', { name: '搜索图谱' }))
    vi.mocked(api.getGraph).mockResolvedValue({ ...graph, nodes: [{ ...graph.nodes[0], id: 'new', name: '新电影' }] })
    await user.click(screen.getByRole('button', { name: /^重\s*置$/ }))
    await screen.findByRole('button', { name: '查看实体 新电影' })
    resolveOld({ ...graph, nodes: [{ ...graph.nodes[0], id: 'old', name: '过期电影' }] })
    await waitFor(() => expect(screen.getByRole('button', { name: '查看实体 新电影' })).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: '查看实体 过期电影' })).not.toBeInTheDocument()
  })

  it('ignores old question results after switching the connection', async () => {
    const pending: ((value: api.SearchResult) => void)[] = []
    vi.mocked(api.searchGraph).mockImplementation(() => new Promise(resolve => pending.push(resolve)))
    render(<KnowledgeGraph />)
    await ask()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('KG API Key'), 'second-key')
    await user.click(screen.getByRole('button', { name: '重新连接' }))
    await screen.findByText('1595')
    await user.click(screen.getByRole('tab', { name: '检索问答' }))
    await act(async () => pending.forEach(resolve => resolve({ rows: [{ name: '过期结果' }], error: null })))
    expect(screen.queryByText('根据图谱，肖申克的救赎于1994年上映。')).not.toBeInTheDocument()
    expect(screen.getAllByText('等待提问')).toHaveLength(3)
    expect(api.mergeSearch).not.toHaveBeenCalled()
  })

  it('preserves an explicit empty graph state after a search', async () => {
    render(<KnowledgeGraph />)
    const user = await connect()
    vi.mocked(api.getGraph).mockResolvedValue({ nodes: [], edges: [], truncated: false })
    await user.type(screen.getByLabelText('搜索实体'), '不存在的电影')
    await user.click(screen.getByRole('button', { name: '搜索图谱' }))
    await waitFor(() => expect(screen.getByText('未找到匹配的实体，试试其他名称或类型。')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: '查看实体 肖申克的救赎' })).not.toBeInTheDocument()
  })
})
