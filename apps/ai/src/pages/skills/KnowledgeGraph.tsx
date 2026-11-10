import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Empty, Input, Select, Spin, Tabs, Tag } from 'antd'
import ReactMarkdown from 'react-markdown'
import {
  answerQuestion, getGraph, getOverview, isLocalAutoConnectEnabled, mergeSearch, searchGraph,
  type GraphData, type GraphOverview, type GraphQuery, type MergeContext, type SearchMode, type SearchResult,
} from '../../service/knowledge-graph'
import KnowledgeGraphCanvas from './KnowledgeGraphCanvas'
import './KnowledgeGraph.css'

const MODES: SearchMode[] = ['cypher', 'local', 'global']
const MODE_NAMES: Record<SearchMode, string> = { cypher: 'Cypher', local: 'Local', global: 'Global' }
const MODE_HINTS: Record<SearchMode, string> = {
  cypher: '精确查询电影、年份与评分', local: '围绕实体扩展关联事实', global: '汇总社区报告中的整体特点',
}
const TYPE_NAMES: Record<string, string> = {
  Movie: '电影', Person: '人物', Genre: '类型', Country: '国家地区', Language: '语言',
  Year: '年份', Tag: '标签', Theme: '主题', Location: '地点', Award: '奖项',
}
const EXAMPLES = [
  '1994 年上映了哪些电影？', '诺兰导演的电影里，评分最高的是哪部？',
  '《盗梦空间》的导演还拍过哪些电影？', '汤姆·汉克斯参演的电影都有哪些共同特点？',
  '这批电影里，美国电影和中国电影各有什么风格特点？',
]
type RouteState = { status: 'idle' | 'loading' | 'success' | 'error'; elapsed?: number; data?: SearchResult; error?: string }
const idleRoutes = (): Record<SearchMode, RouteState> => ({
  cypher: { status: 'idle' }, local: { status: 'idle' }, global: { status: 'idle' },
})
const emptyGraph: GraphData = { nodes: [], edges: [], truncated: false }

function errorMessage(error: unknown): string {
  const response = (error as { response?: { data?: { msg?: string } } })?.response
  return response?.data?.msg || (error instanceof Error ? error.message : '请求失败，请重试')
}
function valueText(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value) ?? '—'
}

