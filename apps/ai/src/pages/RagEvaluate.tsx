import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Layout, Typography, Select, Button, Card, Input, InputNumber, message, Tag, Space,
  Progress, Collapse, Table, Modal, Form, Popconfirm,
} from 'antd'
import {
  PlayCircleOutlined, ThunderboltOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons'
import { listKnowledgeBases, type KbItem } from '../service/knowledge-base'
import {
  ragEvaluate,
  generateTestset,
  listTestset,
  batchEvaluateTestset,
  createTestsetItem,
  updateTestsetItem,
  deleteTestsetItem,
  type RagEvaluateResponse,
  type RagTestsetItem,
  type BatchEvalResponse,
} from '../service/rag'

const { Content } = Layout
const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const METRIC_LABELS: Record<string, { label: string; hint: string }> = {
  faithfulness: { label: '忠实性', hint: '答案是否忠于检索到的上下文，有没有编造内容' },
  answer_relevancy: { label: '答案相关性', hint: '答案有没有正面、完整地回应问题' },
  context_precision: { label: '上下文精准度', hint: '检索片段里真正相关的占比（需要标准答案）' },
  context_recall: { label: '上下文召回率', hint: '回答问题需要的信息是否都被检索到了（需要标准答案）' },
  answer_correctness: { label: '答案正确性', hint: '生成答案与标准答案的匹配度（需要标准答案）' },
}

const METRIC_ORDER = ['faithfulness', 'answer_relevancy', 'context_precision', 'context_recall', 'answer_correctness']

function scoreColor(v: number): string {
  if (v >= 0.75) return '#22c55e'
  if (v >= 0.5) return '#f59e0b'
  return '#ef4444'
}

export default function RagEvaluate() {
  const [searchParams] = useSearchParams()
  const [kbList, setKbList] = useState<KbItem[]>([])
  const [loadingKb, setLoadingKb] = useState(true)
  const [selectedKbId, setSelectedKbId] = useState<number | null>(null)

  const [testsetItems, setTestsetItems] = useState<RagTestsetItem[]>([])
  const [loadingTestset, setLoadingTestset] = useState(false)
  const [genSize, setGenSize] = useState(10)
  const [generating, setGenerating] = useState(false)

  const [batchRunning, setBatchRunning] = useState(false)
  const [batchResult, setBatchResult] = useState<BatchEvalResponse | null>(null)

  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RagTestsetItem | null>(null)
  const [savingItem, setSavingItem] = useState(false)
  const [itemForm] = Form.useForm<{ question: string; ground_truth: string; source_context?: string }>()

  const [question, setQuestion] = useState('')
  const [groundTruth, setGroundTruth] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RagEvaluateResponse | null>(null)

  const [urlParamsApplied, setUrlParamsApplied] = useState(false)

  const loadKbList = useCallback(async () => {
    setLoadingKb(true)
    try {
      const list = await listKnowledgeBases()
      const withVector = (list ?? []).filter(
        (k) => k.vector_db_name != null && k.vector_db_name !== '' && (k.segment_count ?? 0) > 0
      )
      setKbList(withVector)
      if (withVector.length > 0) {
        setSelectedKbId((prev) => prev ?? withVector[0].id)
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载知识库列表失败')
      setKbList([])
    } finally {
      setLoadingKb(false)
    }
  }, [])

  useEffect(() => {
    loadKbList()
  }, [loadKbList])

  // 从 RAG 问答页「去测评」跳转过来时，URL 带 kb_id + question，只在首次挂载应用一次
  useEffect(() => {
    if (urlParamsApplied) return
    const kbIdParam = searchParams.get('kb_id')
    const questionParam = searchParams.get('question')
    if (kbIdParam) setSelectedKbId(Number(kbIdParam))
    if (questionParam) setQuestion(questionParam)
    setUrlParamsApplied(true)
  }, [searchParams, urlParamsApplied])

  const loadTestset = useCallback(async () => {
    if (!selectedKbId) {
      setTestsetItems([])
      return
    }
    setLoadingTestset(true)
    try {
      const { items } = await listTestset(selectedKbId)
      setTestsetItems(items)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载测试集失败')
    } finally {
      setLoadingTestset(false)
    }
  }, [selectedKbId])

  useEffect(() => {
    loadTestset()
    setBatchResult(null)
  }, [loadTestset])

  // URL 带来的 question 如果正好命中测试集里的某条，自动带出标准答案（只在还没手动填过时才自动填）
  useEffect(() => {
    if (!question || groundTruth || testsetItems.length === 0) return
    const matched = testsetItems.find((it) => it.question.trim() === question.trim())
    if (matched) setGroundTruth(matched.ground_truth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, testsetItems])

  const generate = async () => {
    if (!selectedKbId) {
      message.warning('请先选择知识库')
      return
    }
    setGenerating(true)
    try {
      const { total } = await generateTestset(selectedKbId, genSize)
      message.success(`生成了 ${total} 条测试数据（可能耗时 1~2 分钟，已完成）`)
      await loadTestset()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const runBatch = async () => {
    if (!selectedKbId || testsetItems.length === 0) {
      message.warning('该知识库还没有测试集，先生成')
      return
    }
    setBatchRunning(true)
    setBatchResult(null)
    try {
      const data = await batchEvaluateTestset(selectedKbId)
      setBatchResult(data)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '批量评测失败')
    } finally {
      setBatchRunning(false)
    }
  }

  const pickTestsetItem = (item: RagTestsetItem) => {
    setQuestion(item.question)
    setGroundTruth(item.ground_truth)
    setResult(null)
    message.success('已带入下方单条评测表单')
  }

  const openCreateItemModal = () => {
    if (!selectedKbId) {
      message.warning('请先选择知识库')
      return
    }
    setEditingItem(null)
    itemForm.resetFields()
    setItemModalOpen(true)
  }

  const openEditItemModal = (item: RagTestsetItem) => {
    setEditingItem(item)
    itemForm.setFieldsValue({
      question: item.question,
      ground_truth: item.ground_truth,
      source_context: item.source_context ?? '',
    })
    setItemModalOpen(true)
  }

  const closeItemModal = () => {
    setItemModalOpen(false)
    setEditingItem(null)
    itemForm.resetFields()
  }

  const saveItemModal = async () => {
    let values: { question: string; ground_truth: string; source_context?: string }
    try {
      values = await itemForm.validateFields()
    } catch {
      return // 校验失败，表单自己会标红提示，不用额外弹 message
    }
    setSavingItem(true)
    try {
      if (editingItem) {
        await updateTestsetItem(editingItem.id, values)
        message.success('已保存')
      } else {
        if (!selectedKbId) return
        await createTestsetItem({ kb_id: selectedKbId, ...values })
        message.success('已新增')
      }
      setItemModalOpen(false)
      setEditingItem(null)
      itemForm.resetFields()
      await loadTestset()
    } catch (e) {
      if (e instanceof Error) message.error(e.message)
    } finally {
      setSavingItem(false)
    }
  }

  const deleteItem = async (item: RagTestsetItem) => {
    try {
      await deleteTestsetItem(item.id)
      message.success('已删除')
      await loadTestset()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '删除失败')
    }
  }

  const run = async () => {
    if (!selectedKbId) {
      message.warning('请先选择知识库')
      return
    }
    if (!question.trim()) {
      message.warning('请输入问题')
      return
    }
    setRunning(true)
    setResult(null)
    try {
      const data = await ragEvaluate({
        kb_id: selectedKbId,
        question: question.trim(),
        ground_truth: groundTruth.trim() || undefined,
        top_k: 5,
      })
      setResult(data)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '评测失败')
    } finally {
      setRunning(false)
    }
  }

  const renderMetricRow = (title: string, scores: RagEvaluateResponse['scores']) => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <Text style={{ width: 48, flexShrink: 0 }}>{title}</Text>
      {METRIC_ORDER.map((key) => {
        const v = scores[key as keyof typeof scores] as number | null | undefined
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{METRIC_LABELS[key].label}</Text>
            {typeof v === 'number' ? (
              <Tag color={scoreColor(v)} style={{ margin: 0 }}>{Math.round(v * 100)}%</Tag>
            ) : (
              <Tag style={{ margin: 0 }}>-</Tag>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <Layout style={{ height: '100%', minHeight: 400, background: 'transparent', overflow: 'hidden' }}>
      <Content style={{ overflow: 'auto', padding: 24, background: 'transparent', width: '100%' }}>
        <Title level={5} style={{ margin: 0, marginBottom: 8, color: 'var(--ds-text)', fontWeight: 600 }}>
          RAG 效果评测（RAGAS）
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          用 RAGAS 客观打分替代人工一条条看。测试集由 RAGAS 自动生成（喂知识库分段，产出「问题-标准答案」），
          落库供反复回归评测——改了 prompt/模型/检索参数后，拿同一批题重新跑一遍看有没有退步。
        </Paragraph>

        <Card size="small" title="知识库" style={{ marginBottom: 16 }}>
          <Select
            style={{ width: '100%' }}
            loading={loadingKb}
            value={selectedKbId}
            onChange={setSelectedKbId}
            placeholder="选择知识库"
            options={kbList.map((k) => ({ label: k.name, value: k.id }))}
          />
        </Card>

        <Card
          size="small"
          title={`测试集（${testsetItems.length} 条）`}
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              <InputNumber min={1} max={20} value={genSize} onChange={(v) => setGenSize(v ?? 10)} style={{ width: 64 }} />
              <Button icon={<ThunderboltOutlined />} loading={generating} onClick={generate}>
                生成测试集
              </Button>
              <Button icon={<PlusOutlined />} onClick={openCreateItemModal}>
                新增
              </Button>
              <Button
                type="primary"
                loading={batchRunning}
                disabled={testsetItems.length === 0}
                onClick={runBatch}
              >
                批量评测这 {testsetItems.length} 条
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadTestset} loading={loadingTestset} />
            </Space>
          }
        >
          {batchResult && (
            <Card size="small" type="inner" title="批量评测汇总" style={{ marginBottom: 12 }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {renderMetricRow('平均', batchResult.summary)}
                {renderMetricRow('最低', batchResult.summaryMin)}
                {batchResult.results.some((r) => r.error) && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    {batchResult.results.filter((r) => r.error).length} 条评测失败，详情见下方 error 字段
                  </Text>
                )}
              </Space>
            </Card>
          )}
          <Table<RagTestsetItem>
            dataSource={testsetItems}
            rowKey="id"
            loading={loadingTestset}
            size="small"
            scroll={{ x: 900 }}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: '问题', dataIndex: 'question', key: 'question', width: 220 },
              { title: '标准答案', dataIndex: 'ground_truth', key: 'ground_truth', width: 360 },
              { title: '生成方式', dataIndex: 'synthesizer', key: 'synthesizer', width: 180, ellipsis: true },
              {
                title: '操作',
                key: 'action',
                width: 140,
                render: (_, record) => (
                  <Space size={4}>
                    <Button type="link" size="small" onClick={() => pickTestsetItem(record)}>
                      选用
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openEditItemModal(record)}
                    />
                    <Popconfirm
                      title="确定删除这条测试数据？"
                      onConfirm={() => deleteItem(record)}
                      okText="删除"
                      okType="danger"
                      cancelText="取消"
                    >
                      <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <Card size="small" title="单条评测" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <div>
              <Text style={{ display: 'block', marginBottom: 4 }}>问题</Text>
              <TextArea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder="例如：华西医院的挂号时间是什么时候？（可以点上面测试集表格的「选用」自动带入）"
              />
            </div>
            <div>
              <Text style={{ display: 'block', marginBottom: 4 }}>
                标准答案（可选——不填只算忠实性/答案相关性两项）
              </Text>
              <TextArea
                value={groundTruth}
                onChange={(e) => setGroundTruth(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder="填了才会算上下文精准度/召回率/答案正确性"
              />
            </div>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={run} loading={running}>
              运行并评测
            </Button>
          </Space>
        </Card>

        {result && (
          <>
            <Card size="small" title="RAG 回答" style={{ marginBottom: 16 }}>
              <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{result.answer}</Paragraph>
              <Collapse
                size="small"
                items={[
                  {
                    key: 'contexts',
                    label: `检索到的上下文（${result.contexts.length} 条）`,
                    children: result.contexts.map((c, i) => (
                      <Paragraph key={i} type="secondary" style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                        {i + 1}. {c}
                      </Paragraph>
                    )),
                  },
                ]}
              />
            </Card>

            <Card size="small" title="RAGAS 评分">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                {METRIC_ORDER.map((key) => {
                  const value = result.scores[key as keyof typeof result.scores] as number | null | undefined
                  const errorMsg = result.scores._errors?.[key]
                  const meta = METRIC_LABELS[key]
                  return (
                    <div key={key} style={{ textAlign: 'center' }}>
                      {typeof value === 'number' ? (
                        <Progress
                          type="circle"
                          size={80}
                          percent={Math.round(value * 100)}
                          strokeColor={scoreColor(value)}
                        />
                      ) : (
                        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Tag color={errorMsg ? 'red' : 'default'}>{errorMsg ? '计算失败' : '未计算'}</Tag>
                        </div>
                      )}
                      <div style={{ marginTop: 8, fontWeight: 600 }}>{meta.label}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {meta.hint}
                      </Text>
                    </div>
                  )
                })}
              </div>
            </Card>
          </>
        )}
      </Content>

      <Modal
        title={editingItem ? '编辑测试数据' : '新增测试数据'}
        open={itemModalOpen}
        onOk={saveItemModal}
        onCancel={closeItemModal}
        confirmLoading={savingItem}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item name="question" label="问题" rules={[{ required: true, message: '请输入问题' }]}>
            <TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item name="ground_truth" label="标准答案" rules={[{ required: true, message: '请输入标准答案' }]}>
            <TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item name="source_context" label="原文依据（可选）">
            <TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}
