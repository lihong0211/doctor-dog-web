import { useCallback, useEffect, useState } from 'react'
import { Layout, Typography, Card, Table, Select, Button, Tag, Alert, Input, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { listReviewTasks, approveReviewTask, rejectReviewTask, type ReviewTask, type ReviewStatus } from '../service/review'

const { Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const STATUS_FILTER_OPTIONS: { value: ReviewStatus | undefined; label: string }[] = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: undefined, label: '全部' },
]

const SOURCE_LABEL: Record<string, string> = {
  text2sql: 'Text2SQL',
  hitl: 'HITL 演示',
}

const STATUS_TAG: Record<ReviewStatus, { color: string; label: string }> = {
  pending: { color: 'gold', label: '待审核' },
  approved: { color: 'green', label: '已通过' },
  rejected: { color: 'default', label: '已拒绝' },
}

export default function AgentReviewList() {
  const [status, setStatus] = useState<ReviewStatus | undefined>('pending')
  const [tasks, setTasks] = useState<ReviewTask[]>([])
  const [loading, setLoading] = useState(false)
  const [actingId, setActingId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Record<number, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { tasks: list } = await listReviewTasks(status, 100)
      setTasks(list)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  const approve = async (task: ReviewTask) => {
    setActingId(task.id)
    try {
      await approveReviewTask(task.id, editing[task.id]?.trim() || undefined)
      message.success('已批准执行')
      await load()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '操作失败')
    } finally {
      setActingId(null)
    }
  }

  const reject = async (task: ReviewTask) => {
    setActingId(task.id)
    try {
      await rejectReviewTask(task.id)
      message.success('已拒绝')
      await load()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '操作失败')
    } finally {
      setActingId(null)
    }
  }

  return (
    <Layout style={{ height: '100%', minHeight: 400, background: 'transparent', overflow: 'hidden' }}>
      <Content style={{ overflow: 'auto', padding: 24, background: 'transparent', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
            人工审核列表
          </Title>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              style={{ width: 140 }}
              value={status}
              onChange={setStatus}
              options={STATUS_FILTER_OPTIONS}
            />
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              刷新
            </Button>
          </div>
        </div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Text2SQL 写操作、Agent 人工处理（HITL）等所有命中人工审核的请求统一在这里处理；
          可编辑内容后再批准，也可以直接拒绝。
        </Text>

        <Card size="small">
          <Table<ReviewTask>
            dataSource={tasks}
            rowKey="id"
            loading={loading}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 15 }}
            expandable={{
              expandedRowRender: (task) => (
                <div style={{ maxWidth: 720 }}>
                  {task.warnings?.length > 0 && (
                    <Alert
                      type="warning"
                      showIcon
                      style={{ marginBottom: 12 }}
                      message={
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {task.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      }
                    />
                  )}
                  <TextArea
                    value={editing[task.id] ?? task.content}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [task.id]: e.target.value }))}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    disabled={task.status !== 'pending' || actingId === task.id}
                    style={{ fontFamily: task.source === 'text2sql' ? 'monospace' : undefined, fontSize: 13, marginBottom: 12 }}
                  />
                  {task.status === 'pending' ? (
                    <>
                      <Button type="primary" onClick={() => approve(task)} loading={actingId === task.id}>
                        批准并执行
                      </Button>
                      <Button danger style={{ marginLeft: 8 }} onClick={() => reject(task)} disabled={actingId === task.id}>
                        拒绝
                      </Button>
                    </>
                  ) : (
                    <Text type="secondary">
                      {task.resolvedAt ? `已于 ${new Date(task.resolvedAt).toLocaleString()} 处理` : '已处理'}
                      {task.result?.error ? `，结果：${task.result.error}` : ''}
                    </Text>
                  )}
                </div>
              ),
            }}
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
              {
                title: '来源',
                dataIndex: 'source',
                key: 'source',
                width: 100,
                render: (s: string) => <Tag>{SOURCE_LABEL[s] ?? s}</Tag>,
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 90,
                render: (s: ReviewStatus) => <Tag color={STATUS_TAG[s].color}>{STATUS_TAG[s].label}</Tag>,
              },
              { title: '审核提示', dataIndex: 'question', key: 'question', ellipsis: true },
              {
                title: '内容',
                dataIndex: 'content',
                key: 'content',
                ellipsis: true,
                render: (c: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{c}</span>,
              },
              {
                title: '提交时间',
                dataIndex: 'createdAt',
                key: 'createdAt',
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
