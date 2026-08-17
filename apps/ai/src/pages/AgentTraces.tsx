import { useCallback, useEffect, useState } from 'react'
import { Layout, Typography, Card, Table, Select, Button, Tag, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { listTraces, type TraceItem, type TraceStep } from '../service/langgraph'

const { Content } = Layout
const { Title, Text } = Typography

const GRAPH_FILTER_OPTIONS = [
  { value: undefined, label: '全部图' },
  { value: 'router', label: 'router' },
  { value: 'loop', label: 'loop' },
  { value: 'parallel', label: 'parallel' },
  { value: 'hitl', label: 'hitl' },
]

const STATUS_FILTER_OPTIONS = [
  { value: undefined, label: '全部状态' },
  { value: 'success', label: 'success' },
  { value: 'error', label: 'error' },
]

function parseSteps(raw: string | null): TraceStep[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function AgentTraces() {
  const [graph, setGraph] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [traces, setTraces] = useState<TraceItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { traces: list } = await listTraces(graph, status, 100)
      setTraces(list)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [graph, status])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Layout style={{ height: '100%', minHeight: 400, background: 'transparent', overflow: 'hidden' }}>
      <Content style={{ overflow: 'auto', padding: 24, background: 'transparent', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
            可观测性 · 执行记录
          </Title>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              style={{ width: 140 }}
              value={graph}
              onChange={setGraph}
              options={GRAPH_FILTER_OPTIONS}
              placeholder="按图筛选"
            />
            <Select
              style={{ width: 140 }}
              value={status}
              onChange={setStatus}
              options={STATUS_FILTER_OPTIONS}
              placeholder="按状态筛选"
            />
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              刷新
            </Button>
          </div>
        </div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          全量图执行记录（不限成败），一次图运行对应一条；展开一行可以看每个节点的耗时，排查慢在哪一步。
          只想看失败/差评的记录去 Bad Case 页。
        </Text>

        <Card size="small">
          <Table<TraceItem>
            dataSource={traces}
            rowKey="id"
            loading={loading}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 15 }}
            expandable={{
              expandedRowRender: (record) => {
                const steps = parseSteps(record.steps_detail)
                if (steps.length === 0) {
                  return <Text type="secondary">无步骤明细</Text>
                }
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {steps.map((s, i) => (
                      <Tag key={i} color={s.duration_ms > 1000 ? 'orange' : 'default'}>
                        {s.nodeId}: {s.duration_ms}ms
                      </Tag>
                    ))}
                  </div>
                )
              },
              rowExpandable: (record) => parseSteps(record.steps_detail).length > 0,
            }}
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
              { title: 'Graph', dataIndex: 'graph_name', key: 'graph_name', width: 90 },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 90,
                render: (s: string) => <Tag color={s === 'error' ? 'red' : 'green'}>{s}</Tag>,
              },
              {
                title: '耗时',
                dataIndex: 'duration_ms',
                key: 'duration_ms',
                width: 90,
                sorter: (a, b) => (a.duration_ms ?? 0) - (b.duration_ms ?? 0),
                render: (ms: number | null) => (ms != null ? `${ms}ms` : '-'),
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
