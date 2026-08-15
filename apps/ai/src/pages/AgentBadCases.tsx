import { useCallback, useEffect, useState } from 'react'
import { Layout, Typography, Card, Table, Select, Button, Tag, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { listBadCases, type BadCase } from '../service/langgraph'

const { Content } = Layout
const { Title, Text } = Typography

const GRAPH_FILTER_OPTIONS = [
  { value: undefined, label: '全部图' },
  { value: 'router', label: 'router' },
  { value: 'loop', label: 'loop' },
  { value: 'parallel', label: 'parallel' },
  { value: 'hitl', label: 'hitl' },
]

export default function AgentBadCases() {
  const [graph, setGraph] = useState<string | undefined>(undefined)
  const [cases, setCases] = useState<BadCase[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { cases: list } = await listBadCases(graph, 100)
      setCases(list)
    } catch (e) {
      message.error((e as Error).message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [graph])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Layout style={{ height: '100%', minHeight: 400, background: 'transparent', overflow: 'hidden' }}>
      <Content style={{ overflow: 'auto', padding: 24, background: 'transparent', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
            Bad Case 复核
          </Title>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              style={{ width: 140 }}
              value={graph}
              onChange={setGraph}
              options={GRAPH_FILTER_OPTIONS}
              placeholder="按图筛选"
            />
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              刷新
            </Button>
          </div>
        </div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          回流机制的挖掘入口：status=error（系统自己判定失败）或 feedback=bad（人工/用户标注不满意）任一命中即算 bad
          case，供后续回流进知识库/prompt/训练集。
        </Text>

        <Card size="small">
          <Table<BadCase>
            dataSource={cases}
            rowKey="id"
            loading={loading}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
              { title: 'Graph', dataIndex: 'graph_name', key: 'graph_name', width: 90 },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 90,
                render: (s: string) => <Tag color={s === 'error' ? 'red' : 'default'}>{s}</Tag>,
              },
              {
                title: '反馈',
                dataIndex: 'feedback',
                key: 'feedback',
                width: 90,
                render: (f: string | null) =>
                  f ? <Tag color={f === 'bad' ? 'volcano' : 'green'}>{f}</Tag> : <Text type="secondary">-</Text>,
              },
              { title: '输入', dataIndex: 'input_summary', key: 'input_summary', ellipsis: true },
              { title: '输出', dataIndex: 'output_summary', key: 'output_summary', ellipsis: true },
              {
                title: '错误信息',
                dataIndex: 'error_message',
                key: 'error_message',
                ellipsis: true,
                render: (e: string | null) => e || <Text type="secondary">-</Text>,
              },
              {
                title: '反馈备注',
                dataIndex: 'feedback_note',
                key: 'feedback_note',
                ellipsis: true,
                render: (n: string | null) => n || <Text type="secondary">-</Text>,
              },
              {
                title: '时间',
                dataIndex: 'created_at',
                key: 'created_at',
                width: 170,
                render: (t: string | null) => (t ? new Date(t).toLocaleString() : '-'),
              },
            ]}
          />
        </Card>
      </Content>
    </Layout>
  )
}
