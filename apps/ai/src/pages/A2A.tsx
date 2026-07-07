import { useState } from 'react'
import { message, Spin, Card, Alert, Steps, Tag } from 'antd'
import { FileTextOutlined, UnorderedListOutlined, FileDoneOutlined } from '@ant-design/icons'
import AskInput from '../components/AskInput'
import {
  runA2AChainStream,
  buildChainResultFromStream,
  getTaskArtifactData,
  type A2AChainResult,
  type OutlineArtifactData,
  type DocArtifactData,
  type SummaryArtifactData,
} from '../service/a2a'

/** 流式执行过程中的增量结果，用于按步展示 */
interface StreamPartial {
  outline: OutlineArtifactData | null
  doc: DocArtifactData | null
  summary: SummaryArtifactData | null
  chain: A2AChainResult['chain']
  currentStep: number
  stepLabel: string
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
  const [streamPartial, setStreamPartial] = useState<StreamPartial | null>(null)
  const [result, setResult] = useState<A2AChainResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const runStream = async (overrideTopic?: string) => {
    const t = (typeof overrideTopic === 'string' ? overrideTopic : topic).trim()
    if (!t) {
      message.warning('请输入主题')
      return
    }
    setLoading(true)
    setErrorMsg(null)
    setResult(null)
    setStreamPartial({
      outline: null,
      doc: null,
      summary: null,
      chain: [],
      currentStep: 0,
      stepLabel: '连接流式接口…',
    })
    const stepsData: (OutlineArtifactData | DocArtifactData | SummaryArtifactData | null)[] = [null, null, null]
    let chain: A2AChainResult['chain'] = []
    let finalSummary: SummaryArtifactData | null = null
    try {
      await runA2AChainStream(t, {
        onStepStart(step, agent) {
          setStreamPartial((prev) => ({
            ...prev!,
            currentStep: step,
            stepLabel: `正在执行 Step ${step} ${agent}…`,
          }))
        },
        onStepDone(step, _agent, data) {
          if (step < 1 || step > 3 || !data) return
          const typed = data as OutlineArtifactData | DocArtifactData | SummaryArtifactData
          stepsData[step - 1] = typed
          setStreamPartial((prev) => {
            if (!prev) return prev
            const next = { ...prev }
            if (step === 1) next.outline = typed as OutlineArtifactData
            else if (step === 2) next.doc = typed as DocArtifactData
            else if (step === 3) next.summary = typed as SummaryArtifactData
            return next
          })
        },
        onChainDone(data, chainSummary) {
          if (data) finalSummary = data
          if (chainSummary?.length) chain = chainSummary
          setResult(buildChainResultFromStream(stepsData, chain, finalSummary))
          setStreamPartial(null)
        },
        onChainError(err) {
          setErrorMsg(err)
          message.error(err)
          setStreamPartial(null)
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

  const isStreaming = loading && streamPartial != null
  const outline = isStreaming
    ? streamPartial!.outline
    : result
      ? getTaskArtifactData<OutlineArtifactData>(result.tasks?.[0])
      : null
  const doc = isStreaming ? streamPartial!.doc : result ? getTaskArtifactData<DocArtifactData>(result.tasks?.[1]) : null
  const summary = isStreaming
    ? streamPartial!.summary
    : result
      ? getTaskArtifactData<SummaryArtifactData>(result.final_task) ?? getTaskArtifactData<SummaryArtifactData>(result.tasks?.[2])
      : null

  const chainFromResult = result?.chain ?? []
  const chainFromStream = streamPartial?.chain ?? []
  const chainSteps = chainFromResult.length > 0 ? chainFromResult : chainFromStream
  const failedIndex = result?.chain?.findIndex((s) => s.status === 'failed')
  const currentStepIndex =
    failedIndex !== undefined && failedIndex >= 0
      ? failedIndex
      : (result?.chain?.length ?? 0) || (streamPartial?.currentStep ?? 0)
  const stepStatusFromChain = chainSteps.map((s) =>
    s.status === 'completed' ? 'finish' : s.status === 'failed' ? 'error' : 'wait'
  )
  const stepStatus: ('wait' | 'process' | 'finish' | 'error')[] = isStreaming
    ? [
        streamPartial!.outline ? 'finish' : streamPartial!.currentStep === 1 ? 'process' : 'wait',
        streamPartial!.doc ? 'finish' : streamPartial!.currentStep === 2 ? 'process' : 'wait',
        streamPartial!.summary ? 'finish' : streamPartial!.currentStep === 3 ? 'process' : 'wait',
      ]
    : stepStatusFromChain.length >= 3
      ? (stepStatusFromChain as ('wait' | 'process' | 'finish' | 'error')[])
      : ['wait', 'wait', 'wait']
  const stepDescriptions = isStreaming
    ? [
        streamPartial!.currentStep === 1 ? streamPartial!.stepLabel : '生成大纲',
        streamPartial!.currentStep === 2 ? streamPartial!.stepLabel : '生成文档',
        streamPartial!.currentStep === 3 ? streamPartial!.stepLabel : '生成摘要',
      ]
    : ['生成大纲', '生成文档', '生成摘要']
  const showResultArea = isStreaming || (result != null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 可滚动内容区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24, textAlign: 'left' }}>
        <h1 style={{ marginBottom: 8 }}>A2A 多智能体内容生成链</h1>
        <p style={{ color: 'var(--ds-text-muted)', marginBottom: 24 }}>
          输入主题后，将依次执行：OutlineAgent（大纲）→ DocAgent（文档）→ SummaryAgent（摘要），并返回完整链路结果。
        </p>

        {errorMsg && (
          <Alert type="error" message={errorMsg} closable onClose={() => setErrorMsg(null)} style={{ marginBottom: 24 }} />
        )}

        {loading && !streamPartial && (
          <Card>
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Spin size="large" tip="正在执行三智能体链路，请稍候…" />
            </div>
          </Card>
        )}

        {showResultArea && (
          <>
            <Card title="执行链路" size="small" style={{ marginBottom: 16 }}>
              <Steps
                current={Math.min(currentStepIndex, 3)}
                status={stepStatus[currentStepIndex] === 'error' ? 'error' : undefined}
                items={[
                  { title: 'OutlineAgent', description: stepDescriptions[0], status: stepStatus[0] },
                  { title: 'DocAgent', description: stepDescriptions[1], status: stepStatus[1] },
                  { title: 'SummaryAgent', description: stepDescriptions[2], status: stepStatus[2] },
                ]}
              />
              {chainSteps.some((s) => s.status === 'failed') && (
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
                            Step {s.step_index} ({s.agent_name}): {s.error_message ?? '未知错误'}
                          </li>
                        ))}
                    </ul>
                  }
                />
              )}
            </Card>

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
                  <div style={{ color: 'var(--ds-text-muted)' }}>执行第一步后在此显示大纲</div>
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
                  <div style={{ color: 'var(--ds-text-muted)' }}>执行第二步后在此显示文档</div>
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
                  <div style={{ color: 'var(--ds-text-muted)' }}>执行第三步后在此显示摘要</div>
                )}
              </Card>
            </div>
          </>
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
              style={{ cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0 }}
              onClick={() => !loading && runStream(q)}
            >
              {q}
            </Tag>
          ))
        }
        placeholder="输入内容主题，如：A2A 协议简介"
        loading={loading}
      />
    </div>
  )
}
