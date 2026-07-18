import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { message, Tag, Button, Card } from 'antd'
import ReactMarkdown from 'react-markdown'
import LangGraph3DVisualizer, {
  type GraphData,
  type GraphNodeData,
  type ExecutionStepInfo,
} from '../components/LangGraph3DVisualizer'
import {
  listAgents,
  getAgentSchema,
  runAgentStream,
  DEFAULT_INPUTS,
  type AgentId,
  type AgentMeta,
  type AgentRunResult,
} from '../service/agent'
import { doctorChat } from '../service/doctor'
import AskInput from '../components/AskInput'
import './MCP/MCPGaode.css'

// ─── 本页配置：默认输入、占位符、示例问题、Tab 颜色 ────────────────────────
interface AgentTabColor {
  bg: string
  border: string
  selectedBg: string
}

interface AgentUiConfig {
  defaultInput: string
  placeholder: string
  exampleQueries: string[]
  tabColor: AgentTabColor
}

const DEFAULT_TAB_COLOR: AgentTabColor = {
  bg: 'rgba(100,100,100,0.12)',
  border: '#64748b',
  selectedBg: '#64748b',
}

const AGENT_UI_CONFIG: Record<string, AgentUiConfig> = {
  research_agent: {
    defaultInput: '新能源汽车行业投资机会',
    placeholder: '输入研究主题，如：新能源汽车行业投资机会',
    exampleQueries: [
      '新能源汽车行业投资机会',
      '人工智能产业链投资机会',
      '半导体行业近期走势分析',
    ],
    tabColor: { bg: 'rgba(59, 130, 246, 0.12)', border: 'var(--ai-primary)', selectedBg: 'var(--ai-primary)' },
  },
  fund_qa_agent: {
    defaultInput: '上海迪士尼乐园的开放时间是多少？',
    placeholder: '输入问题，如：上海迪士尼乐园的开放时间是多少？',
    exampleQueries: ['上海迪士尼乐园的开放时间是多少？'],
    tabColor: { bg: 'rgba(34, 197, 94, 0.12)', border: '#22c55e', selectedBg: '#22c55e' },
  },
  wealth_advisor_agent: {
    defaultInput: '根据当前市场情况，我应该如何调整投资组合？',
    placeholder: '输入咨询问题，如：如何调整投资组合？',
    exampleQueries: [
      '根据当前市场情况，我应该如何调整投资组合以应对可能的经济衰退？',
      '我想为子女准备教育金，请帮我设计一个10年期的投资计划。',
    ],
    tabColor: { bg: 'rgba(249, 115, 22, 0.12)', border: '#f97316', selectedBg: '#f97316' },
  },
  doctor_agent: {
    defaultInput: '',
    placeholder: '请提供年龄、性别，以及具体哪里不舒服…',
    exampleQueries: [],
    tabColor: { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', selectedBg: '#ef4444' },
  },
}

const DOCTOR_AGENT_ID = 'doctor_agent'

/** 全科医生智能体可点击的示例快捷消息，格式：性别 年龄 症状 */
const DOCTOR_EXAMPLES = [
  '男 18岁 头疼两天了',
  '女 35岁 最近失眠多梦',
  '男 42岁 咳嗽有痰两天',
  '女 28岁 胃痛反酸三天',
  '男 55岁 血压偏高想复查',
  '女 22岁 痛经严重',
]

function getAgentTabColor(agentId: string): AgentTabColor {
  return AGENT_UI_CONFIG[agentId]?.tabColor ?? DEFAULT_TAB_COLOR
}

/** 从 finalState 取展示文案：response（迪士尼/通用）、final_report（投研）、final_response（投顾） */
function getDisplayResponse(finalState: Record<string, unknown> | undefined): string | null {
  if (!finalState) return null
  const text = (finalState.response ?? finalState.final_report ?? finalState.final_response) as string | null | undefined
  return text ?? null
}

interface ConvEntry {
  id: number
  agentId: string
  agentName: string
  query: string
  response: string | null
  loading?: boolean
}

type DoctorChatMessage = { role: 'user' | 'assistant'; content: string }

function Agent() {
  const [agents, setAgents] = useState<Record<string, AgentMeta & { id: string }>>({})
  const [selectedId, setSelectedId] = useState<AgentId | string | null>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loadingSchema, setLoadingSchema] = useState(false)
  const [runLoading, setRunLoading] = useState(false)
  const [runResult, setRunResult] = useState<AgentRunResult | null>(null)
  const [runKey, setRunKey] = useState(0)
  const [conversations, setConversations] = useState<ConvEntry[]>([])
  // 流式执行时实时累积的步骤数据，驱动 3D 动画；null 表示非流式状态
  const [streamingState, setStreamingState] = useState<{
    steps: ExecutionStepInfo[]
    executionOrder: string[]
    totalSteps?: number
  } | null>(null)
  const convBottomRef = useRef<HTMLDivElement>(null)
  const pendingAnswerByRunKeyRef = useRef<Map<number, { entryId: number; response: string | null }>>(new Map())
  const doctorMessagesEndRef = useRef<HTMLDivElement>(null)

  // 全科医生智能体：会话与聊天状态
  const [doctorSessionId, setDoctorSessionId] = useState<string | null>(null)
  const [doctorMessages, setDoctorMessages] = useState<DoctorChatMessage[]>([])
  const [doctorPhase, setDoctorPhase] = useState<'collecting' | 'completed'>('collecting')
  const [doctorAssessment, setDoctorAssessment] = useState<string | null>(null)
  const [doctorLoading, setDoctorLoading] = useState(false)
  const [doctorInput, setDoctorInput] = useState('')

  const [researchTopic, setResearchTopic] = useState(
    AGENT_UI_CONFIG.research_agent?.defaultInput ?? (DEFAULT_INPUTS.research_agent?.research_topic as string) ?? ''
  )
  const [fundQuery, setFundQuery] = useState(AGENT_UI_CONFIG.fund_qa_agent?.defaultInput ?? '')
  const [wealthQuery, setWealthQuery] = useState(AGENT_UI_CONFIG.wealth_advisor_agent?.defaultInput ?? '')

  const loadAgents = useCallback(async () => {
    const list = await listAgents()
    setAgents(list)
    if (!selectedId && Object.keys(list).length > 0) {
      setSelectedId(Object.keys(list)[0] as AgentId)
    }
  }, [selectedId])

  const loadSchema = useCallback(async (agentId: string) => {
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
  }, [])

  useEffect(() => {
    loadAgents()
  }, [])

  useEffect(() => {
    if (selectedId && selectedId !== DOCTOR_AGENT_ID) loadSchema(selectedId)
  }, [selectedId, loadSchema])

  useEffect(() => {
    doctorMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [doctorMessages, doctorAssessment])

  const getInputForRun = useCallback((): Record<string, unknown> => {
    if (!selectedId) return {}
    switch (selectedId) {
      case 'research_agent':
        return {
          ...DEFAULT_INPUTS.research_agent,
          research_topic: researchTopic,
        }
      case 'fund_qa_agent':
        return { messages: [{ role: 'user', content: fundQuery }] }
      case 'wealth_advisor_agent':
        return { ...DEFAULT_INPUTS.wealth_advisor_agent, user_query: wealthQuery }
      default:
        return DEFAULT_INPUTS[selectedId] ?? {}
    }
  }, [selectedId, researchTopic, fundQuery, wealthQuery])

  const handleDoctorNewSession = useCallback(() => {
    setDoctorSessionId(null)
    setDoctorMessages([])
    setDoctorPhase('collecting')
    setDoctorAssessment(null)
    setDoctorInput('')
  }, [])

  const handleDoctorSend = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? doctorInput).trim()
      if (!text || doctorLoading) return
      setDoctorLoading(true)
      setDoctorInput('')
      setDoctorMessages((prev) => [...prev, { role: 'user', content: text }])
      try {
        const data = await doctorChat(doctorSessionId, text)
        setDoctorSessionId(data.session_id)
        setDoctorPhase(data.phase ?? 'collecting')
        if (data.assessment != null) setDoctorAssessment(data.assessment)
        if (data.phase === 'completed' && data.assessment != null) {
          setDoctorMessages((prev) => [...prev, { role: 'assistant', content: '根据您提供的信息，我已完成诊断分析，请查看下方报告。' }])
        } else {
          setDoctorMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
        }
      } catch (e) {
        message.error((e as Error).message || '发送失败')
        setDoctorMessages((prev) => [...prev, { role: 'assistant', content: `错误: ${(e as Error).message}` }])
      } finally {
        setDoctorLoading(false)
      }
    },
    [doctorSessionId, doctorInput, doctorLoading]
  )

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
      if (!selectedId || !graphData) return
      setRunLoading(true)
      setRunResult(null)
      const thisRunKey = runKey + 1
      setRunKey(thisRunKey)

      const entryId = Date.now()
      const agentName = agents[selectedId]?.name ?? selectedId
      const queryText =
        overrideQuery ??
        (selectedId === 'research_agent'
          ? researchTopic
          : selectedId === 'fund_qa_agent'
            ? fundQuery
            : wealthQuery)
      if (overrideQuery) {
        if (selectedId === 'fund_qa_agent') setFundQuery(overrideQuery)
        else if (selectedId === 'wealth_advisor_agent') setWealthQuery(overrideQuery)
        else if (selectedId === 'research_agent') setResearchTopic(overrideQuery)
      }
      setConversations((prev) => [
        ...prev,
        { id: entryId, agentId: selectedId, agentName, query: queryText, response: null, loading: true },
      ])

      // 计算本次请求体
      const input = (() => {
        const base = getInputForRun()
        if (overrideQuery && selectedId === 'fund_qa_agent')
          return { messages: [{ role: 'user', content: overrideQuery }] }
        if (overrideQuery && selectedId === 'wealth_advisor_agent')
          return { ...base, user_query: overrideQuery }
        if (overrideQuery && selectedId === 'research_agent')
          return { ...base, research_topic: overrideQuery }
        return base
      })()

      // 判断当前图是否含有虚拟 input/output 节点
      const nodeIds = graphData.nodes.map((n) => n.id)
      const hasInput = nodeIds.includes('input')
      const hasOutput = nodeIds.includes('output')
      let inputAdded = false // 追踪虚拟 input 步骤是否已插入

      // 初始化流式状态（空数组），触发 visualizer 以 thisRunKey 重置并开始播放
      setStreamingState({ steps: [], executionOrder: [] })

      await runAgentStream(selectedId, input, {
        onInit: () => {
          // graphData 已由 /schema 加载，init 事件仅作确认，无需重新 setGraphData
          // 避免 graphData 引用变化导致 visualizer 内部动画状态被重置
        },

        onStep: (step) => {
          setStreamingState((prev) => {
            const prevSteps = prev?.steps ?? []
            const prevOrder = prev?.executionOrder ?? []
            const newSteps: ExecutionStepInfo[] = []
            const newOrder: string[] = []

            // 第一个真实步骤前，先插入虚拟 input 节点
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
          // 末尾追加虚拟 output 节点，让动画走完整个流程
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
            // 收到 done 后立即展示报告，不依赖动画结束（动画可能先于 onDone 触发完成回调导致对话不更新）
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
    [selectedId, graphData, runKey, getInputForRun, agents, researchTopic, fundQuery, wealthQuery]
  )

  useEffect(() => {
    convBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations])

  const doctorTabEntry: AgentMeta & { id: string } = {
    id: DOCTOR_AGENT_ID,
    name: '全科医生智能体',
    icon: '🩺',
    description: '多轮问诊采集信息，生成深度诊断分析',
    type: 'reactive',
  }
  const agentList = [doctorTabEntry, ...Object.values(agents)]
  const isDoctorSelected = selectedId === DOCTOR_AGENT_ID

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
      extendedSteps.push({
        nodeId: 'input',
        duration_ms: 400,
        output: finalState ?? getInputForRun(),
      })
    }
    extendedSteps.push(...rawSteps)
    if (hasOutput && runResult.executionOrder?.[runResult.executionOrder.length - 1] !== 'output') {
      extendedSteps.push({ nodeId: 'output', duration_ms: 300, output: finalState ?? {} })
    }
    return { executionOrder: order, steps: extendedSteps }
  }, [runResult, graphData, getInputForRun])

  const currentInputValue =
    selectedId === 'research_agent'
      ? researchTopic
      : selectedId === 'fund_qa_agent'
        ? fundQuery
        : selectedId === 'wealth_advisor_agent'
          ? wealthQuery
          : ''

  const setCurrentInput = (v: string) => {
    if (selectedId === 'research_agent') setResearchTopic(v)
    else if (selectedId === 'fund_qa_agent') setFundQuery(v)
    else if (selectedId === 'wealth_advisor_agent') setWealthQuery(v)
  }

  const inputPlaceholder = selectedId ? (AGENT_UI_CONFIG[selectedId]?.placeholder ?? '请先选择智能体') : '请先选择智能体'

  return (
    <div className={isDoctorSelected ? 'mcp-gaode' : ''} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 全科医生智能体：聊天式问诊 */}
      {isDoctorSelected ? (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              padding: '8px 20px',
              borderBottom: '1px solid var(--ds-border, #e5e7eb)',
              background: 'var(--ds-bg-secondary, #fafafa)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🩺</span>
              <span style={{ fontWeight: 600, fontSize: 15 }}>全科医生智能体</span>
              <span style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>多轮问诊采集信息，生成深度诊断分析</span>
            </div>
            <Button size="small" onClick={handleDoctorNewSession} disabled={doctorLoading}>
              新问诊
            </Button>
          </div>
          <div
            className="doctor-agent-messages"
            style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '8px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {doctorMessages.length === 0 && (
              <div className="mcp-gaode-empty">
                <div className="mcp-gaode-empty-row">
                  <span style={{ fontSize: 36 }}>🩺</span>
                  <span className="mcp-gaode-empty-text">全科医生智能体</span>
                </div>
                <p className="mcp-gaode-empty-hint">
                  您好，为了能更快地帮您分析，请提供您的年龄、性别，以及具体是哪里不舒服。
                </p>
              </div>
            )}
            {doctorMessages.map((m, i) => (
              <div
                key={i}
                className={m.role === 'user' ? 'mcp-gaode-row mcp-gaode-row-user' : 'mcp-gaode-row mcp-gaode-row-assistant'}
              >
                <div
                  className={`mcp-gaode-bubble mcp-gaode-bubble-${m.role} mcp-gaode-bubble-text${m.role === 'assistant' ? ' markdown-body' : ''}`}
                >
                  {m.role === 'assistant' ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
                </div>
              </div>
            ))}
            {doctorLoading && doctorMessages[doctorMessages.length - 1]?.role === 'user' && (
              <div className="mcp-gaode-row mcp-gaode-row-assistant">
                <div className="mcp-gaode-bubble mcp-gaode-bubble-assistant mcp-gaode-typing">
                  <span className="mcp-gaode-typing-label">医生正在回复</span>
                  <span className="mcp-gaode-typing-dots"><i /><i /><i /></span>
                </div>
              </div>
            )}
            {doctorAssessment && (
              <Card
                size="small"
                title="📋 诊断分析报告"
                style={{ marginTop: 4 }}
                styles={{ header: { borderBottom: '2px solid var(--ds-primary)' } }}
              >
                <div className="markdown-body" style={{ lineHeight: 1.7, color: 'var(--ds-text)' }}>
                  <ReactMarkdown>{doctorAssessment}</ReactMarkdown>
                </div>
              </Card>
            )}
            <div ref={doctorMessagesEndRef} />
          </div>
          <div
            style={{
              flexShrink: 0,
              padding: '8px 24px 16px',
              borderTop: '1px solid var(--ds-border, #e5e7eb)',
              background: 'var(--ds-bg, #fff)',
            }}
          >
            <AskInput
              value={doctorInput}
              onChange={setDoctorInput}
              onSend={() => handleDoctorSend()}
              innerTopSlot={
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {agentList.map((agent) => {
                      const isSelected = selectedId === agent.id
                      const colors = getAgentTabColor(agent.id)
                      return (
                        <button
                          key={agent.id}
                          type="button"
                          disabled={doctorLoading}
                          onClick={() => {
                            if (doctorLoading) return
                            setSelectedId(agent.id)
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
                            cursor: doctorLoading ? 'not-allowed' : 'pointer',
                            opacity: doctorLoading ? 0.6 : 1,
                            transition: 'background 0.2s, color 0.2s',
                          }}
                        >
                          <span style={{ marginRight: 4 }}>{agent.icon}</span>
                          {agent.name}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ minHeight: 28, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    {!doctorLoading && doctorPhase !== 'completed' && DOCTOR_EXAMPLES.length > 0 &&
                      DOCTOR_EXAMPLES.map((q) => (
                        <Tag
                          key={q}
                          style={{ cursor: 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0 }}
                          onClick={() => handleDoctorSend(q)}
                        >
                          {q}
                        </Tag>
                      ))}
                  </div>
                </>
              }
              placeholder={doctorPhase === 'completed' ? '本次问诊已完成，可点击「新问诊」开始新会话' : '请提供年龄、性别，以及具体哪里不舒服…'}
              loading={doctorLoading}
              disabled={doctorPhase === 'completed'}
              buttonText="发送"
            />
          </div>
          <style>{`
            .doctor-agent-messages .mcp-gaode-row { margin-bottom: 12px; }
            .doctor-agent-messages .mcp-gaode-bubble { padding: 10px 14px; line-height: 1.45; }
            .doctor-agent-messages .mcp-gaode-bubble-text.markdown-body p { margin: 0.15em 0 !important; }
          `}</style>
        </>
      ) : (
        <>
      {/* 3D 图可视化区（含内置仪表盘） */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {!selectedId ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0a0a1f',
              color: '#88aaff',
            }}
          >
            加载智能体列表中…
          </div>
        ) : (
          <>
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

            {/* 右侧对话/调用记录面板 */}
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
                        <span
                          style={{
                            fontSize: 10,
                            color: 'rgba(200,150,100,0.6)',
                            background: 'rgba(200,150,100,0.1)',
                            border: '1px solid rgba(200,150,100,0.2)',
                            borderRadius: 4,
                            padding: '1px 6px',
                          }}
                        >
                          {conv.agentName}
                        </span>
                      </div>
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

            {/* 加载中/无图数据时叠加层 */}
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
          </>
        )}
      </div>

      {/* 底部：智能体选择 + 输入（固定不随内容变化位移） */}
      <div style={{ flexShrink: 0, background: 'var(--ds-bg, #fff)' }}>
        <AskInput
          value={currentInputValue}
          onChange={setCurrentInput}
          onSend={() => handleRun()}
          disabled={!selectedId}
          loading={runLoading}
          buttonText="发送"
          innerTopSlot={
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {agentList.map((agent) => {
                const isSelected = selectedId === agent.id
                const colors = getAgentTabColor(agent.id)
                return (
                  <button
                    key={agent.id}
                    type="button"
                    disabled={runLoading}
                    onClick={() => {
                      if (runLoading) return
                      setSelectedId(agent.id)
                      setRunResult(null)
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
                    <span style={{ marginRight: 4 }}>{agent.icon}</span>
                    {agent.name}
                  </button>
                )
              })}
            </div>
            <div style={{ minHeight: 28, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              {selectedId && AGENT_UI_CONFIG[selectedId]?.exampleQueries?.length > 0 &&
                AGENT_UI_CONFIG[selectedId].exampleQueries.map((query) => (
                  <Tag
                    key={query}
                    style={{ cursor: runLoading ? 'not-allowed' : 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0 }}
                    onClick={() => !runLoading && handleRun(query)}
                  >
                    {query}
                  </Tag>
                ))}
            </div>
          </>
        }
        placeholder={inputPlaceholder}
      />
      </div>
        </>
      )}
    </div>
  )
}

export default Agent
