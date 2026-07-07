import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { message, Tag } from 'antd'
import LangGraph3DVisualizer, {
  type GraphData,
  type GraphNodeData,
  type ExecutionStepInfo,
} from '../components/LangGraph3DVisualizer'
import {
  getGraph,
  runGraph,
  type GraphName,
  type RunResult,
  type HistoryMessage,
} from '../service/langgraph'
import AskInput from '../components/AskInput'

const GRAPH_OPTIONS: { value: GraphName; label: string }[] = [
  { value: 'router', label: 'Router' },
  { value: 'loop', label: 'Loop' },
  { value: 'parallel', label: 'Parallel' },
]

/** 各图类型的默认 query 和示例，按意图匹配 */
const GRAPH_EXAMPLES: Record<GraphName, { defaultQuery: string; examples: { label: string; query: string }[] }> = {
  router: {
    defaultQuery: '上海今天天气怎么样？',
    examples: [
      { label: '天气', query: '上海今天天气怎么样？' },
      { label: '新闻', query: '今天AI领域有什么值得关注的新闻？' },
      { label: '闲聊', query: '随便聊聊' },
    ],
  },
  loop: {
    defaultQuery: '人工智能的未来发展方向是什么？',
    examples: [
      { label: '思考1', query: '人工智能的未来发展方向是什么？' },
      { label: '思考2', query: '为什么越来越多的人选择远程工作？' },
      { label: '思考3', query: '如何在繁忙的工作中保持高效学习？' },
    ],
  },
  parallel: {
    defaultQuery: '最近AI大模型发展很快，各家公司都在竞争，用户体验也越来越好。',
    examples: [
      { label: '文本1', query: '最近AI大模型发展很快，各家公司都在竞争，用户体验也越来越好。' },
      { label: '文本2', query: '今天股市大跌，投资者情绪低落，市场前景不容乐观。' },
      { label: '文本3', query: '春天来了，天气晴朗，适合出门踏青，心情非常愉快。' },
    ],
  },
}

interface ConvEntry {
  id: number
  graphName: GraphName
  query: string
  response: string | null
  loading?: boolean
}

