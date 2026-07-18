import { useState, useEffect } from 'react'
import { Layout, Typography, Card, Tag, Button, Spin, Space, message } from 'antd'
import { GlobalOutlined, ReloadOutlined } from '@ant-design/icons'
import { fetchNewsArticles, getNewsSummary, type NewsArticle, type NewsSummary } from '../service/news-agent'

const { Content } = Layout
const { Title, Text, Paragraph } = Typography

export default function NewsAgent() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [summary, setSummary] = useState<NewsSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [arts, sum] = await Promise.all([fetchNewsArticles(), getNewsSummary()])
      setArticles(arts)
      setSummary(sum)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const sourceColors: Record<string, string> = {
    'Hacker News': 'orange',
    'MIT Tech Review': 'blue',
    'The Verge': 'purple',
    'VentureBeat AI': 'green',
    '36kr AI': 'red',
  }

  return (
    <Layout style={{ height: '100%', background: '#f5f7fa' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <GlobalOutlined style={{ fontSize: 24, color: 'var(--ai-primary)' }} />
          <Title level={4} style={{ margin: 0 }}>AI 新闻摘要</Title>
        </Space>

        {/* 今日要闻总结 */}
        <Card
          style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--ai-primary) 0%, #0958d9 100%)', border: 'none' }}
          bodyStyle={{ padding: '16px 20px' }}
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={load}
              loading={loading}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
              size="small"
            >
              刷新
            </Button>
          }
          title={<Text style={{ color: '#fff', fontWeight: 600 }}>📰 今日 AI 要闻</Text>}
        >
          {loading && !summary ? (
            <Spin style={{ color: '#fff' }} />
          ) : summary ? (
            <>
              <Paragraph style={{ color: '#e8f4ff', margin: 0, lineHeight: 1.7 }}>{summary.summary}</Paragraph>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 8, display: 'block' }}>
                共 {summary.article_count} 篇文章 · {summary.generated_at ? new Date(summary.generated_at).toLocaleString() : ''}
              </Text>
            </>
          ) : (
            <Text style={{ color: '#fff' }}>暂无摘要</Text>
          )}
        </Card>

        {/* 新闻卡片网格 */}
        {loading && articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" tip="正在抓取最新新闻..." />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {articles.map((a, i) => (
              <Card key={i} size="small" hoverable style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 6 }}>
                  <Tag color={sourceColors[a.source] || 'default'} style={{ fontSize: 11 }}>{a.source}</Tag>
                  {a.published_at && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(a.published_at).toLocaleDateString()}
                    </Text>
                  )}
                </div>
                <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4, display: 'block', marginBottom: 6, color: 'var(--ai-primary)' }}>
                  {a.title}
                </a>
                {a.summary && <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>{a.summary}</Text>}
              </Card>
            ))}
          </div>
        )}
      </Content>
    </Layout>
  )
}
