import { useState, useRef, useEffect } from 'react'
import { Layout, Typography, Input, Button, Card, Space, Tag, message, Spin, Divider } from 'antd'
import { GithubOutlined, SendOutlined, LoadingOutlined } from '@ant-design/icons'
import { indexRepo, askGithub, type IndexResult } from '../service/github-chat'

const { Content } = Layout
const { Title, Text } = Typography

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function GitHubChat() {
  const [repoUrl, setRepoUrl] = useState('')
  const [token, setToken] = useState('')
  const [indexing, setIndexing] = useState(false)
  const [indexResult, setIndexResult] = useState<IndexResult | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleIndex = async () => {
    if (!repoUrl.trim()) return message.warning('请输入 GitHub 仓库 URL')
    setIndexing(true)
    setIndexResult(null)
    setMessages([])
    try {
      const result = await indexRepo(repoUrl.trim(), token.trim() || undefined)
      setIndexResult(result)
      message.success(`索引完成：${result.file_count} 个文件，${result.chunk_count} 个片段`)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '索引失败')
    } finally {
      setIndexing(false)
    }
  }

  const handleSend = async () => {
    if (!indexResult) return message.warning('请先对仓库进行索引')
    if (!inputText.trim()) return message.warning('请输入问题')
    if (streaming) return

    const question = inputText.trim()
    setInputText('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setStreaming(true)

    let assistantContent = ''
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    await askGithub(indexResult.index_id, question, {
      onChunk: (chunk) => {
        if (chunk.response) {
          assistantContent += chunk.response
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
            return updated
          })
        }
        if (chunk.done) {
          setStreaming(false)
        }
      },
      onError: (err) => {
        message.error(err.message)
        setStreaming(false)
      },
    })
  }

  return (
    <Layout style={{ height: '100%', background: '#f5f7fa' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <GithubOutlined style={{ fontSize: 24, color: 'var(--ai-primary)' }} />
          <Title level={4} style={{ margin: 0 }}>Chat with GitHub</Title>
        </Space>

        {/* 索引区 */}
        <Card title="索引仓库" style={{ marginBottom: 16, flexShrink: 0 }}>
          <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
            <Input
              placeholder="GitHub 仓库 URL，例如：https://github.com/anthropics/anthropic-quickstarts"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onPressEnter={handleIndex}
              disabled={indexing}
              prefix={<GithubOutlined />}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              onClick={handleIndex}
              loading={indexing}
              disabled={!repoUrl.trim()}
              style={{ minWidth: 90 }}
            >
              {indexing ? '索引中' : 'Index'}
            </Button>
          </Space.Compact>
          <Input
            placeholder="GitHub Token（可选，用于访问私有仓库）"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            type="password"
            disabled={indexing}
          />

          {indexing && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Spin indicator={<LoadingOutlined />} tip="正在下载代码并向量化，请稍候..." />
            </div>
          )}

          {indexResult && (
            <div style={{ marginTop: 12 }}>
              <Space wrap>
                <Tag color="green">✓ 索引完成</Tag>
                <Tag color="blue">{indexResult.owner}/{indexResult.repo}</Tag>
                <Tag color="purple">{indexResult.file_count} 个文件</Tag>
                <Tag color="orange">{indexResult.chunk_count} 个片段</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>index_id: {indexResult.index_id}</Text>
              </Space>
            </div>
          )}
        </Card>

        {/* 聊天区 */}
        {indexResult && (
          <Card
            title="对话"
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '12px 16px' }}
          >
            {/* 消息列表 */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>
                  <GithubOutlined style={{ fontSize: 40, marginBottom: 8, display: 'block' }} />
                  <Text type="secondary">对仓库 {indexResult.owner}/{indexResult.repo} 提问</Text>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '8px 14px',
                      borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      background: msg.role === 'user' ? 'var(--ai-primary)' : '#fff',
                      color: msg.role === 'user' ? '#fff' : '#000',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    {msg.content || (streaming && i === messages.length - 1 ? <LoadingOutlined /> : '')}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* 输入框 */}
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="输入问题，例如：What is this repository about?"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                disabled={streaming}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={streaming}
                disabled={!inputText.trim()}
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
