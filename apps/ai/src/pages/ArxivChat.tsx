import { useState, useRef } from 'react'
import { Layout, Typography, Card, Input, Button, Space, Tag, message, Spin } from 'antd'
import { ReadOutlined, SendOutlined } from '@ant-design/icons'
import { indexArxiv, askArxiv, type ArxivIndexResult } from '../service/arxiv-chat'
import type { StreamChunk } from '../utils/streamChat'

const { Content } = Layout
const { Title, Text, Paragraph } = Typography

interface Message { role: 'user' | 'ai'; content: string }

export default function ArxivChat() {
  const [arxivId, setArxivId] = useState('')
  const [indexResult, setIndexResult] = useState<ArxivIndexResult | null>(null)
  const [indexing, setIndexing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [asking, setAsking] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const handleIndex = async () => {
    if (!arxivId.trim()) return message.warning('请输入 ArXiv ID 或 URL')
    setIndexing(true)
    setIndexResult(null)
    setMessages([])
    try {
      const result = await indexArxiv(arxivId.trim())
      setIndexResult(result)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '索引失败（需要访问 arxiv.org，请检查网络）')
    } finally {
      setIndexing(false)
    }
  }

  const handleAsk = async () => {
    if (!indexResult || !input.trim()) return
    const q = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setAsking(true)
    let aiContent = ''
    setMessages(prev => [...prev, { role: 'ai', content: '' }])
    try {
      await askArxiv(indexResult.index_id, q, {
        onChunk: (c: StreamChunk) => {
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
      message.error('问答失败')
    } finally {
      setAsking(false)
    }
  }

  return (
    <Layout style={{ height: '100%', background: '#f5f5f5' }}>
      <Content style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <ReadOutlined style={{ fontSize: 28, color: '#13c2c2' }} />
          <Title level={3} style={{ margin: 0 }}>Chat with ArXiv 论文</Title>
        </Space>

        <Card style={{ marginBottom: 12 }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="输入 ArXiv ID（如 1706.03762）或完整 URL"
              value={arxivId}
              onChange={e => setArxivId(e.target.value)}
              onPressEnter={handleIndex}
              disabled={indexing}
            />
            <Button type="primary" onClick={handleIndex} loading={indexing} style={{ background: '#13c2c2', borderColor: '#13c2c2' }}>
              索引论文
            </Button>
          </Space.Compact>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['1706.03762 (Attention is All You Need)', '2303.08774 (GPT-4)', '2302.13971 (LLaMA)'].map(ex => (
              <Button key={ex} size="small" type="link" onClick={() => setArxivId(ex.split(' ')[0])}>
                {ex}
              </Button>
            ))}
          </div>
        </Card>

        {indexing && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" tip="正在下载并索引论文（需要访问 arxiv.org）..." />
          </div>
        )}

        {indexResult && (
          <>
            <Card size="small" style={{ marginBottom: 12, background: '#e6fffb', borderColor: '#87e8de' }}>
              <Text strong>{indexResult.title}</Text>
              {indexResult.abstract && (
                <Paragraph style={{ marginTop: 8, marginBottom: 0, fontSize: 12, color: '#666' }} ellipsis={{ rows: 2, expandable: true }}>
                  {indexResult.abstract}
                </Paragraph>
              )}
              <Space style={{ marginTop: 8 }}>
                <Tag color="cyan">ArXiv: {indexResult.arxiv_id}</Tag>
                {indexResult.page_count > 0 && <Tag>{indexResult.page_count} 页</Tag>}
              </Space>
            </Card>
            <Card style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div ref={chatRef} style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
                    <ReadOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                    <div>论文已索引，开始提问！</div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                    <div style={{
                      maxWidth: '75%', padding: '10px 14px', borderRadius: 16,
                      background: msg.role === 'user' ? '#13c2c2' : '#fff',
                      color: msg.role === 'user' ? '#fff' : '#333',
                      border: msg.role === 'ai' ? '1px solid #87e8de' : 'none',
                      lineHeight: 1.7,
                    }}>
                      {msg.content || (asking && i === messages.length - 1 ? '...' : '')}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                <Space.Compact style={{ width: '100%' }}>
                  <Input placeholder="对论文内容提问..." value={input} onChange={e => setInput(e.target.value)} onPressEnter={handleAsk} disabled={asking} />
                  <Button type="primary" icon={<SendOutlined />} onClick={handleAsk} loading={asking} style={{ background: '#13c2c2', borderColor: '#13c2c2' }}>
                    提问
                  </Button>
                </Space.Compact>
              </div>
            </Card>
          </>
        )}
      </Content>
    </Layout>
  )
}
