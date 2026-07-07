import { useState, useRef } from 'react'
import { Layout, Typography, Card, Input, Button, Space, message, Alert } from 'antd'
import { SmileOutlined, SendOutlined } from '@ant-design/icons'
import { wellbeingChat } from '../service/mental-wellbeing'

const { Content } = Layout
const { Title, Text } = Typography

const MOODS = [
  { emoji: '😊', label: '开心', value: 'happy' },
  { emoji: '😐', label: '平静', value: 'neutral' },
  { emoji: '😔', label: '低落', value: 'sad' },
  { emoji: '😰', label: '焦虑', value: 'anxious' },
  { emoji: '😤', label: '愤怒', value: 'angry' },
  { emoji: '😴', label: '疲惫', value: 'tired' },
]

interface Message { role: 'user' | 'ai'; content: string }

export default function MentalWellbeing() {
  const [mood, setMood] = useState('')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(`session_${Date.now()}`)
  const chatRef = useRef<HTMLDivElement>(null)

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)
    let aiContent = ''
    setMessages(prev => [...prev, { role: 'ai', content: '' }])
    try {
      await wellbeingChat(userMsg, sessionId, mood, {
        onChunk: (c) => {
          aiContent += c.response || ''
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'ai', content: aiContent }
            return updated
          })
          chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
        },
      })
    } catch {
      message.error('连接失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ height: '100%', background: '#fff0f6' }}>
      <Content style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Space align="center" style={{ marginBottom: 12 }}>
          <SmileOutlined style={{ fontSize: 28, color: '#eb2f96' }} />
          <Title level={3} style={{ margin: 0 }}>AI 心理健康助手</Title>
        </Space>
        <Alert
          message="温馨提示：本助手提供情感支持，不替代专业心理治疗。如有危机，请拨打心理援助热线 400-161-9995。"
          type="info" showIcon closable style={{ marginBottom: 12 }}
        />

        {/* Mood selector */}
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Text strong style={{ lineHeight: '32px' }}>今日心情：</Text>
          {MOODS.map(m => (
            <Button key={m.value} size="small" type={mood === m.value ? 'primary' : 'default'}
              onClick={() => setMood(mood === m.value ? '' : m.value)}
              style={{ borderRadius: 20 }}>
              {m.emoji} {m.label}
            </Button>
          ))}
        </div>

        <Card style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderColor: '#ffadd2' }}>
          {/* Messages */}
          <div ref={chatRef} style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
                <SmileOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                <div>你好，我在这里陪你。有什么想聊的吗？</div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: 18,
                  background: msg.role === 'user' ? '#eb2f96' : '#fff0f6',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  border: msg.role === 'ai' ? '1px solid #ffadd2' : 'none',
                  lineHeight: 1.7, fontSize: 14,
                }}>
                  {msg.content || (loading && i === messages.length - 1 ? '...' : '')}
                </div>
              </div>
            ))}
          </div>
          {/* Input */}
          <div style={{ borderTop: '1px solid #ffadd2', paddingTop: 12 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="分享你的感受..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onPressEnter={handleSend}
                disabled={loading}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading}
                style={{ background: '#eb2f96', borderColor: '#eb2f96' }}>
                发送
              </Button>
            </Space.Compact>
          </div>
        </Card>
      </Content>
    </Layout>
  )
}
