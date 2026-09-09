import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button, Card, Drawer, Empty, Popconfirm, Spin, Tag, message as antMessage } from 'antd'
import { DeleteOutlined, FileSearchOutlined, PlusOutlined } from '@ant-design/icons'
import {
  auditDoctorSession,
  deleteDoctorSession,
  doctorChat,
  getDoctorHistory,
  getDoctorSession,
  type DoctorHistoryItem,
  type DoctorSessionResponse,
  type PatientInfo,
} from '../service/doctor'
import AskInput from '../components/AskInput'
import './MCP/MCPGaode.css'

/** 患者信息字段展示顺序与中文标签，与后端 _FIELD_LABELS 对齐 */
const PATIENT_INFO_FIELDS: [keyof PatientInfo, string][] = [
  ['name', '姓名'],
  ['age', '年龄'],
  ['gender', '性别'],
  ['chief_complaint', '主诉'],
  ['symptom_onset', '发病时间'],
  ['symptom_duration', '持续时长'],
  ['severity', '严重程度'],
  ['accompanying_symptoms', '伴随症状'],
  ['aggravating_factors', '加重因素'],
  ['relieving_factors', '缓解因素'],
  ['past_medical_history', '既往病史'],
  ['current_medications', '当前用药'],
  ['allergies', '过敏史'],
  ['family_history', '家族史'],
]

/** 参考 RAG 页：可点击的示例快捷消息，格式：性别 年龄 症状 */
const DOCTOR_EXAMPLES = [
  '男 18岁 头疼两天了',
  '女 35岁 最近失眠多梦',
  '男 42岁 咳嗽有痰两天',
  '女 28岁 胃痛反酸三天',
  '男 55岁 血压偏高想复查',
  '女 22岁 痛经严重',
]

type ChatMessage = { role: 'user' | 'assistant'; content: string }

/** 历史会话按更新时间分组，同 ChatGPT/Claude 侧边栏的"今天/昨天/7 天内/30 天内/更早" */
function bucketLabel(updatedAt: string | null): string {
  if (!updatedAt) return '更早'
  const d = new Date(updatedAt)
  const startOfDay = (t: number) => {
    const dt = new Date(t)
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime()
  }
  const diffDays = Math.round((startOfDay(Date.now()) - startOfDay(d.getTime())) / 86_400_000)
  if (diffDays <= 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays <= 7) return '7 天内'
  if (diffDays <= 30) return '30 天内'
  return '更早'
}

function groupHistory(history: DoctorHistoryItem[]): [string, DoctorHistoryItem[]][] {
  const groups = new Map<string, DoctorHistoryItem[]>()
  for (const item of history) {
    const label = bucketLabel(item.updated_at)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(item)
  }
  return Array.from(groups.entries())
}

