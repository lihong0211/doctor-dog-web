import { useState } from 'react'
import { Layout, Typography, Card, Input, InputNumber, Switch, Button, Tag, Steps, message, Space } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import { runSagaDemo, type SagaResult } from '../service/langgraph'

const { Content } = Layout
const { Title, Text, Paragraph } = Typography

const ALL_STEPS = ['create_booking', 'charge_payment']

export default function AgentSagaDemo() {
  const [item, setItem] = useState('演示预订')
  const [amount, setAmount] = useState(9900)
  const [failPayment, setFailPayment] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SagaResult | null>(null)

  const run = async () => {
    if (!item.trim()) {
      message.warning('请输入预订项目')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const data = await runSagaDemo(item.trim(), amount, failPayment)
      setResult(data)
    } catch (e) {
      message.error((e as Error).message || '执行失败')
    } finally {
      setLoading(false)
    }
  }

  const stepsItems = result
    ? ALL_STEPS.map((name) => {
        const isCompleted = result.completed.includes(name)
        const isCompensated = result.compensated.includes(name)
        let status: 'wait' | 'finish' | 'error' = 'wait'
        let subTitle = '未执行'
        if (isCompensated) {
          status = 'error'
          subTitle = '已回滚'
        } else if (isCompleted) {
          status = 'finish'
          subTitle = '已提交'
        } else if (result.status === 'rolled_back' && name === result.completed[result.completed.length - 1]) {
          subTitle = '未执行'
        } else if (!isCompleted && result.error && name !== ALL_STEPS[0]) {
          status = 'error'
          subTitle = '执行失败'
        }
        return { title: name, status, description: subTitle }
      })
    : []

  return (
    <Layout style={{ height: '100%', minHeight: 400, background: 'transparent', overflow: 'hidden' }}>
      <Content style={{ overflow: 'auto', padding: 24, background: 'transparent', width: '100%', maxWidth: 760 }}>
        <Title level={5} style={{ margin: 0, marginBottom: 8, color: 'var(--ds-text)', fontWeight: 600 }}>
          副作用回滚演示（Saga 补偿事务）
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          两步 Saga：<Text code>create_booking</Text> 真实写入一行 MySQL 记录，
          <Text code>charge_payment</Text> 可配置故意失败。失败时编排器会按逆序把已完成步骤的 undo
          调一遍——真实删掉刚才写入的那一行，不是纸面上的接口设计。
        </Paragraph>

        <Card size="small" title="发起一次 Saga" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <div>
              <Text style={{ display: 'block', marginBottom: 4 }}>预订项目</Text>
              <Input value={item} onChange={(e) => setItem(e.target.value)} placeholder="例如：演示预订" />
            </div>
            <div>
              <Text style={{ display: 'block', marginBottom: 4 }}>金额（分）</Text>
              <InputNumber value={amount} onChange={(v) => setAmount(v ?? 0)} min={0} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Switch checked={failPayment} onChange={setFailPayment} />
              <Text>
                故意让 charge_payment 失败{failPayment ? '（会触发回滚）' : '（两步都会提交，booking 行会保留）'}
              </Text>
            </div>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={run} loading={loading}>
              执行
            </Button>
          </Space>
        </Card>

        {result && (
          <Card
            size="small"
            title={
              result.status === 'committed' ? (
                <Tag color="green">committed</Tag>
              ) : (
                <Tag color="orange">rolled_back</Tag>
              )
            }
          >
            <Steps size="small" direction="vertical" items={stepsItems} style={{ marginBottom: 16 }} />
            {result.error && (
              <Paragraph style={{ marginBottom: 8 }}>
                <Text type="danger">失败原因：{result.error}</Text>
              </Paragraph>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              threadId: {result.threadId}
            </Text>
          </Card>
        )}
      </Content>
    </Layout>
  )
}
