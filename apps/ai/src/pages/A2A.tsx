import { useState } from 'react'
import { message, Spin, Card, Alert, Steps, Tag, Input, Button } from 'antd'
import { FileTextOutlined, UnorderedListOutlined, FileDoneOutlined } from '@ant-design/icons'
import AskInput from '../components/AskInput'
import {
  runA2AChainStream,
  resumeA2AChain,
  getTaskArtifactData,
  getTaskByAgent,
  type A2AChainResult,
  type OutlineArtifactData,
  type DocArtifactData,
  type SummaryArtifactData,
} from '../service/a2a'

/** 已知 Agent 在 UI 上的展示名（未知 Agent 直接显示原始 agent_name，路由加新 Agent 不需要改这里也能跑） */
const AGENT_LABELS: Record<string, string> = {
  StyleAgent: '风格设定',
  OutlineAgent: '大纲',
  DocAgent: '正文',
  SummaryAgent: '摘要',
}

/** 流式执行过程中的增量结果：按 Agent 名索引，不假设固定几步/固定顺序 */
interface StreamPartial {
  dataByAgent: Record<string, OutlineArtifactData | DocArtifactData | SummaryArtifactData>
  currentStep: number
  currentAgent: string
}

/** 暂停等待用户补充信息 */
interface PauseState {
  contextId: string
  question: string
  agent: string
}

const A2A_EXAMPLES = [
  'A2A 协议简介',
  '大模型应用开发实践',
  'Agent 与工作流编排',
  '多智能体协作场景',
]

