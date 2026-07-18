import { useState, useRef, useEffect } from 'react'
import { Layout, Typography, Input, Button, Card, Space, Tag, List, message, Popconfirm } from 'antd'
import { ThunderboltOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons'
import { memoryChatStream, getMemories, clearMemories, type Memory } from '../service/memory-chat'

const { Content } = Layout
const { Title, Text } = Typography

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function MemoryChat() {
  const [userId, setUserId] = useState('user_001')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [memories, setMemories] = useState<Memory[]>([])
  const [loadingMemories, setLoadingMemories] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMemories = async () => {
    if (!userId.trim()) return
    setLoadingMemories(true)
    try {
      const mems = await getMemories(userId.trim())
      setMemories(mems)
    } catch {
      // ignore
    } finally {
      setLoadingMemories(false)
    }
  }

  const handleSend = async () => {
    if (!userId.trim()) return message.warning('请输入用户 ID')
    if (!input.trim() || streaming) return
    const q = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      await memoryChatStream(userId.trim(), q, {
        onChunk: (chunk) => {
          if (chunk.response) {
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                role: 'assistant',
                content: updated[updated.length - 1].content + chunk.response,
              }
              return updated
            })
          }
        },
        onError: (err) => message.error(err instanceof Error ? err.message : String(err)),
      })
    } finally {
      setStreaming(false)
      // 对话完成后刷新记忆（等后端异步写完）
      setTimeout(fetchMemories, 2000)
    }
  }

  const handleClear = async () => {
    try {
      await clearMemories(userId.trim())
      setMemories([])
      message.success('记忆已清除')
    } catch {
      message.error('清除失败')
    }
  }

  return (
    <Layout style={{ height: '100%', background: '#f5f7fa' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <ThunderboltOutlined style={{ fontSize: 24, color: 'var(--ai-primary)' }} />
          <Title level={4} style={{ margin: 0 }}>对话持久记忆</Title>
        </Space>

        {/* 用户 ID */}
        <Space.Compact style={{ marginBottom: 16, width: 400 }}>
          <Input
            placeholder="用户 ID（默认 user_001）"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            onPressEnter={fetchMemories}
          />
          <Button onClick={fetchMemories} loading={loadingMemories}>加载记忆</Button>
        </Space.Compact>

        <div style={{ display: 'flex', gap: 16, height: 520 }}>
          {/* 左侧聊天区 70% */}
          <Card
            style={{ flex: 7, display: 'flex', flexDirection: 'column', minWidth: 0 }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', overflow: 'hidden' }}
          >
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', marginTop: 80 }}>
                  <Text type="secondary">输入消息开始对话，AI 会记住你的信息</Text>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                  <div style={{
                    maxWidth: '75%',
                    padding: '8px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? 'var(--ai-primary)' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content || (streaming && msg.role === 'assistant' ? '…' : '')}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="输入消息…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onPressEnter={handleSend}
                disabled={streaming}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={streaming} />
            </Space.Compact>
          </Card>

          {/* 右侧记忆面板 30% */}
          <Card
            title={<span>记忆面板 <Tag color="blue">{memories.length}</Tag></span>}
            extra={
              <Popconfirm title="确认清除所有记忆？" onConfirm={handleClear} okText="确认" cancelText="取消">
                <Button size="small" danger icon={<DeleteOutlined />}>清除</Button>
              </Popconfirm>
            }
            style={{ flex: 3, minWidth: 220, overflow: 'hidden' }}
            bodyStyle={{ height: '100%', overflowY: 'auto', padding: '8px 12px' }}
          >
            {memories.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 12 }}>暂无记忆，发送消息后自动提取</Text>
            ) : (
              <List
                size="small"
                dataSource={memories}
                renderItem={item => (
                  <List.Item style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Text style={{ fontSize: 13 }}>{item.content}</Text>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </div>
      </Content>
    </Layout>
  )
}
