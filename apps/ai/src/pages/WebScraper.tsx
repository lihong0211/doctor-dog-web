import { useState } from 'react'
import { Layout, Typography, Input, Button, Card, Space, message, Spin } from 'antd'
import { SearchOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { extractWebContent, type ScrapeResult } from '../service/web-scraper'

const { Content } = Layout
const { Title, Text } = Typography

export default function WebScraper() {
  const [url, setUrl] = useState('')
  const [schemaFields, setSchemaFields] = useState<{ key: string; value: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [showSchema, setShowSchema] = useState(false)

  const handleExtract = async () => {
    if (!url.trim()) return message.warning('请输入 URL')
    setLoading(true)
    setResult(null)
    const schema = schemaFields.length > 0
      ? Object.fromEntries(schemaFields.filter(f => f.key).map(f => [f.key, f.value]))
      : undefined
    try {
      const data = await extractWebContent(url.trim(), schema)
      setResult(data)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '提取失败')
    } finally {
      setLoading(false)
    }
  }

  const addField = () => setSchemaFields(prev => [...prev, { key: '', value: '' }])
  const removeField = (i: number) => setSchemaFields(prev => prev.filter((_, idx) => idx !== i))
  const updateField = (i: number, k: 'key' | 'value', v: string) =>
    setSchemaFields(prev => prev.map((f, idx) => idx === i ? { ...f, [k]: v } : f))

  return (
    <Layout style={{ height: '100%', background: '#f5f7fa' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <SearchOutlined style={{ fontSize: 24, color: 'var(--ai-primary)' }} />
          <Title level={4} style={{ margin: 0 }}>网页智能提取</Title>
        </Space>

        <Card style={{ marginBottom: 16 }}>
          <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
            <Input
              placeholder="输入网页 URL，例如：https://www.anthropic.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onPressEnter={handleExtract}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleExtract} loading={loading}>
              提取
            </Button>
          </Space.Compact>

          {/* 自定义 Schema */}
          <div>
            <Button type="link" size="small" onClick={() => setShowSchema(!showSchema)} style={{ padding: 0 }}>
              {showSchema ? '▼' : '▶'} 自定义提取字段（可选）
            </Button>
            {showSchema && (
              <div style={{ marginTop: 8, padding: 12, background: 'var(--ai-surface-2)', borderRadius: 6 }}>
                {schemaFields.map((f, i) => (
                  <Space key={i} style={{ display: 'flex', marginBottom: 8 }}>
                    <Input
                      placeholder="字段名（如 main_product）"
                      value={f.key}
                      onChange={e => updateField(i, 'key', e.target.value)}
                      style={{ width: 180 }}
                    />
                    <Input
                      placeholder="描述（如 公司主要产品名称）"
                      value={f.value}
                      onChange={e => updateField(i, 'value', e.target.value)}
                      style={{ width: 220 }}
                    />
                    <MinusCircleOutlined onClick={() => removeField(i)} style={{ color: '#ff4d4f', cursor: 'pointer' }} />
                  </Space>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} size="small" onClick={addField}>添加字段</Button>
              </div>
            )}
          </div>
        </Card>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" tip="正在抓取并提取..." />
          </div>
        )}

        {result && (
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>标题：</Text>
                <Text>{result.title || '（无标题）'}</Text>
              </div>
              <div>
                <Text strong>字数：</Text>
                <Text>{result.word_count} 词</Text>
              </div>
              <div>
                <Text strong>提取结果：</Text>
                <pre style={{
                  background: '#1e1e1e',
                  color: '#d4d4d4',
                  padding: '12px 16px',
                  borderRadius: 6,
                  marginTop: 6,
                  fontSize: 13,
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {JSON.stringify(result.extracted, null, 2)}
                </pre>
              </div>
            </Space>
          </Card>
        )}
      </Content>
    </Layout>
  )
}