function LangChain() {
  const [graphName, setGraphName] = useState<GraphName>('router')
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [runLoading, setRunLoading] = useState(false)
  const [query, setQuery] = useState(GRAPH_EXAMPLES.router.defaultQuery)
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [runKey, setRunKey] = useState(0)
  const [conversations, setConversations] = useState<ConvEntry[]>([])
  const convBottomRef = useRef<HTMLDivElement>(null)
  const pendingAnswerByRunKeyRef = useRef<Map<number, { entryId: number; response: string | null }>>(new Map())

  const loadGraph = useCallback(async (name: GraphName) => {
    setLoading(true)
    try {
      const data = await getGraph(name)
      setGraphData(data)
      setRunResult(null)
    } catch (e) {
      message.error((e as Error).message || '获取图结构失败')
      setGraphData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGraph(graphName)
  }, [graphName, loadGraph])

  const runWithInput = useCallback(
    async (inputQuery: string) => {
      if (!graphData) return
      setRunLoading(true)
      setRunResult(null)
      const thisRunKey = runKey + 1
      setRunKey(thisRunKey)

      const entryId = Date.now()
      setConversations((prev) => [
        ...prev,
        { id: entryId, graphName, query: inputQuery, response: null, loading: true },
      ])

      const history: HistoryMessage[] = conversations.flatMap((c) => {
        const msgs: HistoryMessage[] = [{ role: 'user', content: c.query }]
        if (c.response) msgs.push({ role: 'assistant', content: c.response })
        return msgs
      })

      try {
        const data = await runGraph(graphName, {
          query: inputQuery || undefined,
          intent: '',
          response: '',
          history: history.length > 0 ? history : undefined,
        })
        setRunResult(data)
        const responseText = (data.finalState as Record<string, unknown> | undefined)?.response as string | null ?? null
        pendingAnswerByRunKeyRef.current.set(thisRunKey, { entryId, response: responseText })
        setQuery('')
      } catch (err) {
        message.error((err as Error).message || '执行失败')
        setRunResult(null)
        setConversations((prev) => prev.filter((c) => c.id !== entryId))
      } finally {
        setRunLoading(false)
      }
    },
    [graphName, graphData, conversations]
  )

  const handleAnimationComplete = useCallback((completedRunKey: number) => {
    const pending = pendingAnswerByRunKeyRef.current.get(completedRunKey)
    if (!pending) return
    pendingAnswerByRunKeyRef.current.delete(completedRunKey)
    setConversations((prev) =>
      prev.map((c) => (c.id === pending.entryId ? { ...c, loading: false, response: pending.response } : c))
    )
  }, [])

  useEffect(() => {
    convBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations])

  const handleRun = () => runWithInput(query || '')

  // 补全虚拟 input/output 节点，以便 3D 从「输入」高亮到「输出」；useMemo 稳定引用
  const { executionOrder, steps } = useMemo(() => {
    if (!runResult || !graphData) {
      return { executionOrder: undefined, steps: undefined }
    }
    const nodeIds = graphData.nodes.map((n) => n.id)
    const hasInput = nodeIds.includes('input')
    const hasOutput = nodeIds.includes('output')
    let order = [...(runResult.executionOrder ?? [])]
    if (hasInput && order[0] !== 'input') order = ['input', ...order]
    if (hasOutput && order[order.length - 1] !== 'output') order = [...order, 'output']

    const rawSteps = (runResult.steps ?? []).map((s) => ({
      nodeId: s.nodeId,
      duration_ms: s.duration_ms,
      output: s.output,
      stepIndex: s.stepIndex,
    }))
    const extendedSteps: ExecutionStepInfo[] = []
    if (hasInput && runResult.executionOrder?.[0] !== 'input') {
      extendedSteps.push({
        nodeId: 'input',
        duration_ms: 400,
        output: { query: (runResult.finalState as Record<string, unknown>)?.query ?? query },
      })
    }
    extendedSteps.push(...rawSteps)
    if (hasOutput && runResult.executionOrder?.[runResult.executionOrder.length - 1] !== 'output') {
      extendedSteps.push({
        nodeId: 'output',
        duration_ms: 300,
        output: runResult.finalState as Record<string, unknown>,
      })
    }
    return { executionOrder: order, steps: extendedSteps }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runResult, graphData])

  const tabColors: Record<GraphName, { bg: string; border: string; selectedBg: string }> = {
    router: { bg: 'rgba(59, 130, 246, 0.12)', border: '#3b82f6', selectedBg: '#3b82f6' },
    loop: { bg: 'rgba(34, 197, 94, 0.12)', border: '#22c55e', selectedBg: '#22c55e' },
    parallel: { bg: 'rgba(249, 115, 22, 0.12)', border: '#f97316', selectedBg: '#f97316' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 3D 图可视化区 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        {/* 始终保持 Canvas 挂载，避免切换时黑屏 */}
        {graphData && (
          <LangGraph3DVisualizer
            graphData={graphData}
            onNodeClick={(node: GraphNodeData) => console.log('点击节点:', node)}
            executionOrder={executionOrder}
            steps={steps}
            finalState={runResult?.finalState as Record<string, unknown> | undefined}
            totalSteps={runResult?.totalSteps}
            layerSpacing={graphName === 'router' ? 10 : undefined}
            runKey={runKey}
            onAnimationComplete={handleAnimationComplete}
          />
        )}
        {/* 跳跃点动画 */}
        <style>{`
          @keyframes conv-dot {
            0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
            40% { opacity: 1; transform: translateY(-3px); }
          }
        `}</style>

        {/* 右侧对话历史面板 */}
        {conversations.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 300,
            maxHeight: 'calc(100% - 40px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10,
          }}>
            {/* 面板头 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(30, 22, 18, 0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(200, 150, 100, 0.4)',
              borderRadius: '12px 12px 0 0',
              padding: '10px 14px',
              color: '#d4a574',
              fontSize: 13,
              fontWeight: 600,
            }}>
              <span>💬 对话记录</span>
              <button
                type="button"
                onClick={() => setConversations([])}
                style={{
                  background: 'none',
                  border: '1px solid rgba(200, 150, 100, 0.4)',
                  borderRadius: 4,
                  color: 'rgba(255,235,200,0.7)',
                  fontSize: 11,
                  padding: '2px 8px',
                  cursor: 'pointer',
                }}
              >
                清空
              </button>
            </div>

            {/* 气泡列表 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              background: 'rgba(20, 14, 10, 0.75)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(200, 150, 100, 0.4)',
              borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              maxHeight: 'calc(100% - 42px)',
            }}>
              {conversations.map((conv) => (
                <div key={conv.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* graph tag */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{
                      fontSize: 10,
                      color: 'rgba(200,150,100,0.6)',
                      background: 'rgba(200,150,100,0.1)',
                      border: '1px solid rgba(200,150,100,0.2)',
                      borderRadius: 4,
                      padding: '1px 6px',
                    }}>{conv.graphName}</span>
                  </div>
                  {/* user query */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{
                      background: 'rgba(96, 165, 250, 0.18)',
                      border: '1px solid rgba(96, 165, 250, 0.35)',
                      borderRadius: '12px 12px 2px 12px',
                      padding: '7px 11px',
                      fontSize: 13,
                      color: '#93c5fd',
                      maxWidth: '85%',
                      lineHeight: 1.5,
                      wordBreak: 'break-all',
                    }}>{conv.query}</div>
                  </div>
                  {/* response / loading */}
                  {(conv.loading || conv.response) && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{
                        background: 'rgba(30, 22, 18, 0.85)',
                        border: '1px solid rgba(200, 150, 100, 0.35)',
                        borderRadius: '12px 12px 12px 2px',
                        padding: '7px 11px',
                        fontSize: 13,
                        color: conv.loading ? 'rgba(200,150,100,0.6)' : 'rgba(255, 245, 235, 0.9)',
                        maxWidth: '90%',
                        lineHeight: 1.6,
                        wordBreak: 'break-all',
                      }}>
                        {conv.loading ? (
                          <span style={{ letterSpacing: 2 }}>
                            <span style={{ animation: 'conv-dot 1.2s infinite 0s' }}>·</span>
                            <span style={{ animation: 'conv-dot 1.2s infinite 0.4s' }}>·</span>
                            <span style={{ animation: 'conv-dot 1.2s infinite 0.8s' }}>·</span>
                          </span>
                        ) : conv.response}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={convBottomRef} />
            </div>
          </div>
        )}

        {/* 加载中/无数据时叠加半透明提示，不销毁 Canvas */}
        {(loading || !graphData) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: graphData ? 'rgba(10,10,31,0.55)' : '#0a0a1f',
              backdropFilter: graphData ? 'blur(2px)' : 'none',
              color: '#88aaff',
              pointerEvents: 'none',
            }}
          >
            {loading ? '加载图结构中…' : '暂无图数据'}
          </div>
        )}
      </div>

      {/* 底部输入区：图类型 3 个 Tab + 示例 Tag 均放入输入框内 */}
      <AskInput
        value={query}
        onChange={setQuery}
        onSend={handleRun}
        innerTopSlot={
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {GRAPH_OPTIONS.map(({ value, label }) => {
                const isSelected = graphName === value
                const colors = tabColors[value]
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={runLoading}
                    onClick={() => {
                      if (runLoading) return
                      setGraphName(value)
                      setRunResult(null)
                      setQuery(GRAPH_EXAMPLES[value].defaultQuery)
                    }}
                    style={{
                      height: 26,
                      padding: '0 10px',
                      borderRadius: 8,
                      border: 'none',
                      minWidth: 72,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? colors.selectedBg : colors.bg,
                      color: isSelected ? '#fff' : colors.border,
                      fontWeight: 600,
                      fontSize: 12,
                      lineHeight: 1,
                      cursor: runLoading ? 'not-allowed' : 'pointer',
                      opacity: runLoading ? 0.6 : 1,
                      transition: 'background 0.2s, color 0.2s',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {GRAPH_EXAMPLES[graphName].examples.map(({ query: q }) => (
              <Tag
                key={q}
                style={{ cursor: runLoading ? 'not-allowed' : 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0, maxWidth: '100%', whiteSpace: 'normal', lineHeight: '20px' }}
                onClick={() => !runLoading && runWithInput(q)}
              >
                {q}
              </Tag>
            ))}
          </>
        }
        placeholder={GRAPH_EXAMPLES[graphName].defaultQuery}
        loading={runLoading}
        buttonText="发送"
        minRows={1}
        maxRows={3}
      />
    </div>
  )
}

export default LangChain
