import { useState, useRef } from 'react'
import { Layout, Typography, Card, Input, Button, Select, InputNumber, Space, message, Spin } from 'antd'
import { DollarOutlined, SendOutlined } from '@ant-design/icons'
import { generateFinancePlan } from '../service/finance-coach'

const { Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const RISK_LEVELS = ['保守型（低风险）', '稳健型（中低风险）', '平衡型（中风险）', '成长型（中高风险）', '激进型（高风险）']

export default function FinanceCoach() {
  const [income, setIncome] = useState<number>(10000)
  const [expenses, setExpenses] = useState<number>(7000)
  const [savingsGoal, setSavingsGoal] = useState<number>(100000)
  const [debt, setDebt] = useState<number>(0)
  const [risk, setRisk] = useState('稳健型（中低风险）')
  const [goals, setGoals] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)

  const handlePlan = async () => {
    if (!goals.trim()) return message.warning('请输入财务目标')
    setLoading(true)
    setResult('')
    try {
      await generateFinancePlan(
        { monthly_income: income, monthly_expenses: expenses, savings_goal: savingsGoal, debt, investment_risk: risk, financial_goals: goals },
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

  const monthlySavings = income - expenses
  const savingsRate = income > 0 ? ((monthlySavings / income) * 100).toFixed(1) : '0'

  return (
    <Layout style={{ height: '100%', background: '#fffbe6' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <DollarOutlined style={{ fontSize: 28, color: '#faad14' }} />
          <Title level={3} style={{ margin: 0 }}>AI 财务教练</Title>
        </Space>
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, height: 'calc(100% - 60px)' }}>
          <Card style={{ height: 'fit-content' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <div>
                <Text strong>月收入（元）</Text>
                <InputNumber min={0} value={income} onChange={v => setIncome(v || 0)} style={{ width: '100%', marginTop: 4 }} formatter={v => `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </div>
              <div>
                <Text strong>月支出（元）</Text>
                <InputNumber min={0} value={expenses} onChange={v => setExpenses(v || 0)} style={{ width: '100%', marginTop: 4 }} formatter={v => `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </div>
              <div style={{ padding: '8px 12px', background: monthlySavings >= 0 ? '#f6ffed' : '#fff2f0', borderRadius: 8, border: `1px solid ${monthlySavings >= 0 ? '#b7eb8f' : '#ffa39e'}` }}>
                <Text>每月可储蓄：<strong style={{ color: monthlySavings >= 0 ? '#52c41a' : '#f5222d' }}>¥{monthlySavings.toLocaleString()}</strong> <span style={{ color: '#aaa' }}>（储蓄率 {savingsRate}%）</span></Text>
              </div>
              <div>
                <Text strong>储蓄目标（元）</Text>
                <InputNumber min={0} value={savingsGoal} onChange={v => setSavingsGoal(v || 0)} style={{ width: '100%', marginTop: 4 }} formatter={v => `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </div>
              <div>
                <Text strong>当前负债（元）</Text>
                <InputNumber min={0} value={debt} onChange={v => setDebt(v || 0)} style={{ width: '100%', marginTop: 4 }} formatter={v => `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </div>
              <div>
                <Text strong>投资风险偏好</Text>
                <Select value={risk} onChange={setRisk} style={{ width: '100%', marginTop: 4 }}>
                  {RISK_LEVELS.map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}
                </Select>
              </div>
              <div>
                <Text strong>财务目标 *</Text>
                <TextArea placeholder="例如：3年内买车，5年内买房，10年实现财务自由..." value={goals} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGoals(e.target.value)} rows={3} style={{ marginTop: 4 }} />
              </div>
              <Button type="primary" size="large" block icon={<SendOutlined />} onClick={handlePlan} loading={loading} style={{ background: '#faad14', borderColor: '#faad14' }}>
                生成财务规划
              </Button>
            </Space>
          </Card>
          <Card style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {!result && !loading && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa' }}>
                <DollarOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                <div style={{ fontSize: 16 }}>填写财务信息，AI 生成个性化理财规划</div>
              </div>
            )}
            {loading && !result && <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin size="large" tip="AI 正在分析财务状况..." /></div>}
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
