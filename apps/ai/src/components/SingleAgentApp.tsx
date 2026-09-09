import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { message, Tag } from 'antd'
import ReactMarkdown from 'react-markdown'
import LangGraph3DVisualizer, {
  type GraphData,
  type GraphNodeData,
  type ExecutionStepInfo,
} from './LangGraph3DVisualizer'
import { getAgentSchema, runAgentStream, type AgentRunResult } from '../service/agent'
import AskInput from './AskInput'

/** 单个 agent 的独立展示页：3D LangGraph 执行可视化 + 输入 + 调用记录。
 * 从原 Agent.tsx 的多智能体切换页里拆出来，一个 agent 一个路由，不再需要 tab 切换。 */
export interface SingleAgentAppProps {
  agentId: string
  icon: string
  title: string
  description: string
  defaultInput: string
  placeholder: string
  exampleQueries: string[]
  buildInput: (query: string) => Record<string, unknown>
}

/** finalState 取展示文案：response（迪士尼/通用）、final_report（投研）、final_response（投顾） */
function getDisplayResponse(finalState: Record<string, unknown> | undefined): string | null {
  if (!finalState) return null
  const text = (finalState.response ?? finalState.final_report ?? finalState.final_response) as
    | string
    | null
    | undefined
  return text ?? null
}

interface ConvEntry {
  id: number
  query: string
  response: string | null
  loading?: boolean
}

