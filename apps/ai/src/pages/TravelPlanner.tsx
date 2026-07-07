import { useState, useRef } from 'react'
import { Layout, Typography, Card, Input, Button, Select, InputNumber, Space, message, Spin } from 'antd'
import { CompassOutlined, SendOutlined } from '@ant-design/icons'
import { planTravel } from '../service/travel-agent'

const { Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const TRAVEL_STYLES = ['文化体验', '自然探索', '美食之旅', '历史古迹', '休闲度假', '冒险运动', '购物娱乐']
const BUDGETS = ['经济实惠', '适中', '高品质', '奢华']

export default function TravelPlanner() {
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState(3)
  const [budget, setBudget] = useState('适中')
  const [style, setStyle] = useState('文化体验')
  const [preferences, setPreferences] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)

  const handlePlan = async () => {
    if (!destination.trim()) return message.warning('请输入目的地')
    setLoading(true)
    setResult('')
    try {
      await planTravel(
        { destination: destination.trim(), days, budget, travel_style: style, preferences },
        {
          onChunk: (c) => {
            setResult(prev => prev + (c.response || ''))
            resultRef.current?.scrollTo({ top: resultRef.current.scrollHeight, behavior: 'smooth' })
          },
        }
      )
    } catch (e) {
      message.error('生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ height: '100%', background: '#f0f4ff' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <CompassOutlined style={{ fontSize: 28, color: '#1677ff' }} />
          <Title level={3} style={{ margin: 0 }}>AI 旅行规划</Title>
        </Space>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, height: 'calc(100% - 60px)' }}>
          {/* Left: Form */}
          <Card style={{ height: 'fit-content' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <div>
                <Text strong>目的地 *</Text>
                <Input
                  placeholder="例如：京都、巴黎、新疆"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  style={{ marginTop: 4 }}
                  size="large"
                  prefix={<CompassOutlined />}
                />
              </div>
              <div>
                <Text strong>行程天数</Text>
                <br />
                <InputNumber min={1} max={30} value={days} onChange={v => setDays(v || 3)}
                  style={{ width: '100%', marginTop: 4 }} addonAfter="天" />
              </div>
              <div>
                <Text strong>预算级别</Text>
                <Select value={budget} onChange={setBudget} style={{ width: '100%', marginTop: 4 }}>
                  {BUDGETS.map(b => <Select.Option key={b} value={b}>{b}</Select.Option>)}
                </Select>
              </div>
              <div>
                <Text strong>旅行风格</Text>
                <Select value={style} onChange={setStyle} style={{ width: '100%', marginTop: 4 }}>
                  {TRAVEL_STYLES.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
                </Select>
              </div>
              <div>
                <Text strong>特殊偏好（可选）</Text>
                <TextArea
                  placeholder="例如：带小孩出行、素食者、行动不便..."
                  value={preferences}
                  onChange={e => setPreferences(e.target.value)}
                  rows={3}
                  style={{ marginTop: 4 }}
                />
              </div>
              <Button type="primary" size="large" block icon={<SendOutlined />}
                onClick={handlePlan} loading={loading}>
                生成旅行攻略
              </Button>
            </Space>
          </Card>

          {/* Right: Result */}
          <Card style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {!result && !loading && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa' }}>
                <CompassOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                <div style={{ fontSize: 16 }}>填写左侧表单，点击生成旅行攻略</div>
              </div>
            )}
            {loading && !result && (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <Spin size="large" tip="AI 正在规划你的旅程..." />
              </div>
            )}
            {result && (
              <div ref={resultRef} style={{ overflow: 'auto', height: '100%' }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', lineHeight: 1.8, fontSize: 14 }}>
                  {result}
                </pre>
                {loading && <Spin size="small" />}
              </div>
            )}
          </Card>
        </div>
      </Content>
    </Layout>
  )
}
