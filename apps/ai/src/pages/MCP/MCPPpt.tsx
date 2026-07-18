import { useState, useEffect, useRef, useCallback, useMemo, Component, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { message, Spin, Alert, Modal, Button, Progress, Tag, Tooltip, Empty } from 'antd'
import {
  FilePptOutlined,
  ToolOutlined,
  EyeOutlined,
  DownloadOutlined,
  WechatOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  EditOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import {
  fetchPptAgentInfo,
  pptChat,
  getPptStatus,
  createPaymentOrder,
  claimPayment,
  getPaymentStatus,
  getPptCdnDownloadUrl,
  getPptEditorUrl,
  getPptHistory,
  getQrcodeUrl,
  extractPptIdFromSteps,
  extractPptIdFromText,
  type PptAgentInfo,
  type ChatMessage,
  type PptStatusData,
  type PptHistoryItem,
} from '../../service/mcp-ppt'
import './MCPGaode.css'
import AskInput from '../../components/AskInput'

// ─── 错误边界 ─────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error) { console.error('[MCP PPT Error]', error) }
  render() {
    if (this.state.hasError) {
      return <div className="mcp-gaode-loading"><div style={{ color: 'var(--ds-text-muted)' }}>渲染出错，请刷新页面</div></div>
    }
    return this.props.children
  }
}

// ─── 类型 ─────────────────────────────────────

// ─── 常量 ─────────────────────────────────────
const RECOMMENDED_PROMPTS = [
  '请帮我生成一份介绍“人工智能应用现状”的 PPT，尽量结构清晰',
  '做一份题为“企业数字化转型”的演示文稿',
  '生成观看电影《一代宗师》后有感的 PPT',
  '生成反对中小学校园霸凌 PPT',
  '制作一份关于 AI 技术分别在不同领域的积极运用及典型案例的总结 PPT',
]

// ─── 工具函数 ──────────────────────────────────
function tryFormatJson(raw: string): string {
  try { return JSON.stringify(JSON.parse(raw.trim()), null, 2) } catch { return raw }
}
function toolDisplayName(toolName: string): string {
  return toolName.replace(/^chatppt-/, '')
}
function formatRelativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

// ─── 子组件 ────────────────────────────────────
function ToolCallStart({ msg }: { msg: ChatMessage }) {
  const [collapsed, setCollapsed] = useState(true)
  if (!msg?.function_call) return null
  const formatted = msg.function_call.arguments ? tryFormatJson(msg.function_call.arguments) : ''
  return (
    <div className="mcp-gaode-bubble mcp-gaode-bubble-tool mcp-gaode-bubble-tool-start">
      <div className="mcp-gaode-bubble-tool-header" onClick={() => setCollapsed(!collapsed)}>
        <ToolOutlined className="mcp-gaode-tool-icon" />
        <span className="mcp-gaode-tool-title">
          调用工具: <span className="mcp-gaode-tool-name-used">{toolDisplayName(msg.function_call.name ?? '')}</span>
        </span>
      </div>
      {msg.function_call.arguments && !collapsed && (
        <div className="mcp-gaode-bubble-tool-body"><pre className="mcp-gaode-json-block">{formatted}</pre></div>
      )}
    </div>
  )
}

function ToolCallResult({ msg }: { msg: ChatMessage }) {
  const [collapsed, setCollapsed] = useState(true)
  if (!msg || msg.role !== 'function') return null
  const formatted = msg.content ? tryFormatJson(msg.content) : ''
  return (
    <div className="mcp-gaode-bubble mcp-gaode-bubble-tool mcp-gaode-bubble-tool-result">
      <div className="mcp-gaode-bubble-tool-header" onClick={() => setCollapsed(!collapsed)}>
        <ToolOutlined className="mcp-gaode-tool-icon" />
        <span className="mcp-gaode-tool-title">
          返回结果: <span className="mcp-gaode-tool-name-used">{toolDisplayName(msg.name ?? '')}</span>
        </span>
      </div>
      {msg.content && !collapsed && (
        <div className="mcp-gaode-bubble-tool-body"><pre className="mcp-gaode-json-block">{formatted}</pre></div>
      )}
    </div>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (!msg?.role) return null
  if (msg.role === 'user') return (
    <div className="mcp-gaode-bubble mcp-gaode-bubble-user">
      <div className="mcp-gaode-bubble-text">{msg.content || ''}</div>
    </div>
  )
  if (msg.role === 'assistant' && msg.function_call) return <ToolCallStart msg={msg} />
  if (msg.role === 'function') return <ToolCallResult msg={msg} />
  if (msg.role === 'assistant' && msg.content) {
    return (
      <div className="mcp-gaode-bubble mcp-gaode-bubble-assistant">
        <div className="mcp-gaode-bubble-text markdown-body"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
      </div>
    )
  }
  return null
}

// ─── PPT 记录条目 ──────────────────────────────
function PptRecordItem({ record, onDelete }: { record: PptHistoryItem; onDelete?: (pptId: string) => void }) {
  const [downloading, setDownloading] = useState(false)
  const title = record.title || record.ppt_title || record.ppt_id.slice(0, 12) + '…'
  const createdAt = record.create_at || record.created_at || ''

  const handleDownloadRecord = async () => {
    setDownloading(true)
    try {
      const url = await getPptCdnDownloadUrl(record.ppt_id)
      window.open(url)
    } catch (e) {
      message.error((e as Error).message || '获取下载链接失败')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{
      border: '1px solid var(--ant-color-border)',
      borderRadius: 8,
      padding: '10px 12px',
      marginBottom: 8,
      background: 'var(--ant-color-bg-container)',
      fontSize: 12,
    }}>
      {/* 标题行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <FilePptOutlined style={{ color: '#f97316', fontSize: 13, flexShrink: 0 }} />
        <Tooltip title={title}>
          <span style={{ fontWeight: 600, fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ant-color-text)' }}>
            {title}
          </span>
        </Tooltip>
        {onDelete && (
          <Tooltip title="移出列表">
            <DeleteOutlined style={{ color: '#94a3b8', cursor: 'pointer', fontSize: 11 }} onClick={() => onDelete(record.ppt_id)} />
          </Tooltip>
        )}
      </div>

      {/* 状态行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: record.status === 2 ? 8 : 0 }}>
        {record.status === 1 && (
          <>
            <Tag icon={<SyncOutlined spin />} color="processing" style={{ margin: 0, fontSize: 10 }}>
              生成中 {record.progress > 0 ? `${record.progress}%` : ''}
            </Tag>
            {record.progress > 0 && <div style={{ flex: 1 }}><Progress percent={record.progress} size="small" showInfo={false} status="active" /></div>}
          </>
        )}
        {record.status === 2 && (
          <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0, fontSize: 10 }}>
            {record.page_count ? `${record.page_count} 页` : '就绪'}
          </Tag>
        )}
        {record.status === 3 && (
          <Tag icon={<CloseCircleOutlined />} color="error" style={{ margin: 0, fontSize: 10 }}>失败</Tag>
        )}
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 10, flexShrink: 0 }}>
          {createdAt ? formatRelativeTime(createdAt) : ''}
        </span>
      </div>

      {/* 操作按钮（仅就绪状态） */}
      {record.status === 2 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {record.preview_url && (
            <Button size="small" icon={<EyeOutlined />} style={{ fontSize: 11, height: 24 }}
              onClick={() => window.open(record.preview_url)}>
              预览
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />} style={{ fontSize: 11, height: 24 }}
            onClick={async () => {
              try { const { url } = await getPptEditorUrl(record.ppt_id); window.open(url) }
              catch (e) { message.error((e as Error).message || '获取编辑器链接失败') }
            }}>
            编辑
          </Button>
          <Button size="small" type="primary" icon={<DownloadOutlined />} style={{ fontSize: 11, height: 24 }}
            loading={downloading} onClick={handleDownloadRecord}>
            下载
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── 状态类型 ──────────────────────────────────
type AppStep = 'idle' | 'generating' | 'polling_ppt' | 'ppt_ready' | 'ppt_failed'
type PayStep = 'creating' | 'qrcode' | 'claiming' | 'polling_pay' | 'paid' | 'pay_failed'

// ─── 主组件 ────────────────────────────────────
export interface MCPPptProps {
  inputTopSlot?: React.ReactNode
}

export default function MCPPpt(props: MCPPptProps = {}) {
  const { inputTopSlot } = props
  const [info, setInfo] = useState<PptAgentInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  // PPT 生成状态（当前会话）
  const [appStep, setAppStep] = useState<AppStep>('idle')
  const [pptId, setPptId] = useState<string | null>(null)
  const [pptProgress, setPptProgress] = useState(0)
  const [pptStateDesc, setPptStateDesc] = useState('')
  const [pptData, setPptData] = useState<PptStatusData | null>(null)

  // 支付状态
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payStep, setPayStep] = useState<PayStep>('qrcode')
  const [outTradeNo, setOutTradeNo] = useState<string | null>(null)
  const [orderAmount, setOrderAmount] = useState(1.5)
  const activePptIdRef = useRef<string | null>(null)  // 防止支付轮询闭包问题

  // PPT 历史记录（来自服务端）
  const [records, setRecords] = useState<PptHistoryItem[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pptPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const payPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 从服务端拉取历史记录
  const fetchHistory = useCallback(async () => {
    setLoadingRecords(true)
    try {
      const { items } = await getPptHistory(1, 50)
      setRecords(Array.isArray(items) ? items : [])
    } catch { /* 静默失败 */ } finally {
      setLoadingRecords(false)
    }
  }, [])

  // 挂载时加载历史记录
  useEffect(() => { fetchHistory() }, [fetchHistory])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchPptAgentInfo()
      .then((data) => { if (!cancelled) setInfo(data) })
      .catch((e) => { if (!cancelled) message.error((e as Error).message || '获取助手信息失败') })
      .finally(() => { if (!cancelled) setLoadingInfo(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, sending, appStep, scrollToBottom])

  useEffect(() => {
    return () => {
      if (pptPollRef.current) clearInterval(pptPollRef.current)
      if (payPollRef.current) clearInterval(payPollRef.current)
    }
  }, [])

  const usedPlugins = useMemo(() => {
    const used = new Set<string>()
    messages.forEach((msg) => {
      if (msg.role === 'assistant' && msg.function_call?.name) used.add(msg.function_call.name)
      if (msg.role === 'function' && msg.name) used.add(msg.name)
    })
    return used
  }, [messages])

  // ── PPT 生成进度轮询 ──────────────────────────
  const startPptPolling = useCallback((id: string) => {
    if (pptPollRef.current) clearInterval(pptPollRef.current)
    pptPollRef.current = setInterval(async () => {
      try {
        const status = await getPptStatus(id)
        setPptProgress(status.progress ?? 0)
        setPptStateDesc(status.state_description ?? '')
        fetchHistory()  // 每次轮询都同步侧栏进度
        if (status.status === 2) {
          clearInterval(pptPollRef.current!)
          pptPollRef.current = null
          setPptData(status)
          setAppStep('ppt_ready')
        } else if (status.status === 3) {
          clearInterval(pptPollRef.current!)
          pptPollRef.current = null
          setAppStep('ppt_failed')
          message.error('PPT 生成失败，请重试')
        }
      } catch { /* 网络波动忽略 */ }
    }, 5000)
  }, [fetchHistory])

  // ── 发送消息 ──────────────────────────────────
  const sendMessage = useCallback(async (content: string) => {
    const text = (content || input).trim()
    if (!text || sending) return
    if (info?.config_required) { message.warning('请先配置 ChatPPT MCP 后再使用'); return }

    if (pptPollRef.current) { clearInterval(pptPollRef.current); pptPollRef.current = null }
    setPptId(null)
    setPptProgress(0)
    setPptStateDesc('')
    setPptData(null)
    setAppStep('generating')

    const userMsg: ChatMessage = { role: 'user', content: text }
    const nextHistory = [...history, userMsg]
    setHistory(nextHistory)
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const data = await pptChat(nextHistory)
      const finalMsg: ChatMessage = { role: 'assistant', content: data.final_answer }
      setMessages((prev) => {
        let idx = prev.length - 1
        while (idx >= 0 && prev[idx].role !== 'user') idx--
        return idx >= 0
          ? [...prev.slice(0, idx + 1), finalMsg]
          : [...prev, finalMsg]
      })
      setHistory(Array.isArray(data.history) ? data.history : [...nextHistory, finalMsg])

      const id = extractPptIdFromSteps(data.steps) || extractPptIdFromText(data.final_answer)
      if (id) {
        setPptId(id)
        activePptIdRef.current = id
        setAppStep('polling_ppt')
        fetchHistory()  // 立即刷新一次，后端已写入记录
        startPptPolling(id)
      } else {
        setAppStep('idle')
      }
    } catch (e) {
      const errMsg = (e as Error).message || '发送失败'
      message.error(errMsg)
      setMessages((prev) => [...prev, { role: 'assistant', content: `错误: ${errMsg}` }])
      setAppStep('idle')
    } finally {
      setSending(false)
    }
  }, [history, input, sending, info?.config_required, startPptPolling, fetchHistory])

  // ── 支付轮询 ──────────────────────────────────
  const startPayPolling = useCallback((tradeNo: string) => {
    if (payPollRef.current) clearInterval(payPollRef.current)
    payPollRef.current = setInterval(async () => {
      try {
        const status = await getPaymentStatus(tradeNo)
        if (status.paid || status.status === 2) {
          clearInterval(payPollRef.current!)
          payPollRef.current = null
          setPayStep('paid')
        } else if (status.status === 3) {
          clearInterval(payPollRef.current!)
          payPollRef.current = null
          setPayStep('pay_failed')
          message.error('订单已关闭，请联系客服')
        }
      } catch { /* 忽略 */ }
    }, 5000)
  }, [])

  // ── 发起支付（当前会话 PPT）─────────────────
  const handleDownload = useCallback(async (targetPptId?: string) => {
    const id = targetPptId ?? pptId
    if (!id) return
    if (targetPptId && targetPptId !== pptId) {
      setPptId(targetPptId)
      activePptIdRef.current = targetPptId
    }
    setPayStep('creating')
    setPayModalOpen(true)
    try {
      const order = await createPaymentOrder(id)
      setOutTradeNo(order.out_trade_no)
      setOrderAmount(order.amount)
      setPayStep('qrcode')
    } catch (e) {
      message.error((e as Error).message || '创建订单失败')
      setPayModalOpen(false)
      setPayStep('qrcode')
    }
  }, [pptId])

  const handleClaimPayment = useCallback(async () => {
    if (!outTradeNo) return
    setPayStep('claiming')
    try {
      await claimPayment(outTradeNo)
      setPayStep('polling_pay')
      startPayPolling(outTradeNo)
    } catch (e) {
      message.error((e as Error).message || '申报失败')
      setPayStep('qrcode')
    }
  }, [outTradeNo, pptId, startPayPolling])

  const handleActualDownload = useCallback(async (targetId?: string, tradeNo?: string) => {
    const id = targetId ?? pptId
    const trade = tradeNo ?? outTradeNo
    if (!id) return
    try {
      const url = await getPptCdnDownloadUrl(id)
      window.open(url)
    } catch {
      if (trade) { window.location.href = `/api/ai/mcp-ppt/download?ppt_id=${encodeURIComponent(id)}&out_trade_no=${encodeURIComponent(trade)}` }
      else { message.error('获取下载链接失败，请重试'); return }
    }
    setPayModalOpen(false)
  }, [pptId, outTradeNo])

  const closePayModal = useCallback(() => {
    setPayModalOpen(false)
    if (payPollRef.current) { clearInterval(payPollRef.current); payPollRef.current = null }
  }, [])

  if (loadingInfo) {
    return <div className="mcp-gaode-loading"><Spin size="large" tip="加载助手信息…" /></div>
  }

  return (
    <ErrorBoundary>
      <div className="mcp-gaode">
        {/* 左侧侧栏 */}
        <aside className="mcp-gaode-sidebar">
          <div className="mcp-gaode-sidebar-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div
                className="mcp-gaode-logo"
                style={{ width: 44, height: 44, fontSize: 22, marginBottom: 0, flexShrink: 0 }}
              >
                📊
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 className="mcp-gaode-title" style={{ fontSize: 15, margin: '0 0 4px 0' }}>
                  {info?.name ?? 'PPT 汇报助手'}
                </h1>
                <Tag color="purple" style={{ margin: 0 }}>汇报助手</Tag>
              </div>
            </div>
            <p className="mcp-gaode-desc">{info?.description ?? '根据主题或文档生成、编辑与下载 PPT'}</p>
            {info?.config_required && (
              <Alert type="warning" showIcon message="未配置"
                description={info?.config_hint ?? '请设置 CHATPPT_MCP_HTTP_URL 或 CHATPPT_API_KEY'}
                style={{ marginTop: 12 }} />
            )}
          </div>

          {/* 插件 */}
          {(info?.plugins ?? []).length > 0 && (
            <div className="mcp-gaode-sidebar-card">
              <h2 className="mcp-gaode-sidebar-heading">插件</h2>
              <div className="mcp-gaode-plugins">
                {(info?.plugins ?? []).map((p) => (
                  <span key={p} className={`mcp-gaode-plugin-tag ${usedPlugins.has(p) ? 'mcp-gaode-plugin-tag-used' : ''}`}>
                    {toolDisplayName(p)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 生成记录（来自服务端） */}
          <div className="mcp-gaode-sidebar-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h2 className="mcp-gaode-sidebar-heading" style={{ margin: 0 }}>生成记录</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {records.length > 0 && <Tag style={{ fontSize: 10, cursor: 'default' }}>{records.length}</Tag>}
                <Tooltip title="刷新">
                  <SyncOutlined
                    spin={loadingRecords}
                    style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}
                    onClick={fetchHistory}
                  />
                </Tooltip>
              </div>
            </div>
            {loadingRecords && records.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 16 }}><Spin size="small" /></div>
            ) : records.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ fontSize: 12 }}>暂无记录</span>} />
            ) : (
              records.map((record) => (
                <PptRecordItem key={record.ppt_id} record={record} />
              ))
            )}
          </div>
        </aside>

        {/* 右侧主区 */}
        <main className="mcp-gaode-main">
          <div className="mcp-gaode-messages">
            {messages.length === 0 && appStep === 'idle' && (
              <div className="mcp-gaode-empty">
                <div className="mcp-gaode-empty-row">
                  <FilePptOutlined className="mcp-gaode-empty-icon" />
                  <span className="mcp-gaode-empty-text">一句话生成汇报 PPT</span>
                </div>
                <p className="mcp-gaode-empty-hint">输入主题，AI 将自动调用工具生成、渲染并提供下载</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`mcp-gaode-row mcp-gaode-row-${msg.role}`}>
                <MessageBubble msg={msg} />
              </div>
            ))}

            {sending && (
              <div className="mcp-gaode-row mcp-gaode-row-assistant">
                <div className="mcp-gaode-bubble mcp-gaode-bubble-assistant mcp-gaode-typing">
                  <span className="mcp-gaode-typing-label">正在生成 PPT，请稍候…</span>
                  <span className="mcp-gaode-typing-dots"><i /><i /><i /></span>
                </div>
              </div>
            )}

            {appStep === 'polling_ppt' && (
              <div className="mcp-gaode-row mcp-gaode-row-assistant">
                <div className="mcp-gaode-bubble mcp-gaode-bubble-assistant" style={{ minWidth: 280, maxWidth: 400 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontWeight: 600 }}>
                    <LoadingOutlined style={{ color: 'var(--ds-primary)' }} />
                    渲染中…
                    <Tag color="processing">{pptProgress}%</Tag>
                  </div>
                  <Progress percent={pptProgress} status="active" size="small" />
                  {pptStateDesc && (
                    <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', marginTop: 6 }}>{pptStateDesc}</div>
                  )}
                </div>
              </div>
            )}

            {appStep === 'ppt_ready' && pptData && (
              <div className="mcp-gaode-row mcp-gaode-row-assistant">
                <div className="mcp-gaode-bubble mcp-gaode-bubble-assistant" style={{ minWidth: 280 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontWeight: 600, color: '#16a34a' }}>
                    <CheckCircleOutlined />
                    PPT 已生成
                    {pptData.page_count > 0 && <Tag color="success">{pptData.page_count} 页</Tag>}
                    {pptData.ppt_title && <span style={{ fontWeight: 400, fontSize: 13 }}>{pptData.ppt_title}</span>}
                  </div>
                  <Progress percent={100} status="success" size="small" style={{ marginBottom: 14 }} />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button icon={<EyeOutlined />} onClick={() => window.open(pptData.preview_url)} size="small">在线预览</Button>
                    <Button icon={<EditOutlined />} size="small"
                      onClick={async () => {
                        try { const { url } = await getPptEditorUrl(pptData.ppt_id); window.open(url) }
                        catch (e) { message.error((e as Error).message || '获取编辑器链接失败') }
                      }}>
                      在线编辑
                    </Button>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={() => handleDownload()} size="small">
                      下载 PPTX（¥1.5）
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {appStep === 'ppt_failed' && (
              <div className="mcp-gaode-row mcp-gaode-row-assistant">
                <div className="mcp-gaode-bubble mcp-gaode-bubble-assistant">
                  <Alert type="error" message="PPT 生成失败，请重新描述需求后再试" showIcon />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <AskInput
            value={input}
            onChange={setInput}
            onSend={() => sendMessage(input)}
            innerTopSlot={
              <>
                {inputTopSlot}
                {RECOMMENDED_PROMPTS.map((prompt) => (
                  <Tag
                    key={prompt}
                    style={{ cursor: sending || info?.config_required ? 'not-allowed' : 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0 }}
                    onClick={() => !sending && !info?.config_required && sendMessage(prompt)}
                  >
                    {prompt}
                  </Tag>
                ))}
              </>
            }
            placeholder="给 PPT 汇报助手 发送消息"
            loading={sending}
            disabled={!!info?.config_required}
            buttonText="提交"
          />
        </main>
      </div>

      {/* 支付弹窗 */}
      <Modal
        open={payModalOpen}
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><WechatOutlined style={{ color: '#07c160', fontSize: 18 }} />扫码支付</div>}
        footer={null}
        onCancel={closePayModal}
        width={340}
        centered
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          {payStep === 'creating' && <div style={{ padding: 32 }}><Spin tip="创建订单中…" /></div>}

          {payStep === 'qrcode' && (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#07c160', marginBottom: 16 }}>
                ¥{orderAmount.toFixed(2)}
              </div>
              <img src={getQrcodeUrl()} width={200} height={200} alt="微信收款码"
                style={{ border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
              {outTradeNo && (
                <div style={{ fontSize: 12, color: 'var(--ai-text-secondary)', marginBottom: 16 }}>
                  付款时请备注订单号后4位：
                  <strong style={{ color: 'var(--ai-text)' }}>{outTradeNo.slice(-4)}</strong>
                </div>
              )}
              <Button type="primary" block onClick={handleClaimPayment}>我已付款</Button>
            </>
          )}

          {(payStep === 'claiming' || payStep === 'polling_pay') && (
            <div style={{ padding: 32 }}>
              <Spin tip={payStep === 'claiming' ? '提交中…' : '确认中，请稍候（通常几分钟内）…'} size="large" />
            </div>
          )}

          {payStep === 'paid' && (
            <>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#16a34a', marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>支付已确认</div>
              <Button type="primary" icon={<DownloadOutlined />} size="large" block onClick={() => handleActualDownload()}>
                下载 PPTX
              </Button>
            </>
          )}

          {payStep === 'pay_failed' && (
            <Alert type="error" message="订单已关闭" description="请联系客服处理" showIcon />
          )}
        </div>
      </Modal>
    </ErrorBoundary>
  )
}