export default function SingleAgentApp({
  agentId,
  icon,
  title,
  description,
  defaultInput,
  placeholder,
  exampleQueries,
  buildInput,
}: SingleAgentAppProps) {
  const [queryValue, setQueryValue] = useState(defaultInput)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loadingSchema, setLoadingSchema] = useState(false)
  const [runLoading, setRunLoading] = useState(false)
  const [runResult, setRunResult] = useState<AgentRunResult | null>(null)
  const [runKey, setRunKey] = useState(0)
  const [conversations, setConversations] = useState<ConvEntry[]>([])
  const [streamingState, setStreamingState] = useState<{
    steps: ExecutionStepInfo[]
    executionOrder: string[]
    totalSteps?: number
  } | null>(null)
  const convBottomRef = useRef<HTMLDivElement>(null)
  const pendingAnswerByRunKeyRef = useRef<Map<number, { entryId: number; response: string | null }>>(new Map())

  const loadSchema = useCallback(async () => {
    setLoadingSchema(true)
    try {
      const data = await getAgentSchema(agentId)
      setGraphData(data ?? null)
      setRunResult(null)
    } catch (e) {
      message.error((e as Error).message || '获取图结构失败')
      setGraphData(null)
    } finally {
      setLoadingSchema(false)
    }
  }, [agentId])

  useEffect(() => {
    loadSchema()
  }, [loadSchema])

  const handleAnimationComplete = useCallback((completedRunKey: number) => {
    const pending = pendingAnswerByRunKeyRef.current.get(completedRunKey)
    if (!pending) return
    pendingAnswerByRunKeyRef.current.delete(completedRunKey)
    setConversations((prev) =>
      prev.map((c) => (c.id === pending.entryId ? { ...c, loading: false, response: pending.response } : c))
    )
  }, [])

  const handleRun = useCallback(
    async (overrideQuery?: string) => {
      if (!graphData) return
      const queryText = overrideQuery ?? queryValue
      if (overrideQuery) setQueryValue(overrideQuery)

      setRunLoading(true)
      setRunResult(null)
      const thisRunKey = runKey + 1
      setRunKey(thisRunKey)

      const entryId = Date.now()
      setConversations((prev) => [...prev, { id: entryId, query: queryText, response: null, loading: true }])

      const input = buildInput(queryText)

      const nodeIds = graphData.nodes.map((n) => n.id)
      const hasInput = nodeIds.includes('input')
      const hasOutput = nodeIds.includes('output')
      let inputAdded = false

      setStreamingState({ steps: [], executionOrder: [] })

      await runAgentStream(agentId, input, {
        onStep: (step) => {
          setStreamingState((prev) => {
            const prevSteps = prev?.steps ?? []
            const prevOrder = prev?.executionOrder ?? []
            const newSteps: ExecutionStepInfo[] = []
            const newOrder: string[] = []

            if (!inputAdded && hasInput) {
              newSteps.push({ nodeId: 'input', duration_ms: 400, output: input })
              newOrder.push('input')
            }
            newSteps.push({
              nodeId: step.nodeId,
              duration_ms: step.duration_ms,
              output: step.output,
              stepIndex: step.stepIndex,
              label: step.label,
            })
            newOrder.push(step.nodeId)

            return {
              steps: [...prevSteps, ...newSteps],
              executionOrder: [...prevOrder, ...newOrder],
            }
          })
          if (!inputAdded) inputAdded = true
        },

        onDone: (result) => {
          if (hasOutput) {
            setStreamingState((prev) => {
              if (!prev) return prev
              const finalOutput = result.finalState ?? {}
              return {
                ...prev,
                steps: [...prev.steps, { nodeId: 'output', duration_ms: 300, output: finalOutput }],
                executionOrder: [...prev.executionOrder, 'output'],
                totalSteps: result.totalSteps,
              }
            })
          }

          if (result.error) {
            message.error(result.error)
            setConversations((prev) =>
              prev.map((c) => (c.id === entryId ? { ...c, loading: false, response: `错误: ${result.error}` } : c))
            )
          } else {
            setRunResult(result)
            const responseText = getDisplayResponse(result.finalState as Record<string, unknown> | undefined)
            pendingAnswerByRunKeyRef.current.set(thisRunKey, { entryId, response: responseText })
            setConversations((prev) =>
              prev.map((c) => (c.id === entryId ? { ...c, loading: false, response: responseText } : c))
            )
          }
          setRunLoading(false)
        },

        onError: (e) => {
          message.error(e.message || '执行失败')
          setConversations((prev) =>
            prev.map((c) => (c.id === entryId ? { ...c, loading: false, response: `错误: ${e.message}` } : c))
          )
          setStreamingState(null)
          setRunLoading(false)
        },
      })
    },
    [agentId, graphData, runKey, queryValue, buildInput]
  )

  useEffect(() => {
    convBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations])

  const { executionOrder, steps } = useMemo(() => {
    if (!runResult || !graphData) return { executionOrder: undefined, steps: undefined }
    const nodeIds = graphData.nodes.map((n) => n.id)
    const hasInput = nodeIds.includes('input')
    const hasOutput = nodeIds.includes('output')
    let order = [...(runResult.executionOrder ?? [])]
    if (hasInput && order[0] !== 'input') order = ['input', ...order]
    if (hasOutput && order[order.length - 1] !== 'output') order = [...order, 'output']

    const rawSteps = (runResult.steps ?? []).map((s, i) => ({
      nodeId: s.nodeId,
      duration_ms: s.duration_ms,
      output: s.output,
      stepIndex: s.stepIndex ?? i,
      label: s.label,
    }))
    const extendedSteps: ExecutionStepInfo[] = []
    const finalState = runResult.finalState as Record<string, unknown> | undefined
    if (hasInput && runResult.executionOrder?.[0] !== 'input') {
      extendedSteps.push({ nodeId: 'input', duration_ms: 400, output: finalState ?? buildInput(queryValue) })
    }
    extendedSteps.push(...rawSteps)
    if (hasOutput && runResult.executionOrder?.[runResult.executionOrder.length - 1] !== 'output') {
      extendedSteps.push({ nodeId: 'output', duration_ms: 300, output: finalState ?? {} })
    }
    return { executionOrder: order, steps: extendedSteps }
  }, [runResult, graphData, buildInput, queryValue])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 20px',
          borderBottom: '1px solid var(--ds-border, #e5e7eb)',
          background: 'var(--ds-bg-secondary, #fafafa)',
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
        <span style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>{description}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {graphData && (
          <LangGraph3DVisualizer
            key={runKey === 0 ? 'schema' : `run-${runKey}`}
            graphData={graphData}
            onNodeClick={(node: GraphNodeData) => console.log('点击节点:', node)}
            executionOrder={streamingState?.executionOrder ?? executionOrder}
            steps={streamingState?.steps ?? steps}
            finalState={runResult?.finalState as Record<string, unknown> | undefined}
            totalSteps={
              streamingState?.totalSteps ??
              runResult?.totalSteps ??
              runResult?.steps?.length ??
              runResult?.executionOrder?.length
            }
            runKey={streamingState !== null || runResult ? runKey : undefined}
            onAnimationComplete={handleAnimationComplete}
          />
        )}

        <style>{`
          @keyframes agent-conv-dot {
            0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
            40% { opacity: 1; transform: translateY(-3px); }
          }
        `}</style>

        {conversations.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 300,
              maxHeight: 'calc(100% - 40px)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10,
            }}
          >
            <div
              style={{
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
              }}
            >
              <span>💬 调用记录</span>
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
            <div
              style={{
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
              }}
            >
              {conversations.map((conv) => (
                <div key={conv.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div
                      style={{
                        background: 'rgba(96, 165, 250, 0.18)',
                        border: '1px solid rgba(96, 165, 250, 0.35)',
                        borderRadius: '12px 12px 2px 12px',
                        padding: '7px 11px',
                        fontSize: 13,
                        color: '#93c5fd',
                        maxWidth: '85%',
                        lineHeight: 1.5,
                        wordBreak: 'break-all',
                      }}
                    >
                      {conv.query}
                    </div>
                  </div>
                  {(conv.loading || conv.response) && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div
                        className="markdown-body"
                        style={{
                          background: 'rgba(30, 22, 18, 0.85)',
                          border: '1px solid rgba(200, 150, 100, 0.35)',
                          borderRadius: '12px 12px 12px 2px',
                          padding: '7px 11px',
                          fontSize: 13,
                          color: conv.loading ? 'rgba(200,150,100,0.6)' : 'rgba(255, 245, 235, 0.9)',
                          maxWidth: '90%',
                          maxHeight: 280,
                          overflowY: 'auto',
                          lineHeight: 1.6,
                          wordBreak: 'break-word',
                        }}
                      >
                        {conv.loading ? (
                          <span style={{ letterSpacing: 2 }}>
                            <span style={{ animation: 'agent-conv-dot 1.2s infinite 0s' }}>·</span>
                            <span style={{ animation: 'agent-conv-dot 1.2s infinite 0.4s' }}>·</span>
                            <span style={{ animation: 'agent-conv-dot 1.2s infinite 0.8s' }}>·</span>
                          </span>
                        ) : (
                          <ReactMarkdown>{conv.response ?? ''}</ReactMarkdown>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={convBottomRef} />
            </div>
          </div>
        )}

        {(loadingSchema || !graphData) && (
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
            {loadingSchema ? '加载图结构中…' : '暂无图数据'}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, background: 'var(--ds-bg, #fff)' }}>
        <AskInput
          value={queryValue}
          onChange={setQueryValue}
          onSend={() => handleRun()}
          disabled={!graphData}
          loading={runLoading}
          buttonText="发送"
          innerTopSlot={
            exampleQueries.length > 0 ? (
              <div style={{ minHeight: 28, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                {exampleQueries.map((query) => (
                  <Tag
                    key={query}
                    style={{ cursor: runLoading ? 'not-allowed' : 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0 }}
                    onClick={() => !runLoading && handleRun(query)}
                  >
                    {query}
                  </Tag>
                ))}
              </div>
            ) : undefined
          }
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
