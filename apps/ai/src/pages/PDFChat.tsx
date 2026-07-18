import { useState, useRef } from 'react'
import { Layout, Typography, Card, Upload, Input, Button, Space, Tag, message, Spin } from 'antd'
import { FilePdfOutlined, SendOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { indexPDF, askPDF, type PDFIndexResult } from '../service/pdf-chat'
import type { StreamChunk } from '../utils/streamChat'

const { Content } = Layout
const { Title, Text } = Typography
const { Dragger } = Upload

interface Message { role: 'user' | 'ai'; content: string }

export default function PDFChat() {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [indexResult, setIndexResult] = useState<PDFIndexResult | null>(null)
  const [indexing, setIndexing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [asking, setAsking] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const handleIndex = async (file: File) => {
    setIndexing(true)
    setIndexResult(null)
    setMessages([])
    try {
      const result = await indexPDF(file)
      setIndexResult(result)
      message.success(`索引完成：${result.page_count} 页，${result.chunk_count} 个片段`)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '索引失败')
    } finally {
      setIndexing(false)
    }
  }

  const handleAsk = async () => {
    if (!indexResult || !input.trim()) return
    const q = input.trim()
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: q }]
    setMessages(newMessages)
    setAsking(true)
    let aiContent = ''
    setMessages(prev => [...prev, { role: 'ai', content: '' }])
    try {
      await askPDF(indexResult.index_id, q, {
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
    <Layout style={{ height: '100%', background: 'var(--ai-surface-2)' }}>
      <Content style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <FilePdfOutlined style={{ fontSize: 28, color: '#f5222d' }} />
          <Title level={3} style={{ margin: 0 }}>Chat with PDF</Title>
        </Space>

        {!indexResult && (
          <Card style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {indexing ? (
              <div style={{ textAlign: 'center' }}>
                <Spin size="large" tip="正在建立向量索引..." />
              </div>
            ) : (
              <Dragger
                accept=".pdf"
                fileList={fileList}
                beforeUpload={(file) => {
                  setFileList([file as unknown as UploadFile])
                  handleIndex(file)
                  return false
                }}
                maxCount={1}
                style={{ width: 500 }}
              >
                <p className="ant-upload-drag-icon"><FilePdfOutlined style={{ fontSize: 48, color: '#f5222d' }} /></p>
                <p className="ant-upload-text">点击或拖拽上传 PDF 文件</p>
                <p className="ant-upload-hint">支持任意 PDF，AI 将自动建立向量索引并支持 RAG 问答</p>
              </Dragger>
            )}
          </Card>
        )}

        {indexResult && (
          <>
            <Card size="small" style={{ marginBottom: 12 }}>
              <Space>
                <Tag color="red">PDF</Tag>
                <Text>{fileList[0]?.name}</Text>
                <Tag>{indexResult.page_count} 页</Tag>
                <Tag>{indexResult.chunk_count} 片段</Tag>
                <Button size="small" onClick={() => { setIndexResult(null); setFileList([]); setMessages([]) }}>
                  换文件
                </Button>
              </Space>
            </Card>
            <Card style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div ref={chatRef} style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
                    <FilePdfOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                    <div>PDF 已索引，开始提问吧！</div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                    <div style={{
                      maxWidth: '75%', padding: '10px 14px', borderRadius: 16,
                      background: msg.role === 'user' ? '#f5222d' : '#fff',
                      color: msg.role === 'user' ? '#fff' : '#333',
                      border: msg.role === 'ai' ? '1px solid #ffa39e' : 'none',
                      lineHeight: 1.7,
                    }}>
                      {msg.content || (asking && i === messages.length - 1 ? '...' : '')}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                <Space.Compact style={{ width: '100%' }}>
                  <Input placeholder="对 PDF 内容提问..." value={input} onChange={e => setInput(e.target.value)} onPressEnter={handleAsk} disabled={asking} />
                  <Button type="primary" icon={<SendOutlined />} onClick={handleAsk} loading={asking} style={{ background: '#f5222d', borderColor: '#f5222d' }}>
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