export default function KnowledgeGraph() {
  const autoConnect = isLocalAutoConnectEnabled()
  const [draftKey, setDraftKey] = useState('')
  const [activeKey, setActiveKey] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [overview, setOverview] = useState<GraphOverview | null>(null)
  const [graph, setGraph] = useState<GraphData>(emptyGraph)
  const [graphLoading, setGraphLoading] = useState(false)
  const [graphError, setGraphError] = useState('')
  const [query, setQuery] = useState('')
  const [entityType, setEntityType] = useState<string>()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [submittedQuestion, setSubmittedQuestion] = useState('')
  const [routes, setRoutes] = useState(idleRoutes)
  const [asking, setAsking] = useState(false)
  const [phase, setPhase] = useState('')
  const [askError, setAskError] = useState('')
  const [answer, setAnswer] = useState('')
  const [context, setContext] = useState<MergeContext | null>(null)
  const connectionSeq = useRef(0), graphSeq = useRef(0), askSeq = useRef(0)
  const connectionController = useRef<AbortController>(), graphController = useRef<AbortController>(), askController = useRef<AbortController>()

  useEffect(() => () => {
    connectionSeq.current++; graphSeq.current++; askSeq.current++
    connectionController.current?.abort(); graphController.current?.abort(); askController.current?.abort()
  }, [])

  const connect = useCallback(async (keyOverride?: string) => {
    const key = (keyOverride ?? draftKey).trim()
    if (!key && !autoConnect) return
    const seq = ++connectionSeq.current
    graphSeq.current++; askSeq.current++
    connectionController.current?.abort(); graphController.current?.abort(); askController.current?.abort()
    const controller = new AbortController()
    connectionController.current = controller
    setConnecting(true); setConnectionError(''); setActiveKey(''); setOverview(null)
    setGraph(emptyGraph); setSelectedId(null); setQuery(''); setEntityType(undefined); setGraphError(''); setGraphLoading(false)
    setRoutes(idleRoutes()); setAsking(false); setPhase(''); setAnswer(''); setAskError(''); setContext(null); setSubmittedQuestion('')
    try {
      const [stats, initialGraph] = await Promise.all([getOverview(key, controller.signal), getGraph(key, {}, controller.signal)])
      if (seq !== connectionSeq.current) return
      setOverview(stats); setGraph(initialGraph); setActiveKey(key); setDraftKey('')
    } catch (error) {
      if (seq === connectionSeq.current) setConnectionError(errorMessage(error))
    } finally {
      if (seq === connectionSeq.current) setConnecting(false)
    }
  }, [autoConnect, draftKey])

  useEffect(() => {
    if (autoConnect) void connect('')
  }, [autoConnect, connect])

  const loadGraph = async (params: GraphQuery = { query: query.trim(), entity_type: entityType }) => {
    if (!overview) return
    const seq = ++graphSeq.current
    graphController.current?.abort()
    const controller = new AbortController()
    graphController.current = controller
    setGraphLoading(true); setGraphError(''); setSelectedId(null)
    try {
      const data = await getGraph(activeKey, params, controller.signal)
      if (seq === graphSeq.current) setGraph(data)
    } catch (error) {
      if (seq === graphSeq.current) { setGraphError(errorMessage(error)); setGraph(emptyGraph) }
    } finally {
      if (seq === graphSeq.current) setGraphLoading(false)
    }
  }

  const ask = async () => {
    const text = question.trim()
    if (!overview || !text || text.length > 2000) return
    const seq = ++askSeq.current
    askController.current?.abort()
    const controller = new AbortController()
    askController.current = controller
    setAsking(true); setAskError(''); setAnswer(''); setContext(null); setSubmittedQuestion(text); setPhase('三路并行检索中')
    setRoutes({ cypher: { status: 'loading' }, local: { status: 'loading' }, global: { status: 'loading' } })
    const results: Record<SearchMode, SearchResult | null> = { cypher: null, local: null, global: null }
    try {
      await Promise.all(MODES.map(async mode => {
        const start = performance.now()
        try {
          const data = await searchGraph(activeKey, mode, text, controller.signal)
          if (seq !== askSeq.current) return
          if (data.error) throw new Error(data.error)
          results[mode] = data
          setRoutes(previous => ({ ...previous, [mode]: { status: 'success', data, elapsed: (performance.now() - start) / 1000 } }))
        } catch (error) {
          if (seq === askSeq.current) setRoutes(previous => ({ ...previous, [mode]: {
            status: 'error', error: errorMessage(error), elapsed: (performance.now() - start) / 1000,
          } }))
        }
      }))
      if (seq !== askSeq.current) return
      if (MODES.every(mode => !results[mode])) throw new Error('三路检索均未成功，请检查错误后重试。')
      setPhase('合并材料并重新排序')
      const merged = await mergeSearch(activeKey, text, results, controller.signal)
      if (seq !== askSeq.current) return
      setContext(merged)
      if (merged.error) throw new Error(merged.error)
      setPhase('根据检索材料生成回答')
      const result = await answerQuestion(activeKey, text, merged, controller.signal)
      if (seq === askSeq.current) setAnswer(result.answer)
    } catch (error) {
      if (seq === askSeq.current) setAskError(errorMessage(error))
    } finally {
      if (seq === askSeq.current) { setAsking(false); setPhase('') }
    }
  }

  const selectNode = useCallback((id: string) => setSelectedId(id), [])
  const selectedNode = graph.nodes.find(node => node.id === selectedId)
  const adjacent = graph.edges.filter(edge => edge.source === selectedId || edge.target === selectedId)
  const browse = <div className="kg-browse">
    <form className="kg-filters" onSubmit={event => { event.preventDefault(); void loadGraph() }}>
      <Input aria-label="搜索实体" placeholder="搜索电影、人名或别名" value={query} onChange={event => setQuery(event.target.value)} allowClear />
      <Select aria-label="实体类型" placeholder="全部实体类型" value={entityType} onChange={setEntityType} allowClear
        options={overview?.entity_types.map(item => ({ value: item.type, label: `${TYPE_NAMES[item.type] || item.type} (${item.count})` }))} />
      <Button htmlType="submit" loading={graphLoading}>搜索图谱</Button>
      <Button onClick={() => { setQuery(''); setEntityType(undefined); void loadGraph({}) }}>重置</Button>
    </form>
    {graphError && <Alert type="error" showIcon message={graphError} />}
    <div className="kg-graph-caption"><span>当前视图 · {graph.nodes.length} 个实体 / {graph.edges.length} 条关系</span>
      <span>拖拽节点 · 滚轮缩放 · 点击查看详情</span></div>
    {graph.truncated && <Alert type="info" showIcon message="已展示部分实体，可缩小搜索范围或选择节点查看邻域。" />}
    {graphLoading ? <div className="kg-loading"><Spin /><span>正在加载图谱…</span></div> : graph.nodes.length ? <div className="kg-explorer">
      <section className="kg-node-list" aria-label="实体列表"><h3>实体 <span>{graph.nodes.length}</span></h3>
        {graph.nodes.map(node => <button key={node.id} type="button" aria-label={`查看实体 ${node.name}`}
          aria-pressed={selectedId === node.id} className={selectedId === node.id ? 'is-selected' : ''} onClick={() => selectNode(node.id)}>
          <span>{node.name}</span><small>{TYPE_NAMES[node.type] || node.type}</small>
        </button>)}
      </section>
      <KnowledgeGraphCanvas graph={graph} selectedId={selectedId} onSelect={selectNode} />
      <aside className="kg-details" aria-label="实体详情"><h3>实体详情</h3>
        {selectedNode ? <><Tag>{TYPE_NAMES[selectedNode.type] || selectedNode.type}</Tag><h4>{selectedNode.name}</h4>
          <dl>{Object.entries(selectedNode.properties).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{valueText(value)}</dd></div>)}</dl>
          <Button size="small" onClick={() => void loadGraph({ entity_id: selectedNode.id })}>查看关联图谱</Button>
          <h4>当前视图中的关系 · {adjacent.length}</h4>
          {adjacent.map(edge => <p key={edge.id} className="kg-relation">
            {graph.nodes.find(node => node.id === edge.source)?.name} → <strong>{edge.type}</strong> → {graph.nodes.find(node => node.id === edge.target)?.name}
          </p>)}
        </> : <p className="kg-muted">选择图中节点或左侧实体，查看属性与关系。</p>}
      </aside>
    </div> : !graphError && <Empty description="未找到匹配的实体，试试其他名称或类型。" />}
  </div>

  const qa = <div className="kg-qa">
    <section className="ai-panel kg-question-panel"><h3>向电影图谱提问</h3>
      <p className="kg-muted">三路检索并行运行，合并依据后生成回答。Global 会读取社区报告，通常耗时较长。</p>
      <div className="kg-examples">{EXAMPLES.map(example => <button key={example} type="button" onClick={() => setQuestion(example)} disabled={asking}>{example}</button>)}</div>
      <label className="kg-question-label" htmlFor="kg-question">问题</label>
      <Input.TextArea id="kg-question" aria-label="问题" value={question} onChange={event => setQuestion(event.target.value)}
        placeholder="例如：诺兰导演的电影里，评分最高的是哪部？" rows={3} maxLength={2000} showCount disabled={asking} />
      <div className="kg-question-actions"><span aria-live="polite">{phase}</span>
        <Button type="primary" loading={asking} disabled={!question.trim() || asking} onClick={() => void ask()}>开始检索</Button></div>
    </section>
    {submittedQuestion && <p className="kg-submitted">本次问题：{submittedQuestion}</p>}
    <div className="kg-routes" aria-live="polite">{MODES.map(mode => {
      const route = routes[mode]
      return <section className="ai-panel kg-route" key={mode}>
        <div className="kg-route-header"><h3>{MODE_NAMES[mode]}</h3><Tag color={route.status === 'success' ? 'success' : route.status === 'error' ? 'error' : 'default'}>
          {{ idle: '等待提问', loading: '检索中…', success: '已完成', error: '未成功' }[route.status]}</Tag></div>
        <p className="kg-muted">{MODE_HINTS[mode]}</p>
        {route.elapsed !== undefined && <p className="kg-timing">耗时 {route.elapsed.toFixed(2)} 秒</p>}
        {route.error && <p role="alert" className="kg-route-error">{route.error}</p>}
        {route.data && <details><summary>原始检索材料</summary><pre>{JSON.stringify(route.data, null, 2)}</pre></details>}
      </section>
    })}</div>
    {askError && <Alert type="error" showIcon message={askError} />}
    {answer && <section className="ai-panel kg-answer"><h3>图谱回答</h3><div className="markdown-body"><ReactMarkdown>{answer}</ReactMarkdown></div>
      <p className="kg-muted">具体事实优先依据 Cypher / Local；Global 与社区摘要用于概括整体特点。</p></section>}
    {context && <details className="ai-panel kg-merged"><summary>合并后的回答依据 · {context.items?.length ?? 0} 条材料</summary>
      <pre>{JSON.stringify(context, null, 2)}</pre></details>}
  </div>

  return <div className="ai-page kg-page">
    <header className="ai-page-header"><div><div className="kg-eyebrow">NEO4J · MOVIE GRAPH</div><h1>知识图谱</h1>
      <p>从电影与人物的关联中探索知识，对比三路检索的回答依据。</p></div>
      {overview && <Tag color="success">已连接</Tag>}</header>
    <section className="ai-panel kg-connection" aria-label="图谱连接">
      <div><h2>{overview ? '电影图谱已连接' : autoConnect ? '正在连接电影知识图谱' : '输入访问密钥，连接电影知识图谱'}</h2>
        <p>{autoConnect ? '使用本地环境配置自动连接。' : '访问密钥仅保留在当前页面内存中，刷新后需重新输入。'}</p></div>
      {autoConnect ? <Button loading={connecting} onClick={() => void connect('')}>重新连接</Button> :
      <form onSubmit={event => { event.preventDefault(); void connect() }}><Input.Password aria-label="KG API Key" placeholder={overview ? '输入新密钥以切换连接' : 'KG API Key'}
        autoComplete="off" value={draftKey} onChange={event => setDraftKey(event.target.value)} />
        <Button type="primary" htmlType="submit" loading={connecting} disabled={!draftKey.trim() || connecting}>{overview ? '重新连接' : '连接图谱'}</Button></form>}
    </section>
    {connectionError && <Alert type="error" showIcon message={connectionError} />}
    {overview && <>
      <section className="kg-stats" aria-label="图谱统计">{[
        ['电影', overview.movies], ['实体', overview.entities], ['关系', overview.relations], ['社区', overview.communities],
      ].map(([label, value]) => <div className="ai-panel" key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
      <Tabs defaultActiveKey="browse" items={[{ key: 'browse', label: '图谱浏览', children: browse }, { key: 'qa', label: '检索问答', children: qa }]} />
    </>}
  </div>
}
