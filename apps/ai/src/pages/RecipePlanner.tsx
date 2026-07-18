import { useState, useRef } from 'react'
import { Layout, Typography, Card, Input, Button, Select, InputNumber, Space, message, Spin } from 'antd'
import { ForkOutlined, SendOutlined } from '@ant-design/icons'
import { planRecipe } from '../service/recipe-agent'

const { Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const DIETARY_OPTIONS = ['普通', '素食', '纯素', '低碳/生酮', '无麸质', '清真', '无乳糖']
const CUISINE_OPTIONS = ['家常菜', '川菜', '粤菜', '日料', '意大利', '泰国菜', '地中海', '墨西哥']
const MEAL_TYPES = ['早餐', '午餐', '晚餐', '下午茶', '夜宵']

export default function RecipePlanner() {
  const [ingredients, setIngredients] = useState('')
  const [servings, setServings] = useState(2)
  const [dietary, setDietary] = useState('普通')
  const [cuisine, setCuisine] = useState('家常菜')
  const [mealType, setMealType] = useState('午餐')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)

  const handlePlan = async () => {
    if (!ingredients.trim()) return message.warning('请输入食材')
    setLoading(true)
    setResult('')
    try {
      await planRecipe(
        { ingredients: ingredients.trim(), servings, dietary, cuisine, meal_type: mealType },
        {
          onChunk: (c) => {
            setResult(prev => prev + (c.response || ''))
            resultRef.current?.scrollTo({ top: resultRef.current.scrollHeight, behavior: 'smooth' })
          },
        }
      )
    } catch {
      message.error('生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ height: '100%', background: 'var(--ai-canvas)' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <ForkOutlined style={{ fontSize: 28, color: '#fa8c16' }} />
          <Title level={3} style={{ margin: 0 }}>AI 食谱规划</Title>
        </Space>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, height: 'calc(100% - 60px)' }}>
          <Card style={{ height: 'fit-content' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <div>
                <Text strong>现有食材 *</Text>
                <TextArea
                  placeholder="例如：鸡蛋、西红柿、土豆、猪肉、大蒜..."
                  value={ingredients}
                  onChange={e => setIngredients(e.target.value)}
                  rows={4}
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <Text strong>用餐人数</Text>
                <InputNumber min={1} max={20} value={servings} onChange={v => setServings(v || 2)}
                  style={{ width: '100%', marginTop: 4 }} addonAfter="人" />
              </div>
              <div>
                <Text strong>饮食类型</Text>
                <Select value={dietary} onChange={setDietary} style={{ width: '100%', marginTop: 4 }}>
                  {DIETARY_OPTIONS.map(d => <Select.Option key={d} value={d}>{d}</Select.Option>)}
                </Select>
              </div>
              <div>
                <Text strong>菜系偏好</Text>
                <Select value={cuisine} onChange={setCuisine} style={{ width: '100%', marginTop: 4 }}>
                  {CUISINE_OPTIONS.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                </Select>
              </div>
              <div>
                <Text strong>餐次</Text>
                <Select value={mealType} onChange={setMealType} style={{ width: '100%', marginTop: 4 }}>
                  {MEAL_TYPES.map(m => <Select.Option key={m} value={m}>{m}</Select.Option>)}
                </Select>
              </div>
              <Button type="primary" size="large" block icon={<SendOutlined />}
                onClick={handlePlan} loading={loading} style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
                生成食谱
              </Button>
            </Space>
          </Card>
          <Card style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {!result && !loading && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa' }}>
                <ForkOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                <div style={{ fontSize: 16 }}>输入食材，AI 帮你设计美味食谱</div>
              </div>
            )}
            {loading && !result && <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin size="large" tip="AI 正在设计食谱..." /></div>}
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
