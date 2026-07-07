import { useState, useEffect, useCallback, useRef } from 'react'
import { Typography, Select, Button, Card, Spin, message, Tag, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { listKnowledgeBases, type KbItem } from '../service/knowledge-base'
import { ragSearch, ragAsk, type RagSearchResponse, type RagAskResponse } from '../service/rag'
import ReactMarkdown from 'react-markdown'
import AskInput from '../components/AskInput'
import './MCP/MCPGaode.css'

const { Text } = Typography

const TOP_K_OPTIONS = [3, 5, 10, 20].map((n) => ({ label: `Top ${n}`, value: n }))

const KB_EXAMPLES: Record<string, string[]> = {
  bilibili: [
    '哔哩哔哩大会员有哪些权益？',
    '如何成为 UP 主并开通直播？',
    '投稿视频有哪些规范要求？',
    '充电打赏规则是怎样的？',
    '被举报后如何申诉？',
  ],
  disney: [
    '迪士尼乐园有哪些必玩项目？',
    '门票价格是多少？年票怎么用？',
    '有哪些适合情侣的游玩项目？',
    '园区餐饮有哪些选择？',
    '最刺激的游乐项目是什么？',
  ],
  west_china: [
    '华西医院怎么预约挂号？',
    '出入院需要办理哪些手续？',
    '医保在华西怎么报销？',
    '华西有哪些特色专科？',
    '各院区怎么乘车前往？',
    '怎么到华西各院区？',
  ],
}

function getKbExamples(kbName: string): string[] {
  const lower = kbName.toLowerCase()
  if (lower.includes('west_china') || lower.includes('westchina') || lower.includes('华西')) return KB_EXAMPLES.west_china
  if (lower.includes('disney') || lower.includes('迪士尼')) return KB_EXAMPLES.disney
  if (lower.includes('bilibili') || lower.includes('哔哩')) return KB_EXAMPLES.bilibili
  return []
}
const MODEL_OPTIONS = [
  { label: 'qwen-turbo', value: 'qwen-turbo' },
  { label: 'qwen-plus', value: 'qwen-plus' },
  { label: 'qwen-max', value: 'qwen-max' },
]

type QAMode = 'search' | 'ask'

interface QAPair {
  id: number
  query: string
  mode: QAMode
  rewrittenQuery?: string
  searchResults: RagSearchResponse | null
  askResponse: RagAskResponse | null
  loading: boolean
  error?: string
}

function ResultDocCard({ rank, distance, relevance_score, category, text, maxLen = 500 }: {
  rank: number; distance?: number | null; relevance_score?: number | null
  category?: string | null; text?: string | null; maxLen?: number
}) {
  const t = text ?? '-'
  return (
    <Card size="small" style={{ background: 'var(--ant-color-fill-quaternary)' }}>
      <div style={{ fontSize: 11, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>
        #{rank}
        {distance != null && ` · 距离 ${distance.toFixed(4)}`}
        {relevance_score != null && ` · 相关性 ${relevance_score.toFixed(4)}`}
        {category && <Tag style={{ marginLeft: 8 }}>{category}</Tag>}
      </div>
      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13 }}>
        {t.slice(0, maxLen)}{t.length > maxLen ? '…' : ''}
      </div>
    </Card>
  )
}

export default function RAG() {
  const [kbList, setKbList] = useState<KbItem[]>([])
  const [loadingKb, setLoadingKb] = useState(true)
  const [selectedKb, setSelectedKb] = useState<KbItem | null>(null)
  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState(5)
  const [model, setModel] = useState('qwen-turbo')
  const enableQueryRewrite = true
  const enableRerank = false
  const [searching, setSearching] = useState(false)
  const [asking, setAsking] = useState(false)
  const [qaPairs, setQaPairs] = useState<QAPair[]>([])
  const pairIdRef = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [qaPairs])

  const loadKbList = useCallback(async () => {
    setLoadingKb(true)
    try {
      const list = await listKnowledgeBases()
      const withVector = (list ?? []).filter(
        (k) => k.vector_db_name != null && k.vector_db_name !== '' && (k.segment_count ?? 0) > 0
      )
      setKbList(withVector)
      if (withVector.length > 0) {
        setSelectedKb((prev) => prev ?? withVector[0])
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

  const handleSearch = async () => {
    const q = query.trim()
    if (!q) { message.warning('请输入检索问题'); return }
    if (!selectedKb?.id) { message.warning('请先选择已向量化的知识库'); return }

    const id = ++pairIdRef.current
    setSearching(true)
    setQuery('')
    setQaPairs((prev) => [...prev, { id, query: q, mode: 'search', searchResults: null, askResponse: null, loading: true }])

    try {
      const res = await ragSearch({
        kb_id: selectedKb.id,
        query: q,
        top_k: topK,
        enable_query_rewrite: enableQueryRewrite,
        enable_rerank: enableRerank,
      })
      setQaPairs((prev) => prev.map((p) => p.id === id
        ? { ...p, searchResults: res, rewrittenQuery: res.rewritten_query ?? undefined, loading: false }
        : p
      ))
      if ((res.results ?? []).length === 0) message.info('未检索到相关片段')
    } catch (e) {
      const err = e instanceof Error ? e.message : '检索失败'
      setQaPairs((prev) => prev.map((p) => p.id === id ? { ...p, loading: false, error: err } : p))
      message.error(err)
    } finally {
      setSearching(false)
    }
  }

  const handleAsk = async (overrideQuery?: string) => {
    const q = (typeof overrideQuery === 'string' ? overrideQuery : query).trim()
    if (!q) { message.warning('请输入问题'); return }
    if (!selectedKb?.id) { message.warning('请先选择已向量化的知识库'); return }

    const id = ++pairIdRef.current
    setAsking(true)
    setQuery('')
    setQaPairs((prev) => [...prev, { id, query: q, mode: 'ask', searchResults: null, askResponse: null, loading: true }])

    try {
      const res = await ragAsk({
        kb_id: selectedKb.id,
        question: q,
        top_k: topK,
        model,
        enable_query_rewrite: enableQueryRewrite,
        enable_rerank: enableRerank,
      })
      setQaPairs((prev) => prev.map((p) => p.id === id
        ? { ...p, askResponse: res, rewrittenQuery: res.rewritten_query ?? undefined, loading: false }
        : p
      ))
    } catch (e) {
      const err = e instanceof Error ? e.message : '问答失败'
      setQaPairs((prev) => prev.map((p) => p.id === id ? { ...p, loading: false, error: err } : p))
      message.error(err)
    } finally {
      setAsking(false)
    }
  }

  const topSlot = (
    <Space wrap size="middle" align="end">
      <div>
        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 3 }}>知识库</Text>
        <Select
          placeholder="选择知识库"
          value={selectedKb?.id ?? undefined}
          onChange={(id) => setSelectedKb(kbList.find((k) => k.id === id) ?? null)}
          style={{ width: 300 }}
          loading={loadingKb}
          options={kbList.map((k) => ({
            label: `${k.name}${k.vector_db_name ? ` · ${k.segment_count ?? 0} 段` : ''}`,
            value: k.id,
          }))}
          notFoundContent={loadingKb ? <Spin size="small" /> : '暂无已向量化的知识库'}
        />
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 3 }}>检索数量</Text>
        <Select value={topK} onChange={setTopK} style={{ width: 100 }} options={TOP_K_OPTIONS} />
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 3 }}>生成模型</Text>
        <Select value={model} onChange={setModel} style={{ width: 140 }} options={MODEL_OPTIONS} />
      </div>
    </Space>
  )

  const preActions = (
    <Button
      icon={<SearchOutlined />}
      onClick={handleSearch}
      loading={searching}
      disabled={!selectedKb?.id || asking}
      style={{ minWidth: 64, height: 32, padding: '0 12px', fontSize: 13, fontWeight: 600, borderRadius: 8, flexShrink: 0 }}
    >
      仅检索
    </Button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 可滚动 QA 历史区 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '24px 24px 8px' }}>

        {/* 空状态 */}
        {qaPairs.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 6 }}>RAG 检索与问答</div>
            <div style={{ fontSize: 13 }}>在下方输入问题，点击「仅检索」或「RAG 问答」开始</div>
          </div>
        )}

        {/* QA 列表 */}
        {qaPairs.map((pair) => {
          const ragSources = pair.askResponse?.sources ?? []

          return (
            <div key={pair.id} style={{ marginBottom: 28 }}>
              {/* 用户问题气泡 */}
              <div className="mcp-gaode-row mcp-gaode-row-user" style={{ marginBottom: 12 }}>
                <div className="mcp-gaode-bubble mcp-gaode-bubble-user mcp-gaode-bubble-text">
                  {pair.query}
                </div>
              </div>

              {/* 改写后的问题 */}
              {pair.rewrittenQuery && pair.rewrittenQuery !== pair.query && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 8px' }}>
                  <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>改写后：</Text>
                  <Tag style={{ whiteSpace: 'normal', lineHeight: 1.5, padding: '2px 8px' }}>
                    {pair.rewrittenQuery}
                  </Tag>
                </div>
              )}

              {/* 结果卡片区：两列占满宽度 */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* 检索结果卡 */}
                <Card
                  size="small"
                  title="检索结果"
                  style={{ flex: 1, minWidth: 0 }}
                  extra={
                    pair.searchResults ? (
                      <Space>
                        {pair.searchResults.knowledge_base && <Tag>{pair.searchResults.knowledge_base}</Tag>}
                        {pair.searchResults.results.length > 0 && `${pair.searchResults.results.length} 条`}
                      </Space>
                    ) : ragSources.length > 0 ? (
                      <Tag>{ragSources.length} 条</Tag>
                    ) : null
                  }
                >
                  {pair.loading ? (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                      <Spin tip="检索中…" />
                    </div>
                  ) : pair.error ? (
                    <Text type="danger">{pair.error}</Text>
                  ) : pair.searchResults?.results?.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {pair.searchResults.results.map((r, i) => (
                        <ResultDocCard
                          key={i}
                          rank={r.rank}
                          distance={r.distance}
                          category={r.doc.category}
                          text={r.doc.text}
                        />
                      ))}
                    </div>
                  ) : ragSources.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {ragSources.map((s, i) => (
                        <ResultDocCard
                          key={i}
                          rank={s.rank}
                          distance={s.distance}
                          relevance_score={s.relevance_score}
                          category={s.category}
                          text={s.text}
                        />
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary">未检索到相关片段</Text>
                  )}
                </Card>

                {/* RAG 问答结果卡（仅 ask 模式） */}
                {pair.mode === 'ask' && (
                  <Card
                    size="small"
                    title="RAG 问答结果"
                    style={{ flex: 1, minWidth: 0 }}
                    extra={
                      pair.askResponse ? (
                        <Space>
                          <Tag>{pair.askResponse.model}</Tag>
                          {pair.askResponse.sources.length > 0 && `${pair.askResponse.sources.length} 个来源`}
                        </Space>
                      ) : null
                    }
                  >
                    {pair.loading ? (
                      <div style={{ textAlign: 'center', padding: 24 }}>
                        <Spin tip="生成回答中…" />
                      </div>
                    ) : pair.askResponse?.answer ? (
                      <div className="markdown-body" style={{ fontSize: 13 }}>
                        <ReactMarkdown>{pair.askResponse.answer}</ReactMarkdown>
                      </div>
                    ) : pair.error ? (
                      <Text type="danger">{pair.error}</Text>
                    ) : null}
                  </Card>
                )}
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* 底部输入区 */}
      <AskInput
        topSlot={topSlot}
        innerTopSlot={
          selectedKb && getKbExamples(selectedKb.name).length > 0 ? (
            <>
              {getKbExamples(selectedKb.name).map((q) => (
                <Tag
                  key={q}
                  style={{ cursor: 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0 }}
                  onClick={() => handleAsk(q)}
                >
                  {q}
                </Tag>
              ))}
            </>
          ) : undefined
        }
        preActions={preActions}
        value={query}
        onChange={setQuery}
        onSend={handleAsk}
        placeholder="输入问题或关键词进行检索…"
        loading={asking}
        disabled={!selectedKb?.id}
        buttonText="RAG 问答"
        minRows={1}
        maxRows={3}
      />
    </div>
  )
}
