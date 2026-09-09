// AI 股票分析页面：搜索/快捷选股 → 四个分析维度（行情查询自动配图、ARIMA 预测、
// 布林带异常检测、Prophet 周期分解），对接后端 service/ai/stock_analysis.py。
// 独立页面，不跟 Text2SQL 页面共用任何状态或组件。
import { useRef, useState } from 'react'
import { Layout, Typography, AutoComplete, Input, Button, Card, Space, Tag, Tabs, Table, message, Spin } from 'antd'
import { FundOutlined } from '@ant-design/icons'
import {
  searchStock,
  queryStockPrices,
  arimaForecast,
  bollDetection,
  prophetAnalysis,
  POPULAR_STOCKS,
  type StockHit,
  type PriceQueryResult,
  type ArimaResult,
  type BollResult,
  type ProphetResult,
} from '../service/stock-analysis'

const { Content } = Layout
const { Title, Text } = Typography

export default function StockAnalysis() {
  // ------------------------------------------------------------------
  // 选股相关状态：keyword/options 是搜索框的输入值和下拉候选项，
  // selected 是当前已选中、后续四个分析维度都基于它发请求的股票。
  // ------------------------------------------------------------------
  const [keyword, setKeyword] = useState('')
  const [searching, setSearching] = useState(false)
  const [options, setOptions] = useState<StockHit[]>([])
  const [selected, setSelected] = useState<StockHit | null>(null)

  // 日期区间（布林带/Prophet/行情查询共用）+ ARIMA 预测天数，均留空/留默认由用户手填
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [arimaDays, setArimaDays] = useState('7')

  // 当前激活的分析 Tab
  const [activeTab, setActiveTab] = useState('query')

  // 四个分析维度各自独立的 loading/结果状态，互不影响，可以来回切换 Tab 而不丢失已查出的结果
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryResult, setQueryResult] = useState<PriceQueryResult | null>(null)

  const [arimaLoading, setArimaLoading] = useState(false)
  const [arimaResult, setArimaResult] = useState<ArimaResult | null>(null)

  const [bollLoading, setBollLoading] = useState(false)
  const [bollResult, setBollResult] = useState<BollResult | null>(null)

  const [prophetLoading, setProphetLoading] = useState(false)
  const [prophetResult, setProphetResult] = useState<ProphetResult | null>(null)

  // 搜索防抖用的定时器 ref：AutoComplete 的 onSearch 在用户每敲一个字符时都会触发，
  // 不做防抖会导致每个字符都发一次请求（既浪费、又容易把后端 Tushare 的限频接口打爆）。
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** 搜索框输入变化：更新受控 value，400ms 内没有新输入才真正发请求（防抖） */
  const handleSearch = (value: string) => {
    setKeyword(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!value.trim()) {
      setOptions([])
      return
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const hits = await searchStock(value.trim())
        setOptions(hits)
      } catch (e) {
        message.error(e instanceof Error ? e.message : '搜索失败')
        setOptions([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  /**
   * 选中一支股票（不管是从搜索下拉里选的，还是点了下面的"常用股票"标签）：
   * 记录选中项、清空搜索框，并把上一支股票遗留的四个分析结果全部清空，
   * 避免用户看到"张三的行情表格 + 李四的 ARIMA 预测图"这种串数据的情况。
   */
  const selectStock = (hit: StockHit) => {
    setSelected(hit)
    setKeyword('')
    setOptions([])
    setQueryResult(null)
    setArimaResult(null)
    setBollResult(null)
    setProphetResult(null)
  }

  // AutoComplete 的 onSelect 回调签名是 (value, option)，这里只需要option 里带的原始 hit 对象
  const handleSelect = (_value: string, option: { hit: StockHit }) => selectStock(option.hit)

  /** 把 startDate/endDate 拼成请求参数对象；留空的字段不传，让后端用默认区间兜底 */
  const range = () => ({
    ...(startDate ? { start_date: startDate } : {}),
    ...(endDate ? { end_date: endDate } : {}),
  })

  /** “行情查询 / 自动配图” Tab：查历史行情表格 + 后端智能选图 */
  const runQuery = async () => {
    if (!selected) return
    setQueryLoading(true)
    setQueryResult(null)
    try {
      setQueryResult(await queryStockPrices(selected.ts_code, range()))
    } catch (e) {
      message.error(e instanceof Error ? e.message : '查询失败')
    } finally {
      setQueryLoading(false)
    }
  }

  /** “ARIMA 预测” Tab：校验天数合法后发请求 */
  const runArima = async () => {
    if (!selected) return
    const n = parseInt(arimaDays, 10)
    if (!n || n <= 0) return message.warning('请输入有效的预测天数')
    setArimaLoading(true)
    setArimaResult(null)
    try {
      setArimaResult(await arimaForecast(selected.ts_code, n))
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'ARIMA 预测失败')
    } finally {
      setArimaLoading(false)
    }
  }

  /** “布林带异常检测” Tab */
  const runBoll = async () => {
    if (!selected) return
    setBollLoading(true)
    setBollResult(null)
    try {
      setBollResult(await bollDetection(selected.ts_code, range()))
    } catch (e) {
      message.error(e instanceof Error ? e.message : '布林带检测失败')
    } finally {
      setBollLoading(false)
    }
  }

  /** “Prophet 周期分解” Tab */
  const runProphet = async () => {
    if (!selected) return
    setProphetLoading(true)
    setProphetResult(null)
    try {
      setProphetResult(await prophetAnalysis(selected.ts_code, range()))
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Prophet 分析失败')
    } finally {
      setProphetLoading(false)
    }
  }

  // 日期区间输入框：行情查询、布林带、Prophet 三个 Tab 共用同一套 UI，抽成变量复用，
  // ARIMA Tab 不需要日期区间（固定用近一年数据训练），所以没有引用这个变量。
  const rangeInputs = (
    <Space style={{ marginBottom: 12 }}>
      <Input
        placeholder="起始日期 YYYY-MM-DD（默认近一年）"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        style={{ width: 220 }}
      />
      <Input
        placeholder="结束日期 YYYY-MM-DD（默认今天）"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        style={{ width: 220 }}
      />
    </Space>
  )

  return (
    <Layout style={{ height: '100%', background: 'var(--ai-canvas)' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        {/* 页面标题 */}
        <Space align="center" style={{ marginBottom: 20 }}>
          <FundOutlined style={{ fontSize: 24, color: 'var(--ai-primary)' }} />
          <Title level={4} style={{ margin: 0 }}>AI 股票分析</Title>
        </Space>

        {/* 选股区：搜索框 + 常用股票快捷标签 + 当前选中提示 */}
        <Card title="选择股票" style={{ marginBottom: 16 }}>
          <AutoComplete
            value={keyword}
            style={{ width: 320 }}
            options={options.map((h) => ({ value: `${h.name} ${h.ts_code}`, label: `${h.name} (${h.ts_code})`, hit: h }))}
            onSearch={handleSearch}
            onSelect={handleSelect}
            notFoundContent={searching ? <Spin size="small" /> : '未找到匹配股票'}
          >
            <Input.Search placeholder="输入股票名称或代码，例如：贵州茅台" loading={searching} />
          </AutoComplete>

          {/* 常用股票：直接点击选中，不需要经过搜索接口，也就不受 Tushare 限频影响 */}
          <div style={{ marginTop: 12 }}>
            <Text type="secondary" style={{ marginRight: 8 }}>常用股票：</Text>
            {POPULAR_STOCKS.map((s) => (
              <Tag
                key={s.ts_code}
                color={selected?.ts_code === s.ts_code ? 'green' : 'default'}
                style={{ cursor: 'pointer', marginBottom: 6 }}
                onClick={() => selectStock(s)}
              >
                {s.name}
              </Tag>
            ))}
          </div>

          {/* 当前选中的股票名称 + 代码，绿色标签之外再单独展示一份，方便一眼确认 */}
          {selected && (
            <div style={{ marginTop: 12 }}>
              <Tag color="blue">{selected.name}</Tag>
              <Tag>{selected.ts_code}</Tag>
            </div>
          )}
        </Card>

        {/* 选中股票之后才展示分析 Tab，避免用户在没选股票的情况下点分析按钮 */}
        {selected && (
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  // Tab 1：行情查询 + 自动配图——直接查一段区间的原始行情表格，
                  // 图表类型（折线/柱状）由后端根据数据点数量自动决定。
                  key: 'query',
                  label: '行情查询 / 自动配图',
                  children: (
                    <div>
                      {rangeInputs}
                      <div>
                        <Button type="primary" onClick={runQuery} loading={queryLoading}>查询</Button>
                      </div>
                      {queryResult && (
                        <div style={{ marginTop: 16 }}>
                          {/* 表格列是后端动态返回的 columns，前端不用硬编码字段名 */}
                          <Table
                            size="small"
                            bordered
                            scroll={{ x: true }}
                            pagination={{ pageSize: 10 }}
                            columns={queryResult.columns.map((c) => ({ title: c, dataIndex: c, key: c }))}
                            dataSource={queryResult.rows.map((row, i) => {
                              const obj: Record<string, unknown> = { key: i }
                              queryResult.columns.forEach((c, j) => { obj[c] = row[j] })
                              return obj
                            })}
                          />
                          {/* 后端返回的是 base64 内嵌图片，直接拼成 data URI 渲染，不需要额外的图片接口 */}
                          <img src={`data:image/png;base64,${queryResult.image_base64}`} alt="行情图表" style={{ maxWidth: '100%', marginTop: 12 }} />
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  // Tab 2：ARIMA 预测——只需要一个"未来天数"输入，日期区间固定用近一年，
                  // 所以这里没有复用 rangeInputs。
                  key: 'arima',
                  label: 'ARIMA 预测',
                  children: (
                    <div>
                      <Space style={{ marginBottom: 12 }}>
                        <Input
                          placeholder="预测未来天数"
                          value={arimaDays}
                          onChange={(e) => setArimaDays(e.target.value)}
                          style={{ width: 160 }}
                        />
                      </Space>
                      <div>
                        <Button type="primary" onClick={runArima} loading={arimaLoading}>预测</Button>
                      </div>
                      {arimaResult && (
                        <div style={{ marginTop: 16 }}>
                          {/* 后端生成的一句自然语言趋势总结，比如"预计持续走高，变动约 2.3%" */}
                          <Text strong>{arimaResult.trend_summary}</Text>
                          <Table
                            size="small"
                            bordered
                            style={{ marginTop: 8 }}
                            pagination={false}
                            columns={[
                              { title: '预测日期', dataIndex: 'date', key: 'date' },
                              { title: '预测收盘价', dataIndex: 'predicted_close', key: 'predicted_close' },
                            ]}
                            dataSource={arimaResult.forecast.map((f, i) => ({ key: i, ...f }))}
                          />
                          <img src={`data:image/png;base64,${arimaResult.image_base64}`} alt="ARIMA 预测图" style={{ maxWidth: '100%', marginTop: 12 }} />
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  // Tab 3：布林带异常检测——超买/超卖各是一张单独的日期+收盘价小表格，
                  // 用 Space 并排展示，图表在下方单独一行。
                  key: 'boll',
                  label: '布林带异常检测',
                  children: (
                    <div>
                      {rangeInputs}
                      <div>
                        <Button type="primary" onClick={runBoll} loading={bollLoading}>检测</Button>
                      </div>
                      {bollResult && (
                        <div style={{ marginTop: 16 }}>
                          <Space size="large" align="start">
                            <div>
                              <Text strong>超买日期</Text>
                              <Table
                                size="small"
                                bordered
                                style={{ marginTop: 8 }}
                                pagination={false}
                                columns={[
                                  { title: '日期', dataIndex: 'date', key: 'date' },
                                  { title: '收盘价', dataIndex: 'close', key: 'close' },
                                ]}
                                // 后端返回的是 [日期, 收盘价] 元组数组，这里解构成表格需要的对象数组
                                dataSource={bollResult.overbought.map(([date, close], i) => ({ key: i, date, close }))}
                              />
                            </div>
                            <div>
                              <Text strong>超卖日期</Text>
                              <Table
                                size="small"
                                bordered
                                style={{ marginTop: 8 }}
                                pagination={false}
                                columns={[
                                  { title: '日期', dataIndex: 'date', key: 'date' },
                                  { title: '收盘价', dataIndex: 'close', key: 'close' },
                                ]}
                                dataSource={bollResult.oversold.map(([date, close], i) => ({ key: i, date, close }))}
                              />
                            </div>
                          </Space>
                          <img src={`data:image/png;base64,${bollResult.image_base64}`} alt="布林带图" style={{ maxWidth: '100%', marginTop: 12, display: 'block' }} />
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  // Tab 4：Prophet 周期分解——只有一张图（trend/weekly/yearly 三个子图拼在一起），
                  // 没有表格数据。
                  key: 'prophet',
                  label: 'Prophet 周期分解',
                  children: (
                    <div>
                      {rangeInputs}
                      <div>
                        <Button type="primary" onClick={runProphet} loading={prophetLoading}>分析</Button>
                      </div>
                      {prophetResult && (
                        <img src={`data:image/png;base64,${prophetResult.image_base64}`} alt="Prophet 周期分解图" style={{ maxWidth: '100%', marginTop: 16 }} />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        )}
      </Content>
    </Layout>
  )
}
