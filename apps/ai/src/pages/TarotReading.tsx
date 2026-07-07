import { useState } from 'react'
import { Layout, Typography, Card, Input, Button, Select, Space, message, Spin, Tag } from 'antd'
import { StarOutlined } from '@ant-design/icons'
import { tarotRead, type TarotCard } from '../service/tarot'

const { Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const SPREAD_TYPES = [
  { value: 'single', label: '单张牌（快速答案）' },
  { value: 'three', label: '三张牌（过去·现在·未来）' },
  { value: 'celtic', label: '五张牌（深度解读）' },
]

export default function TarotReading() {
  const [question, setQuestion] = useState('')
  const [spreadType, setSpreadType] = useState('three')
  const [loading, setLoading] = useState(false)
  const [cards, setCards] = useState<TarotCard[]>([])
  const [reading, setReading] = useState('')

  const handleRead = async () => {
    if (!question.trim()) return message.warning('请输入你的问题')
    setLoading(true)
    setCards([])
    setReading('')
    try {
      await tarotRead(question.trim(), spreadType, {
        onCards: (c) => setCards(c),
        onChunk: (t) => setReading(prev => prev + t),
      })
    } catch {
      message.error('解读失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ height: '100%', background: '#1a1a2e' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <StarOutlined style={{ fontSize: 28, color: '#ffd700' }} />
          <Title level={3} style={{ margin: 0, color: '#ffd700' }}>塔罗牌解读</Title>
        </Space>

        <Card style={{ marginBottom: 16, background: '#16213e', border: '1px solid #533483' }}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <TextArea
              placeholder="输入你想解读的问题（如：我的事业发展如何？）"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={3}
              style={{ background: '#0f3460', borderColor: '#533483', color: '#e0e0e0' }}
            />
            <Select value={spreadType} onChange={setSpreadType} style={{ width: '100%' }}>
              {SPREAD_TYPES.map(s => <Select.Option key={s.value} value={s.value}>{s.label}</Select.Option>)}
            </Select>
            <Button
              type="primary"
              size="large"
              block
              icon={<StarOutlined />}
              onClick={handleRead}
              loading={loading}
              style={{ background: 'linear-gradient(135deg, #533483, #e94560)', borderColor: '#533483', color: '#ffd700', fontWeight: 'bold' }}
            >
              抽牌解读
            </Button>
          </Space>
        </Card>

        {loading && !cards.length && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" tip={<span style={{ color: '#ffd700' }}>命运之轮正在转动...</span>} />
          </div>
        )}

        {cards.length > 0 && (
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {cards.map((card, i) => (
              <Card key={i} style={{ width: 160, background: '#16213e', border: '1px solid #ffd700', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 4 }}>🃏</div>
                <Text style={{ color: '#ffd700', fontSize: 12, fontWeight: 'bold', display: 'block' }}>{card.position}</Text>
                <Text style={{ color: '#e0e0e0', fontSize: 12, display: 'block', marginTop: 4 }}>{card.name}</Text>
                {card.reversed && <Tag color="orange" style={{ marginTop: 4, fontSize: 10 }}>逆位</Tag>}
              </Card>
            ))}
          </div>
        )}

        {reading && (
          <Card style={{ background: '#16213e', border: '1px solid #533483' }}>
            <Title level={5} style={{ color: '#ffd700' }}>✨ 塔罗解读</Title>
            <div style={{ color: '#e0e0e0', lineHeight: 1.9, fontSize: 14 }}>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', margin: 0, color: '#e0e0e0' }}>
                {reading}
              </pre>
              {loading && <Spin size="small" style={{ marginLeft: 8 }} />}
            </div>
          </Card>
        )}
      </Content>
    </Layout>
  )
}
