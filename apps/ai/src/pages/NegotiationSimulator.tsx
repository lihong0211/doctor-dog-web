import { useState, useRef, useEffect } from 'react'
import { Layout, Typography, Card, Input, Button, Select, Space, message } from 'antd'
import { SwapOutlined, SendOutlined } from '@ant-design/icons'
import { getScenarios, negotiationChat, type Scenario } from '../service/negotiation'
import type { StreamChunk } from '../utils/streamChat'

const { Content } = Layout
const { Title, Text } = Typography

interface Message { role: 'user' | 'ai'; content: string; aiRole?: string }

export default function NegotiationSimulator() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [scenario, setScenario] = useState('car')
  const [userRole, setUserRole] = useState('buyer')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getScenarios().then(setScenarios).catch(() => {})
  }, [])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    const history = messages.map(m => ({ role: m.role === 'user' ? userRole : (m.aiRole || 'ai'), content: m.content }))
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)
    let aiContent = ''
    let aiRole = ''
    setMessages(prev => [...prev, { role: 'ai', content: '' }])
    try {
      await negotiationChat(
        { message: userMsg, scenario, user_role: userRole, history },
        {
          onChunk: (c: StreamChunk) => {
            const raw = c as unknown as { response?: string; ai_role?: string }
            aiContent += raw.response || ''
            aiRole = raw.ai_role || aiRole
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'ai', content: aiContent, aiRole }
              return updated
            })
            chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
          },
        }
      )
    } catch {
      message.error('连接失败')
    } finally {
      setLoading(false)
    }
  }

  const currentScenario = scenarios.find(s => s.key === scenario)

  return (
    <Layout style={{ height: '100%', background: '#fff7e6' }}>
      <Content style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Space align="center" style={{ marginBottom: 12 }}>
          <SwapOutlined style={{ fontSize: 28, color: '#fa541c' }} />
          <Title level={3} style={{ margin: 0 }}>AI 谈判模拟器</Title>
        </Space>

        <Card style={{ marginBottom: 12 }}>
          <Space wrap>
            <div>
              <Text strong>场景：</Text>
              <Select value={scenario} onChange={s => { setScenario(s); setMessages([]) }} style={{ width: 140, marginLeft: 8 }}>
                {scenarios.map(s => <Select.Option key={s.key} value={s.key}>{s.name}</Select.Option>)}
                {scenarios.length === 0 && <Select.Option value="car">买车谈判</Select.Option>}
              </Select>
            </div>
            <div>
              <Text strong>你的角色：</Text>
              <Select value={userRole} onChange={r => { setUserRole(r); setMessages([]) }} style={{ width: 100, marginLeft: 8 }}>
                <Select.Option value="buyer">买家</Select.Option>
                <Select.Option value="seller">卖家</Select.Option>
              </Select>
            </div>
            <Button size="small" onClick={() => setMessages([])}>重置对话</Button>
          </Space>
          {currentScenario && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#fff7e6', borderRadius: 6, fontSize: 13, color: '#666' }}>
              📋 {currentScenario.context}
            </div>
          )}
        </Card>

        <Card style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div ref={chatRef} style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
                <SwapOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                <div>发送第一条消息开始谈判！</div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12, gap: 8 }}>
                {msg.role === 'ai' && (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fa541c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>
                    AI
                  </div>
                )}
                <div style={{ maxWidth: '70%' }}>
                  {msg.role === 'ai' && msg.aiRole && <Text type="secondary" style={{ fontSize: 11 }}>{msg.aiRole}</Text>}
                  <div style={{
                    padding: '10px 14px', borderRadius: 16, marginTop: 2,
                    background: msg.role === 'user' ? '#fa541c' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    border: msg.role === 'ai' ? '1px solid #ffd8bf' : 'none',
                    lineHeight: 1.7,
                  }}>
                    {msg.content || (loading && i === messages.length - 1 ? '...' : '')}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #ffd8bf', paddingTop: 12 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input placeholder="发出你的报价或条件..." value={input} onChange={e => setInput(e.target.value)} onPressEnter={handleSend} disabled={loading} />
              <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading} style={{ background: '#fa541c', borderColor: '#fa541c' }}>
                发送
              </Button>
            </Space.Compact>
          </div>
        </Card>
      </Content>
    </Layout>
  )
}