export default function A2A() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [streamPartial, setStreamPartial] = useState<StreamPartial | null>(null)
  const [result, setResult] = useState<A2AChainResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pause, setPause] = useState<PauseState | null>(null)
  const [answer, setAnswer] = useState('')

  const runStream = async (overrideTopic?: string) => {
    const t = (typeof overrideTopic === 'string' ? overrideTopic : topic).trim()
    if (!t) {
      message.warning('请输入主题')
      return
    }
    setLoading(true)
    setErrorMsg(null)
    setResult(null)
    setPause(null)
    setAnswer('')
    setStreamPartial({ dataByAgent: {}, currentStep: 0, currentAgent: '' })
    // 与 React state 分开存一份同步可读的累积数据，onChainDone 触发时直接用，
    // 避免闭包里读到过期的 streamPartial state。
    const dataByAgent: Record<string, OutlineArtifactData | DocArtifactData | SummaryArtifactData> = {}
    try {
      await runA2AChainStream(t, {
        onStepStart(step, agent) {
          setStreamPartial((prev) => (prev ? { ...prev, currentStep: step, currentAgent: agent } : prev))
        },
        onStepDone(_step, agent, data) {
          if (!data) return
          const typed = data as OutlineArtifactData | DocArtifactData | SummaryArtifactData
          dataByAgent[agent] = typed
          setStreamPartial((prev) => (prev ? { ...prev, dataByAgent: { ...prev.dataByAgent, [agent]: typed } } : prev))
        },
        onChainDone(_data, chainSummary) {
          // 没有中途暂停、一次跑完的情况：流式事件里没有完整 Task，用已收集到的
          // 各步产出 + chain 摘要拼一份可展示的结果。
          if (!chainSummary?.length) return
          const tasks = chainSummary.map((step) => {
            const stepData = dataByAgent[step.agent_name]
            return stepData
              ? { id: '', contextId: '', status: { state: 'completed' as const }, artifacts: [{ artifactId: '', name: '', parts: [{ type: 'data', data: stepData }] }] }
              : { id: '', contextId: '', status: { state: step.status === 'failed' ? ('failed' as const) : ('completed' as const) }, artifacts: [] }
          })
          setResult({ chain: chainSummary, tasks, final_task: tasks[tasks.length - 1] })
          setStreamPartial(null)
        },
        onChainError(err) {
          setErrorMsg(err)
          message.error(err)
          setStreamPartial(null)
        },
        onChainPaused(contextId, question, agent) {
          setPause({ contextId, question, agent })
        },
      })
    } catch (e) {
      const msg = (e as Error).message || '流式请求失败'
      setErrorMsg(msg)
      message.error(msg)
      setStreamPartial(null)
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async (overrideAnswer?: string) => {
    if (!pause) return
    const a = (typeof overrideAnswer === 'string' ? overrideAnswer : answer).trim() || '跳过'
    setResuming(true)
    setErrorMsg(null)
    try {
      const full = await resumeA2AChain(pause.contextId, a)
      setResult(full)
      setPause(null)
      setAnswer('')
      setStreamPartial(null)
    } catch (e) {
      const msg = (e as Error).message || '续跑失败'
      setErrorMsg(msg)
      message.error(msg)
    } finally {
      setResuming(false)
    }
  }

  const isStreaming = loading && streamPartial != null
  const outline = isStreaming
    ? (streamPartial!.dataByAgent.OutlineAgent as OutlineArtifactData | undefined) ?? null
    : result
      ? getTaskArtifactData<OutlineArtifactData>(getTaskByAgent(result, 'OutlineAgent'))
      : null
  const doc = isStreaming
    ? (streamPartial!.dataByAgent.DocAgent as DocArtifactData | undefined) ?? null
    : result
      ? getTaskArtifactData<DocArtifactData>(getTaskByAgent(result, 'DocAgent'))
      : null
  const summary = isStreaming
    ? (streamPartial!.dataByAgent.SummaryAgent as SummaryArtifactData | undefined) ?? null
    : result
      ? getTaskArtifactData<SummaryArtifactData>(result.final_task) ??
        getTaskArtifactData<SummaryArtifactData>(getTaskByAgent(result, 'SummaryAgent'))
      : null

  // 执行链路面板只在有完整 chain（result，来自一次跑完或 resume 之后）时渲染，
  // 步数/顺序完全来自后端实际执行结果，不假设固定 3 步。
  const chainSteps = result?.chain ?? []
  const stepsItems = chainSteps.map((s) => ({
    title: AGENT_LABELS[s.agent_name] ?? s.agent_name,
    content: s.status === 'failed' ? s.error_message ?? '失败' : s.output_summary || s.agent_name,
    status:
      s.status === 'completed' ? ('finish' as const) : s.status === 'failed' ? ('error' as const) : ('wait' as const),
  }))
  const failedIndex = chainSteps.findIndex((s) => s.status === 'failed')
  const currentStepIndex = failedIndex >= 0 ? failedIndex : chainSteps.length
  const hasFailedStep = chainSteps.some((s) => s.status === 'failed')

  const showResultArea = isStreaming || pause != null || result != null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 可滚动内容区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24, textAlign: 'left' }}>
        <h1 style={{ marginBottom: 8 }}>A2A 多智能体内容生成链</h1>
        <p style={{ color: 'var(--ds-text-muted)', marginBottom: 24 }}>
          输入主题后，Host Agent 会动态决定执行顺序：StyleAgent（风格，可能需要你补充信息）→ OutlineAgent（大纲）→
          DocAgent（正文）→ SummaryAgent（摘要）。
        </p>

        {errorMsg && (
          <Alert type="error" message={errorMsg} closable onClose={() => setErrorMsg(null)} style={{ marginBottom: 24 }} />
        )}

        {isStreaming && !pause && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Spin size="small" style={{ marginRight: 8 }} />
            正在执行：{(AGENT_LABELS[streamPartial!.currentAgent] ?? streamPartial!.currentAgent) || '连接中…'}
          </Card>
        )}

        {pause && (
          <Card size="small" title="需要补充信息" style={{ marginBottom: 16 }}>
            <p style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{pause.question}</p>
            <Input.TextArea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="输入回答，留空或点「跳过」使用默认"
              autoSize={{ minRows: 1, maxRows: 3 }}
              disabled={resuming}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault()
                  submitAnswer()
                }
              }}
              style={{ marginBottom: 12 }}
            />
            <Button type="primary" onClick={() => submitAnswer()} loading={resuming}>
              提交并继续
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => submitAnswer('跳过')} disabled={resuming}>
              跳过
            </Button>
          </Card>
        )}

        {result && chainSteps.length > 0 && (
          <Card title="执行链路" size="small" style={{ marginBottom: 16 }}>
            <Steps
              current={Math.min(currentStepIndex, chainSteps.length)}
              status={hasFailedStep ? 'error' : undefined}
              items={stepsItems}
            />
            {hasFailedStep && (
              <Alert
                type="warning"
                style={{ marginTop: 16 }}
                message="部分步骤失败"
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {chainSteps
                      .filter((s) => s.status === 'failed')
                      .map((s) => (
                        <li key={s.step_index}>
                          Step {s.step_index} ({AGENT_LABELS[s.agent_name] ?? s.agent_name}): {s.error_message ?? '未知错误'}
                        </li>
                      ))}
                  </ul>
                }
              />
            )}
          </Card>
        )}

        {showResultArea && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Card
              size="small"
              title={<span><UnorderedListOutlined /> 大纲</span>}
              style={{ flex: 1, minWidth: 280 }}
            >
              {outline ? (
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: 14, marginBottom: 12 }}>{outline.topic}</h3>
                  {outline.sections?.map((sec, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <h4 style={{ fontSize: 13, marginBottom: 6 }}>{sec.title}</h4>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {(sec.key_points ?? []).map((p, j) => (
                          <li key={j} style={{ marginBottom: 4 }}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--ds-text-muted)' }}>执行到这一步后在此显示大纲</div>
              )}
            </Card>
            <Card
              size="small"
              title={<span><FileTextOutlined /> 文档</span>}
              style={{ flex: 1, minWidth: 280 }}
            >
              {doc ? (
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: 14, marginBottom: 12 }}>{doc.title}</h3>
                  {(doc.paragraphs ?? []).map((p, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <h4 style={{ fontSize: 13, marginBottom: 6 }}>{p.heading}</h4>
                      <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0, fontSize: 13 }}>{p.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--ds-text-muted)' }}>执行到这一步后在此显示文档</div>
              )}
            </Card>
            <Card
              size="small"
              title={<span><FileDoneOutlined /> 摘要</span>}
              style={{ flex: 1, minWidth: 280 }}
            >
              {summary ? (
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: 14, marginBottom: 12 }}>{summary.title}</h3>
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{summary.summary}</p>
                  {summary.key_points?.length > 0 && (
                    <>
                      <h4 style={{ fontSize: 13, marginTop: 12, marginBottom: 6 }}>关键点</h4>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {summary.key_points.map((p, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>{p}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--ds-text-muted)' }}>执行到这一步后在此显示摘要</div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* 底部输入区：示例主题放在输入框内 */}
      <AskInput
        value={topic}
        onChange={setTopic}
        onSend={() => runStream()}
        innerTopSlot={
          A2A_EXAMPLES.map((q) => (
            <Tag
              key={q}
              style={{ cursor: loading || resuming ? 'not-allowed' : 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0 }}
              onClick={() => !loading && !resuming && runStream(q)}
            >
              {q}
            </Tag>
          ))
        }
        placeholder="输入内容主题，如：A2A 协议简介"
        loading={loading || resuming}
      />
    </div>
  )
}
