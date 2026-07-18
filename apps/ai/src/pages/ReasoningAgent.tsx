import { useState, useRef } from 'react'
import { Layout, Typography, Card, Input, Button, Space, message, Spin, Collapse } from 'antd'
import { BulbOutlined, SendOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { reasoningChat } from '../service/reasoning-agent'

const { Content } = Layout
const { Title, Text } = Typography

const EXAMPLES = [
  '如果 5 只猫 5 分钟捉 5 只老鼠，那 100 只猫 100 分钟能捉多少只老鼠？',
  '一个球和一个球棒共 1.10 元，球棒比球贵 1 元，球多少钱？',
  '请用逻辑分析：所有人都会死，苏格拉底是人，因此苏格拉底会死吗？',
  '如何用 3 升和 5 升的水桶量出 4 升的水？',
]

export default function ReasoningAgent() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [thinking, setThinking] = useState('')
  const [answer, setAnswer] = useState('')
  const answerRef = useRef<HTMLDivElement>(null)

  const handleAsk = async (q?: string) => {
    const target = (q || question).trim()
    if (!target) return message.warning('请输入问题')
    setLoading(true)
    setThinking('')
    setAnswer('')
    try {
      await reasoningChat(target, {
        onThink: (t) => setThinking(prev => prev + t),
        onAnswer: (a) => {
          setAnswer(prev => prev + a)
          answerRef.current?.scrollTo({ top: answerRef.current.scrollHeight, behavior: 'smooth' })
        },
      })
    } catch {
      message.error('推理失败，请确认 Ollama 已启动且 deepseek-r1:1.5b 已下载')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ height: '100%', background: '#f5f0ff' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <BulbOutlined style={{ fontSize: 28, color: '#722ed1' }} />
          <Title level={3} style={{ margin: 0 }}>AI 推理思考 Agent</Title>
          <Text type="secondary">基于 DeepSeek-R1 本地推理</Text>
        </Space>

        <Card style={{ marginBottom: 16 }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="输入需要推理的问题..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onPressEnter={() => handleAsk()}
              size="large"
            />
            <Button type="primary" size="large" icon={<SendOutlined />} onClick={() => handleAsk()} loading={loading} style={{ background: '#722ed1', borderColor: '#722ed1' }}>
              推理
            </Button>
          </Space.Compact>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EXAMPLES.map((ex, i) => (
              <Button key={i} size="small" type="dashed" onClick={() => { setQuestion(ex); handleAsk(ex) }}>
                {ex.slice(0, 20)}...
              </Button>
            ))}
          </div>
        </Card>

        {loading && !thinking && !answer && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" tip="DeepSeek-R1 正在思考..." />
          </div>
        )}

        {thinking && (
          <Collapse defaultActiveKey={['think']} style={{ marginBottom: 16 }}>
            <Collapse.Panel
              key="think"
              header={<span><ThunderboltOutlined style={{ color: '#722ed1' }} /> 推理过程 <Text type="secondary" style={{ fontSize: 12 }}>（Chain of Thought）</Text></span>}
            >
              <div style={{ maxHeight: 300, overflow: 'auto', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, color: '#595959', background: 'var(--ai-surface-2)', padding: 12, borderRadius: 6 }}>
                {thinking}
                {loading && <span style={{ animation: 'blink 1s step-end infinite' }}>▊</span>}
              </div>
            </Collapse.Panel>
          </Collapse>
        )}

        {answer && (
          <Card style={{ borderLeft: '4px solid #722ed1' }}>
            <Title level={5} style={{ color: '#722ed1' }}>最终答案</Title>
            <div ref={answerRef} style={{ lineHeight: 1.8, fontSize: 15 }}>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', margin: 0 }}>
                {answer}
              </pre>
              {loading && <Spin size="small" style={{ marginLeft: 8 }} />}
            </div>
          </Card>
        )}
      </Content>
    </Layout>
  )
}
