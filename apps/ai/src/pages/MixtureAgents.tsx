import { useState, useEffect } from 'react'
import { Layout, Typography, Input, Button, Card, Checkbox, Space, Spin, Tag, message } from 'antd'
import { TeamOutlined, SendOutlined } from '@ant-design/icons'
import { getAvailableModels, mixtureChat } from '../service/mixture-agents'

const { Content } = Layout
const { Title, Text, Paragraph } = Typography

interface ModelAnswer { model: string; answer: string }

export default function MixtureAgents() {
  const [models, setModels] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [modelAnswers, setModelAnswers] = useState<ModelAnswer[]>([])
  const [aggregate, setAggregate] = useState('')
  const [loadingModels, setLoadingModels] = useState(true)

  useEffect(() => {
    getAvailableModels()
      .then(list => {
        setModels(list)
        setSelectedModels(list.slice(0, 2))
      })
      .catch(() => message.error('无法获取模型列表，请确认 Ollama 已启动'))
      .finally(() => setLoadingModels(false))
  }, [])

  const handleSend = async () => {
    if (!question.trim()) return message.warning('请输入问题')
    if (selectedModels.length === 0) return message.warning('请至少选择一个模型')
    setStreaming(true)
    setModelAnswers([])
    setAggregate('')

    try {
      await mixtureChat(question.trim(), selectedModels, {
        onChunk: (chunk) => {
          if (chunk.type === 'models') {
            setModelAnswers(chunk.data)
          } else if (chunk.type === 'aggregate') {
            setAggregate(prev => prev + chunk.response)
          }
        },
        onError: (e) => message.error(e instanceof Error ? e.message : String(e)),
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <Layout style={{ height: '100%', background: 'var(--ai-canvas)' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <TeamOutlined style={{ fontSize: 24, color: 'var(--ai-primary)' }} />
          <Title level={4} style={{ margin: 0 }}>Mixture of Agents</Title>
        </Space>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <Text strong>选择模型：</Text>
            {loadingModels ? (
              <Spin size="small" style={{ marginLeft: 8 }} />
            ) : (
              <Checkbox.Group
                options={models}
                value={selectedModels}
                onChange={vals => setSelectedModels(vals as string[])}
                style={{ marginLeft: 8 }}
              />
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="输入问题，例如：用一句话解释什么是 RAG"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onPressEnter={handleSend}
              disabled={streaming}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={streaming}
              disabled={selectedModels.length === 0}
            >
              发送
            </Button>
          </div>
        </Card>

        {/* 各模型回答卡片 */}
        {(modelAnswers.length > 0 || streaming) && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>各模型回答：</Text>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {selectedModels.map(model => {
                const found = modelAnswers.find(a => a.model === model)
                return (
                  <Card
                    key={model}
                    size="small"
                    title={<Tag color="blue" style={{ fontSize: 12 }}>{model}</Tag>}
                    style={{ minHeight: 100 }}
                  >
                    {found ? (
                      <Paragraph style={{ margin: 0, fontSize: 13 }}>{found.answer}</Paragraph>
                    ) : (
                      <Spin size="small" />
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* 聚合结果 */}
        {(aggregate || (streaming && modelAnswers.length > 0)) && (
          <Card
            title={<span><Tag color="gold">🤖 聚合最优答案</Tag></span>}
            style={{ borderColor: '#faad14', background: '#fffbf0' }}
          >
            <Paragraph style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>
              {aggregate || <Spin size="small" />}
            </Paragraph>
          </Card>
        )}
      </Content>
    </Layout>
  )
}
