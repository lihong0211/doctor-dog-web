import { useState, useRef } from 'react'
import { Layout, Typography, Card, Input, Button, Select, Space, message, Spin } from 'antd'
import { RocketOutlined, SendOutlined } from '@ant-design/icons'
import { analyzeStartup } from '../service/startup-trend'

const { Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const INDUSTRIES = ['AI/人工智能', '金融科技', '医疗健康', '教育科技', '电商零售', '企业服务', '游戏娱乐', '新能源', '农业科技', '房产科技', '其他']

export default function StartupTrend() {
  const [idea, setIdea] = useState('')
  const [industry, setIndustry] = useState('')
  const [targetMarket, setTargetMarket] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)

  const handleAnalyze = async () => {
    if (!idea.trim()) return message.warning('请输入创业想法')
    setLoading(true)
    setResult('')
    try {
      await analyzeStartup({ idea: idea.trim(), industry, target_market: targetMarket }, {
        onChunk: (c) => {
          setResult(prev => prev + (c.response || ''))
          resultRef.current?.scrollTo({ top: resultRef.current.scrollHeight, behavior: 'smooth' })
        },
      })
    } catch {
      message.error('分析失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ height: '100%', background: '#f0f5ff' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <RocketOutlined style={{ fontSize: 28, color: '#2f54eb' }} />
          <Title level={3} style={{ margin: 0 }}>AI 创业趋势分析</Title>
        </Space>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, height: 'calc(100% - 60px)' }}>
          <Card style={{ height: 'fit-content' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <div>
                <Text strong>创业想法 *</Text>
                <TextArea
                  placeholder="描述你的创业想法，越详细越好..."
                  value={idea}
                  onChange={e => setIdea(e.target.value)}
                  rows={5}
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <Text strong>所属行业</Text>
                <Select value={industry} onChange={setIndustry} style={{ width: '100%', marginTop: 4 }} placeholder="选择行业（可选）" allowClear>
                  {INDUSTRIES.map(i => <Select.Option key={i} value={i}>{i}</Select.Option>)}
                </Select>
              </div>
              <div>
                <Text strong>目标市场（可选）</Text>
                <Input placeholder="例如：中国一线城市25-35岁白领..." value={targetMarket} onChange={e => setTargetMarket(e.target.value)} style={{ marginTop: 4 }} />
              </div>
              <Button type="primary" size="large" block icon={<SendOutlined />} onClick={handleAnalyze} loading={loading} style={{ background: '#2f54eb', borderColor: '#2f54eb' }}>
                开始分析
              </Button>
            </Space>
          </Card>
          <Card style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {!result && !loading && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa' }}>
                <RocketOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                <div style={{ fontSize: 16 }}>输入创业想法，AI 给出专业分析报告</div>
              </div>
            )}
            {loading && !result && <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin size="large" tip="AI 正在分析市场趋势..." /></div>}
            {result && (
              <div ref={resultRef} style={{ overflow: 'auto', height: '100%' }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', lineHeight: 1.8, fontSize: 14 }}>{result}</pre>
                {loading && <Spin size="small" />}
              </div>
            )}
          </Card>
        </div>
      </Content>
    </Layout>
  )
}
