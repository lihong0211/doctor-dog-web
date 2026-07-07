import { useState, useRef } from 'react'
import { Layout, Typography, Card, Input, Button, Select, InputNumber, Space, message, Spin } from 'antd'
import { HeartOutlined, SendOutlined } from '@ant-design/icons'
import { generateHealthPlan } from '../service/health-agent'

const { Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const GOALS = ['减脂塑形', '增肌力量', '提高耐力', '保持健康', '康复训练', '运动入门']
const ACTIVITY_LEVELS = ['久坐不动（几乎不运动）', '轻度活动（每周1-3次）', '中度活动（每周3-5次）', '高度活动（每天运动）', '专业运动员']

export default function HealthFitnessAdvisor() {
  const [age, setAge] = useState(25)
  const [weight, setWeight] = useState(65)
  const [height, setHeight] = useState(170)
  const [goal, setGoal] = useState('保持健康')
  const [activityLevel, setActivityLevel] = useState('轻度活动（每周1-3次）')
  const [healthIssues, setHealthIssues] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)

  const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1)

  const handlePlan = async () => {
    setLoading(true)
    setResult('')
    try {
      await generateHealthPlan(
        { age, weight, height, goal, activity_level: activityLevel, health_issues: healthIssues },
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
    <Layout style={{ height: '100%', background: '#f0fff4' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <HeartOutlined style={{ fontSize: 28, color: '#52c41a' }} />
          <Title level={3} style={{ margin: 0 }}>AI 健康健身顾问</Title>
        </Space>
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, height: 'calc(100% - 60px)' }}>
          <Card style={{ height: 'fit-content' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <Text strong>年龄</Text>
                  <InputNumber min={10} max={100} value={age} onChange={v => setAge(v || 25)} style={{ width: '100%', marginTop: 4 }} addonAfter="岁" />
                </div>
                <div>
                  <Text strong>体重 (kg)</Text>
                  <InputNumber min={30} max={300} value={weight} onChange={v => setWeight(v || 65)} style={{ width: '100%', marginTop: 4 }} step={0.5} />
                </div>
                <div>
                  <Text strong>身高 (cm)</Text>
                  <InputNumber min={100} max={250} value={height} onChange={v => setHeight(v || 170)} style={{ width: '100%', marginTop: 4 }} />
                </div>
              </div>
              <div style={{ padding: '8px 12px', background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                <Text>BMI：<strong>{bmi}</strong>
                  <span style={{ marginLeft: 8, color: Number(bmi) < 18.5 ? '#fa8c16' : Number(bmi) < 24 ? '#52c41a' : Number(bmi) < 28 ? '#faad14' : '#f5222d' }}>
                    {Number(bmi) < 18.5 ? '偏轻' : Number(bmi) < 24 ? '正常' : Number(bmi) < 28 ? '超重' : '肥胖'}
                  </span>
                </Text>
              </div>
              <div>
                <Text strong>健身目标</Text>
                <Select value={goal} onChange={setGoal} style={{ width: '100%', marginTop: 4 }}>
                  {GOALS.map(g => <Select.Option key={g} value={g}>{g}</Select.Option>)}
                </Select>
              </div>
              <div>
                <Text strong>活动水平</Text>
                <Select value={activityLevel} onChange={setActivityLevel} style={{ width: '100%', marginTop: 4 }}>
                  {ACTIVITY_LEVELS.map(a => <Select.Option key={a} value={a}>{a}</Select.Option>)}
                </Select>
              </div>
              <div>
                <Text strong>健康状况/限制（可选）</Text>
                <TextArea placeholder="如：膝盖受伤、高血压、糖尿病..." value={healthIssues} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHealthIssues(e.target.value)} rows={2} style={{ marginTop: 4 }} />
              </div>
              <Button type="primary" size="large" block icon={<SendOutlined />}
                onClick={handlePlan} loading={loading} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                生成健身计划
              </Button>
            </Space>
          </Card>
          <Card style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {!result && !loading && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa' }}>
                <HeartOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                <div style={{ fontSize: 16 }}>填写身体数据，AI 生成个性化健身方案</div>
              </div>
            )}
            {loading && !result && <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin size="large" tip="AI 正在制定健身计划..." /></div>}
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