export default function DoctorAgent() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [phase, setPhase] = useState<'collecting' | 'completed'>('collecting')
  const [assessment, setAssessment] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [historyLoading, setHistoryLoading] = useState(false)
  const [history, setHistory] = useState<DoctorHistoryItem[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const groupedHistory = useMemo(() => groupHistory(history), [history])

  const [caseSessionId, setCaseSessionId] = useState<string | null>(null)
  const [caseDetail, setCaseDetail] = useState<DoctorSessionResponse | null>(null)
  const [caseLoading, setCaseLoading] = useState(false)
  const [auditLoading, setAuditLoading] = useState(false)

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      setHistory(await getDoctorHistory())
    } catch (e) {
      antMessage.error((e as Error).message || '历史会话加载失败')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, assessment])

  const handleNewSession = () => {
    setSessionId(null)
    setMessages([])
    setPhase('collecting')
    setAssessment(null)
    setInput('')
  }

  const handleLoadHistorySession = async (id: string) => {
    if (id === sessionId) return
    setHistoryLoading(true)
    try {
      const data = await getDoctorSession(id)
      setSessionId(data.session_id)
      setMessages(data.messages)
      setPhase(data.phase)
      setAssessment(data.assessment)
      setInput('')
    } catch (e) {
      antMessage.error((e as Error).message || '会话加载失败')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteDoctorSession(id)
      setHistory((prev) => prev.filter((h) => h.session_id !== id))
      if (id === sessionId) handleNewSession()
    } catch (e) {
      antMessage.error((e as Error).message || '删除失败')
    }
  }

  const handleOpenCase = async (id: string) => {
    setCaseSessionId(id)
    setCaseDetail(null)
    setCaseLoading(true)
    try {
      setCaseDetail(await getDoctorSession(id))
    } catch (e) {
      antMessage.error((e as Error).message || '病历加载失败')
      setCaseSessionId(null)
    } finally {
      setCaseLoading(false)
    }
  }

  const handleGenerateAudit = async () => {
    if (!caseSessionId) return
    setAuditLoading(true)
    try {
      const audit_summary = await auditDoctorSession(caseSessionId)
      setCaseDetail((prev) => (prev ? { ...prev, audit_summary } : prev))
    } catch (e) {
      antMessage.error((e as Error).message || 'AI 审核生成失败')
    } finally {
      setAuditLoading(false)
    }
  }

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return

    setLoading(true)
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])

    try {
      const data = await doctorChat(sessionId, text)
      setSessionId(data.session_id)
      setPhase(data.phase ?? 'collecting')
      if (data.assessment != null) setAssessment(data.assessment)
      // 完成阶段且返回了报告时，只在下方案报告卡片展示，不在对话里重复
      if (data.phase === 'completed' && data.assessment != null) {
        setMessages((prev) => [...prev, { role: 'assistant', content: '根据您提供的信息，我已完成诊断分析，请查看下方报告。' }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      }
      loadHistory()
    } catch (e) {
      antMessage.error((e as Error).message || '发送失败')
      setMessages((prev) => [...prev, { role: 'assistant', content: `错误: ${(e as Error).message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* 左侧：开启新对话 + 历史会话列表（按更新时间分组） */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--ds-border, #e5e7eb)',
          background: 'var(--ds-bg-secondary, #fafafa)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 12 }}>
          <button
            type="button"
            onClick={handleNewSession}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '9px 0',
              borderRadius: 999,
              border: '1px solid var(--ds-border, #e5e7eb)',
              background: 'var(--ds-bg, #fff)',
              color: 'var(--ds-text)',
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <PlusOutlined /> 开启新对话
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
          {historyLoading && history.length === 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
              <Spin size="small" />
            </div>
          )}
          {!historyLoading && history.length === 0 && (
            <Empty description="暂无历史问诊" style={{ marginTop: 40 }} />
          )}
          {groupedHistory.map(([label, items]) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <div
                style={{
                  padding: '10px 8px 4px',
                  fontSize: 11,
                  color: 'var(--ds-text-secondary)',
                }}
              >
                {label}
              </div>
              {items.map((item) => {
                const active = item.session_id === sessionId
                const hovered = hoveredId === item.session_id
                return (
                  <div
                    key={item.session_id}
                    onClick={() => handleLoadHistorySession(item.session_id)}
                    onMouseEnter={(e) => {
                      setHoveredId(item.session_id)
                      if (!active) e.currentTarget.style.background = 'var(--ds-bg-hover, rgba(0,0,0,0.04))'
                    }}
                    onMouseLeave={(e) => {
                      setHoveredId(null)
                      if (!active) e.currentTarget.style.background = 'transparent'
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 4,
                      padding: '8px 10px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: active ? 'var(--ds-primary-bg, rgba(24,144,255,0.12))' : 'transparent',
                      marginBottom: 2,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--ds-text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.chief_complaint || '（未提供主诉）'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span
                          style={{
                            fontSize: 11,
                            color: item.phase === 'completed' ? 'var(--ds-success, #22c55e)' : 'var(--ds-text-secondary)',
                          }}
                        >
                          {item.phase === 'completed' ? '已完成' : '进行中'}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>
                          {item.turn_count} 轮 · {item.completion_pct}%
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      <FileSearchOutlined
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenCase(item.session_id)
                        }}
                        style={{
                          fontSize: 13,
                          color: 'var(--ds-text-secondary)',
                          padding: 2,
                          opacity: hovered ? 1 : 0,
                        }}
                      />
                      <Popconfirm
                        title="删除这条问诊记录？"
                        okText="删除"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDeleteSession(item.session_id)}
                      >
                        <DeleteOutlined
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: 13,
                            color: 'var(--ds-danger, #f85149)',
                            padding: 2,
                            opacity: hovered ? 1 : 0,
                          }}
                        />
                      </Popconfirm>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：问诊对话区 */}
      <div className="mcp-gaode" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
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
          <span style={{ fontSize: 18 }}>🩺</span>
          <h1 className="mcp-gaode-title" style={{ margin: 0, fontSize: 15 }}>
            全科医生智能体
          </h1>
          <span style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
            多轮问诊采集信息，生成深度诊断分析
          </span>
        </div>

        {/* 主区域：对话 + 诊断报告（收紧层高与间距） */}
        <div
          className="doctor-agent-messages"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '8px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {messages.length === 0 && (
            <div className="mcp-gaode-empty">
              <div className="mcp-gaode-empty-row">
                <span style={{ fontSize: 36 }}>🩺</span>
                <span className="mcp-gaode-empty-text">医生智能体</span>
              </div>
              <p className="mcp-gaode-empty-hint">
                您好，为了能更快地帮您分析，请提供您的年龄、性别，以及具体是哪里不舒服。
              </p>
            </div>
          )}

          {messages.map((m, i) => (
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

          {loading && messages[messages.length - 1]?.role === 'user' && (
            <div className="mcp-gaode-row mcp-gaode-row-assistant">
              <div className="mcp-gaode-bubble mcp-gaode-bubble-assistant mcp-gaode-typing">
                <span className="mcp-gaode-typing-label">医生正在回复</span>
                <span className="mcp-gaode-typing-dots"><i /><i /><i /></span>
              </div>
            </div>
          )}

          {/* 诊断报告（phase === completed 时展示） */}
          {assessment && (
            <Card
              size="small"
              title="📋 诊断分析报告"
              style={{ marginTop: 4 }}
              styles={{ header: { borderBottom: '2px solid var(--ds-primary)' } }}
            >
              <div className="markdown-body" style={{ lineHeight: 1.7, color: 'var(--ds-text)' }}>
                <ReactMarkdown>{assessment}</ReactMarkdown>
              </div>
            </Card>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 底部输入：参考 RAG 页提供示例快捷消息 */}
        <div style={{ padding: '8px 24px 16px', borderTop: '1px solid var(--ds-border, #e5e7eb)' }}>
          <AskInput
            value={input}
            onChange={setInput}
            onSend={() => handleSend()}
            innerTopSlot={
              !loading && phase !== 'completed' && DOCTOR_EXAMPLES.length > 0 ? (
                <>
                  {DOCTOR_EXAMPLES.map((q) => (
                    <Tag
                      key={q}
                      style={{ cursor: 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0 }}
                      onClick={() => handleSend(q)}
                    >
                      {q}
                    </Tag>
                  ))}
                </>
              ) : undefined
            }
            placeholder={phase === 'completed' ? '本次问诊已完成，可点击左侧「开启新对话」开始新会话' : '请提供年龄、性别，以及具体哪里不舒服…'}
            loading={loading}
            disabled={phase === 'completed'}
            buttonText="发送"
          />
        </div>

        <style>{`
          .doctor-agent-messages .mcp-gaode-row { margin-bottom: 12px; }
          .doctor-agent-messages .mcp-gaode-bubble { padding: 10px 14px; line-height: 1.45; }
          .doctor-agent-messages .mcp-gaode-bubble-text.markdown-body p { margin: 0.15em 0 !important; }
        `}</style>
      </div>

      {/* 病历面板：14 项患者信息 + AI 审核总结（未生成时显示"总结"按钮） */}
      <Drawer
        title="📁 问诊病历"
        placement="right"
        open={caseSessionId !== null}
        onClose={() => setCaseSessionId(null)}
        width="33.33%"
      >
        {caseLoading || !caseDetail ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px 16px',
                marginBottom: 16,
              }}
            >
              {PATIENT_INFO_FIELDS.map(([field, label]) => (
                <div key={field} style={{ fontSize: 13 }}>
                  <span style={{ color: 'var(--ds-text-secondary)' }}>{label}：</span>
                  <span style={{ color: 'var(--ds-text)' }}>{caseDetail.patient_info[field] || '—'}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--ds-border, #e5e7eb)', paddingTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🔍 AI 审核总结</div>
              {caseDetail.audit_summary ? (
                <div className="markdown-body" style={{ lineHeight: 1.7, color: 'var(--ds-text)', fontSize: 13 }}>
                  <ReactMarkdown>{caseDetail.audit_summary}</ReactMarkdown>
                </div>
              ) : caseDetail.phase === 'completed' ? (
                <Button size="small" type="primary" loading={auditLoading} onClick={handleGenerateAudit}>
                  生成 AI 审核总结
                </Button>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>问诊完成后才能生成 AI 审核总结</span>
              )}
            </div>
          </>
        )}
      </Drawer>
    </div>
  )
}
