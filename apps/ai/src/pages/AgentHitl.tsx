import { useState } from 'react'
import { message, Card, Alert, Button, Tag } from 'antd'
import { useNavigate } from 'react-router-dom'
import AskInput from '../components/AskInput'
import { runHitl, type HitlInterrupt } from '../service/langgraph'

const HITL_EXAMPLES = [
  '帮我给客户回一封确认周三开会的邮件',
  '帮我把这个月的报销单提交给财务',
  '帮我给团队发一条明天的站会提醒',
]

export default function AgentHitl() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<HitlInterrupt | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const submit = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim()
    if (!q) {
      message.warning('请输入请求')
      return
    }
    setLoading(true)
    setErrorMsg(null)
    setPending(null)
    // 每次新请求都是一段新会话（新 threadId），checkpointer 才不会读到上一轮的暂停状态
    const tid = crypto.randomUUID()
    try {
      const result = await runHitl(tid, q)
      if (result.waitingForInput && result.interrupt) {
        setPending(result.interrupt)
      } else {
        message.info('该请求无需人工审核，已直接返回结果')
      }
      setQuery('')
    } catch (e) {
      const msg = (e as Error).message || '请求失败'
      setErrorMsg(msg)
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 24, textAlign: 'left' }}>
        <h1 style={{ marginBottom: 8 }}>人工处理（HITL）</h1>
        <p style={{ color: 'var(--ds-text-muted)', marginBottom: 24 }}>
          AI 先生成一条具体的行动建议，暂停下来等人工审核——批准（可先编辑内容）才会真正执行，拒绝则不执行任何操作。
          这是权限控制里 confirm 档的落地机制：有副作用的动作不能让模型自己一路执行到底。审核统一在「审核列表」页处理。
        </p>

        {errorMsg && (
          <Alert type="error" message={errorMsg} closable onClose={() => setErrorMsg(null)} style={{ marginBottom: 24 }} />
        )}

        {pending && (
          <Card size="small" title="已提交，等待人工审核" style={{ marginBottom: 16 }}>
            <p style={{ whiteSpace: 'pre-wrap', marginBottom: 8, color: 'var(--ds-text-muted)' }}>{pending.question}</p>
            <p style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{pending.suggestion}</p>
            <Button type="primary" onClick={() => navigate('/skills/agent-review')}>
              前往审核列表处理
            </Button>
          </Card>
        )}
      </div>

      <AskInput
        value={query}
        onChange={setQuery}
        onSend={() => submit()}
        innerTopSlot={HITL_EXAMPLES.map((q) => (
          <Tag
            key={q}
            style={{ cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0 }}
            onClick={() => !loading && submit(q)}
          >
            {q}
          </Tag>
        ))}
        placeholder="输入需要 AI 代办的请求，例如：帮我给客户发一封确认邮件"
        loading={loading}
      />
    </div>
  )
}
