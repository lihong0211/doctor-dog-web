import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button, Card, Tag, message as antMessage } from 'antd'
import { doctorChat } from '../service/doctor'
import AskInput from '../components/AskInput'
import './MCP/MCPGaode.css'

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

export default function DoctorAgent() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [phase, setPhase] = useState<'collecting' | 'completed'>('collecting')
  const [assessment, setAssessment] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    } catch (e) {
      antMessage.error((e as Error).message || '发送失败')
      setMessages((prev) => [...prev, { role: 'assistant', content: `错误: ${(e as Error).message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mcp-gaode" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 顶部：标题 + 新问诊 */}
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
          <h1 className="mcp-gaode-title" style={{ margin: 0, fontSize: 15 }}>
            全科医生智能体
          </h1>
          <span style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
            多轮问诊采集信息，生成深度诊断分析
          </span>
        </div>
        <Button size="small" onClick={handleNewSession} disabled={loading}>
          新问诊
        </Button>
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
          placeholder={phase === 'completed' ? '本次问诊已完成，可点击「新问诊」开始新会话' : '请提供年龄、性别，以及具体哪里不舒服…'}
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
  )
}
