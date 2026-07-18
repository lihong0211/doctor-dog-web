import { useState, useRef, useEffect } from 'react'
import { Layout, Typography, Input, Button, Card, Space, Tag, message, Spin } from 'antd'
import { VideoCameraOutlined, SendOutlined, LoadingOutlined } from '@ant-design/icons'
import { indexVideo, askYoutube, type IndexResult } from '../service/youtube-chat'

const { Content } = Layout
const { Title, Text } = Typography

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function YouTubeChat() {
  const [videoUrl, setVideoUrl] = useState('')
  const [indexing, setIndexing] = useState(false)
  const [indexResult, setIndexResult] = useState<IndexResult | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleIndex = async () => {
    if (!videoUrl.trim()) return message.warning('请输入 YouTube 视频 URL')
    setIndexing(true)
    setIndexResult(null)
    setMessages([])
    try {
      const result = await indexVideo(videoUrl.trim())
      setIndexResult(result)
      message.success(`索引完成：${result.segment_count} 个片段`)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '索引失败')
    } finally {
      setIndexing(false)
    }
  }

  const handleSend = async () => {
    if (!indexResult) return message.warning('请先索引视频')
    if (!input.trim() || streaming) return
    const q = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])
    try {
      await askYoutube(indexResult.index_id, q, {
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
    }
  }

  return (
    <Layout style={{ height: '100%', background: 'var(--ai-canvas)' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <VideoCameraOutlined style={{ fontSize: 24, color: 'var(--ai-primary)' }} />
          <Title level={4} style={{ margin: 0 }}>Chat with YouTube</Title>
        </Space>

        <Card title="视频索引" style={{ marginBottom: 16 }}>
          <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
            <Input
              placeholder="输入 YouTube 视频 URL，例如：https://www.youtube.com/watch?v=aircAruvnKk"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              onPressEnter={handleIndex}
              disabled={indexing}
            />
            <Button type="primary" onClick={handleIndex} loading={indexing} disabled={indexing}>
              {indexing ? '索引中' : '索引'}
            </Button>
          </Space.Compact>

          {indexing && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <Spin indicator={<LoadingOutlined spin />} tip="正在提取字幕并建立索引..." />
            </div>
          )}

          {indexResult && (
            <Space wrap>
              <Tag color="green">视频 ID: {indexResult.video_id}</Tag>
              <Tag color="blue">字幕片段: {indexResult.segment_count}</Tag>
              <Tag color="orange">语言: {indexResult.language}</Tag>
            </Space>
          )}
        </Card>

        {indexResult && (
          <Card
            title="视频问答"
            style={{ display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ display: 'flex', flexDirection: 'column', height: 450, padding: '12px 16px' }}
          >
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', marginTop: 60 }}>
                  <Text type="secondary">索引完成！可以开始提问了</Text>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '8px 14px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? 'var(--ai-primary)' : '#fff',
                      color: msg.role === 'user' ? '#fff' : '#333',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content || (streaming && msg.role === 'assistant' ? '…' : '')}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="输入问题，例如：这个视频讲了什么？"
                value={input}
                onChange={e => setInput(e.target.value)}
                onPressEnter={handleSend}
                disabled={streaming}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={streaming}
                disabled={streaming}
              >
                发送
              </Button>
            </Space.Compact>
          </Card>
        )}
      </Content>
    </Layout>
  )
}
