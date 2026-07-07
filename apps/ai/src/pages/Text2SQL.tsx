import { useState, useEffect, useMemo, useRef } from 'react'
import { Layout, Typography, Input, Card, Spin, message, Select, Table, Tabs, Form, Tag } from 'antd'
import ReactMarkdown from 'react-markdown'
import { text2sql, type Text2SqlResponse } from '../service/text2sql'
import { getTableData, TABLE_NAMES, TABLE_SCHEMAS } from '../service/table-data'
import AskInput from '../components/AskInput'

const { Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

/** 示例问题，点击后直接发送 */
const EXAMPLE_QUERIES = [
  '描述与订单相关的表及其关系',
  '描述HeroDetails表',
  '描述Hero表',
  '找出英雄攻击力最高的前5个英雄',
  '获取所有客户的姓名和联系电话',
  '查询所有未支付保费的保单号和客户姓名',
  '找出所有理赔金额大于10000元的理赔记录，并列出相关客户的姓名和联系电话',
]

/** 表头 + 分页栏约占高度，用于计算表体 scroll.y；需足够大否则分页会被 overflow 裁掉 */
const TABLE_HEADER_FOOTER_HEIGHT = 80

function DataTab() {
  const [form] = Form.useForm<{ table: string }>()
  const table = Form.useWatch('table', form) ?? TABLE_NAMES[0]
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState<number | undefined>(undefined)

  useEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const update = () => {
      const h = el.clientHeight
      setScrollY(h > TABLE_HEADER_FOOTER_HEIGHT ? h - TABLE_HEADER_FOOTER_HEIGHT : 300)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [loading, list.length])

  useEffect(() => {
    if (!table) return
    setLoading(true)
    getTableData({ table, page, page_size: pageSize })
      .then((res) => {
        
        setList(res.list)
        setTotal(res.total)
      })
      .catch((e) => {
        message.error(e instanceof Error ? e.message : '加载失败')
        setList([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [table, page, pageSize])

  const columns = useMemo(() => {
    const schema = TABLE_SCHEMAS[table]
    
    if (schema?.length) {
      return schema.map(({ key, title }) => ({
        title,
        dataIndex: key,
        key,
        ellipsis: true,
        render: (v: unknown) => (v != null ? String(v) : ''),
      }))
    }
    if (list.length > 0) {
      return Object.keys(list[0]).map((k) => ({
        title: k,
        dataIndex: k,
        key: k,
        ellipsis: true,
        render: (v: unknown) => (v != null ? String(v) : ''),
      }))
    }
    return []
  }, [table, list])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <Form
        form={form}
        layout="inline"
        initialValues={{ table: TABLE_NAMES[0] }}
        onValuesChange={(_, v) => v.table != null && setPage(1)}
        style={{ marginBottom: 16, flexShrink: 0 }}
      >
        <Form.Item name="table" label="表名">
          <Select
            showSearch
            placeholder="选择或搜索表名"
            optionFilterProp="label"
            filterOption={(input, opt) => (opt?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
            style={{ width: 220 }}
            options={TABLE_NAMES.map((t) => ({ label: t, value: t }))}
          />
        </Form.Item>
      </Form>
      <div ref={tableWrapRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin tip="加载中…" />
          </div>
        ) : list.length === 0 && !loading ? (
          <Text type="secondary" style={{ padding: 24 }}>请选择表名查询</Text>
        ) : (
          <Table
            size="small"
            rowKey={(_, i) => String(i)}
            dataSource={Array.isArray(list) ? list : []}
            columns={columns}
            childrenColumnName="__noTree__"
            pagination={{
              current: page,
              pageSize: pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, size) => {
                setPage(p)
                setPageSize(size ?? pageSize)
              },
            }}
            scroll={{ x: 'max-content', y: scrollY }}
          />
        )}
      </div>
    </div>
  )
}

const DEFAULT_QUERY = EXAMPLE_QUERIES[0]

function Text2SQLTab() {
  const [question, setQuestion] = useState(DEFAULT_QUERY)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Text2SqlResponse | null>(null)
  const resultsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result) resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [result])

  const handleSubmit = async (qOverride?: string) => {
    const q = (qOverride ?? question).trim()
    if (!q) {
      message.warning('请输入自然语言问题')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const data = await text2sql({ question: q, model: 'qwen-turbo', max_rows: 500 })
      setResult(data)
    } catch (e: unknown) {
      const err = e as Error & { data?: Text2SqlResponse }
      if (err.data) setResult(err.data)
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = (q: string) => {
    setQuestion(q)
    handleSubmit(q)
  }

  const columns = result?.data?.length
    ? Object.keys(result.data[0]).map((key) => ({ title: key, dataIndex: key, key, ellipsis: true }))
    : []

  const answerItems = result?.data?.filter((r): r is Record<string, unknown> & { answer: string } =>
    typeof (r as { answer?: unknown }).answer === 'string'
  ) ?? []
  const answerContent = answerItems.length > 0 ? answerItems.map((r) => r.answer).join('\n\n') : null
  const isAnswerMode = answerContent != null && answerContent.trim() !== ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* 中间滚动内容区 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 0 8px' }}>
        {!result && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', color: '#94a3b8', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗄️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 6 }}>自然语言转 SQL</div>
            <div style={{ fontSize: 13 }}>在下方输入问题，自动生成并执行 SQL</div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin tip="生成 SQL 并执行中…" size="large" />
          </div>
        )}

        {result && (
          <>
            {(!isAnswerMode || (result.sql ?? '').trim()) && (
              <Card size="small" title="生成 SQL" style={{ marginBottom: 16 }}>
                <TextArea
                  value={result.sql}
                  readOnly
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  style={{ fontFamily: 'monospace', fontSize: 13, background: 'var(--ant-color-fill-quaternary)' }}
                />
              </Card>
            )}
            <Card
              size="small"
              title={isAnswerMode ? '执行结果' : `执行结果（${result.data?.length ?? 0} 条）`}
              style={{ marginBottom: 16 }}
            >
              {isAnswerMode ? (
                <div className="markdown-body" style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ds-text)' }}>
                  <ReactMarkdown>{answerContent}</ReactMarkdown>
                </div>
              ) : result.data?.length ? (
                <div style={{ overflowX: 'auto', minWidth: 0 }}>
                  <Table
                    size="small"
                    dataSource={result.data.map((row, i) => ({ ...row, key: i }))}
                    columns={columns}
                    childrenColumnName="__noTree__"
                    pagination={{ pageSize: 20, showSizeChanger: true }}
                    scroll={{ x: 'max-content' }}
                  />
                </div>
              ) : (
                <Text type="secondary">无数据或执行未返回行</Text>
              )}
            </Card>
          </>
        )}

        <div ref={resultsEndRef} />
      </div>

      {/* 底部输入区：示例放在输入框内 */}
      <AskInput
        value={question}
        onChange={setQuestion}
        onSend={() => handleSubmit()}
        innerTopSlot={
          EXAMPLE_QUERIES.map((q) => (
            <Tag
              key={q}
              style={{ cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0, maxWidth: '100%', whiteSpace: 'normal', lineHeight: '20px' }}
              onClick={() => !loading && handleExampleClick(q)}
            >
              {q}
            </Tag>
          ))
        }
        placeholder={DEFAULT_QUERY}
        loading={loading}
        buttonText="生成并执行"
        minRows={1}
        maxRows={3}
      />
    </div>
  )
}

export default function Text2SQL() {
  return (
    <Layout style={{ height: '100%', minHeight: 400, background: 'transparent', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Content style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 24, background: 'transparent', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
            Text2SQL
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Data：展示 ai 库表数据；Text2SQL：自然语言转 SQL 并执行
          </Text>
        </div>
        <Tabs
          defaultActiveKey="data"
          className="text2sql-tabs-fill"
          style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          items={[
            { key: 'data', label: 'Data', children: <DataTab /> },
            { key: 'text2sql', label: 'Text2SQL', children: <Text2SQLTab /> },
          ]}
        />
      </Content>
    </Layout>
  )
}
