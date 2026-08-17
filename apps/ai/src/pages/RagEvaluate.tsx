import { useCallback, useEffect, useState } from 'react'
import { Layout, Typography, Select, Button, Card, Input, message, Tag, Space, Progress, Collapse } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import { listKnowledgeBases, type KbItem } from '../service/knowledge-base'
import { ragEvaluate, type RagEvaluateResponse } from '../service/rag'

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
  const [kbList, setKbList] = useState<KbItem[]>([])
  const [loadingKb, setLoadingKb] = useState(true)
  const [selectedKbId, setSelectedKbId] = useState<number | null>(null)
  const [question, setQuestion] = useState('')
  const [groundTruth, setGroundTruth] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RagEvaluateResponse | null>(null)

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

  return (
    <Layout style={{ height: '100%', minHeight: 400, background: 'transparent', overflow: 'hidden' }}>
      <Content style={{ overflow: 'auto', padding: 24, background: 'transparent', width: '100%', maxWidth: 860 }}>
        <Title level={5} style={{ margin: 0, marginBottom: 8, color: 'var(--ds-text)', fontWeight: 600 }}>
          RAG 效果评测（RAGAS）
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          跑一次真实 RAG 问答，用 RAGAS 给这次回答客观打分——不用人工一条条看。忠实性/答案相关性不需要标准答案就能算；
          上下文精准度/召回率/答案正确性需要填标准答案才会算。
        </Paragraph>

        <Card size="small" title="发起一次评测" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <div>
              <Text style={{ display: 'block', marginBottom: 4 }}>知识库</Text>
              <Select
                style={{ width: '100%' }}
                loading={loadingKb}
                value={selectedKbId}
                onChange={setSelectedKbId}
                placeholder="选择知识库"
                options={kbList.map((k) => ({ label: k.name, value: k.id }))}
              />
            </div>
            <div>
              <Text style={{ display: 'block', marginBottom: 4 }}>问题</Text>
              <TextArea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder="例如：华西医院的挂号时间是什么时候？"
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
    </Layout>
  )
}
