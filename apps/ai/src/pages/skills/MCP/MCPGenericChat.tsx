import { useState, useEffect, useRef, useCallback, useMemo, Component, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { message, Spin, Alert, Tag } from 'antd'
import { ToolOutlined } from '@ant-design/icons'
import type { McpAgentService, McpAgentInfo, ChatMessage } from '../../../service/mcp-common'
import './MCPGaode.css'
import AskInput from '../../../components/AskInput'

/** 错误边界 */
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[MCP Generic Chat Error]', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mcp-gaode-loading">
          <div style={{ color: 'var(--ds-text-muted)' }}>渲染出错，请刷新页面</div>
        </div>
      )
    }
    return this.props.children
  }
}

function tryFormatJson(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return raw
  try {
    const parsed = JSON.parse(trimmed)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return raw
  }
}

function ToolCallStart({ msg, toolPrefix }: { msg: ChatMessage; toolPrefix: string }) {
  const [collapsed, setCollapsed] = useState(true)
  if (!msg?.function_call) return null
  const args = msg.function_call.arguments ?? ''
  const formatted = args ? tryFormatJson(args) : ''
  const displayName = (msg.function_call.name ?? '').replace(new RegExp(`^${toolPrefix}-`), '')

  return (
    <div className="mcp-gaode-bubble mcp-gaode-bubble-tool mcp-gaode-bubble-tool-start">
      <div className="mcp-gaode-bubble-tool-header" onClick={() => setCollapsed(!collapsed)}>
        <ToolOutlined className="mcp-gaode-tool-icon" />
        <span className="mcp-gaode-tool-title">
          调用工具: <span className="mcp-gaode-tool-name-used">{displayName}</span>
        </span>
      </div>
      {args && !collapsed && (
        <div className="mcp-gaode-bubble-tool-body">
          <pre className="mcp-gaode-json-block">{formatted}</pre>
        </div>
      )}
    </div>
  )
}

function ToolCallResult({ msg, toolPrefix }: { msg: ChatMessage; toolPrefix: string }) {
  const [collapsed, setCollapsed] = useState(true)
  if (!msg || msg.role !== 'function') return null
  const content = msg.content ?? ''
  const formatted = content ? tryFormatJson(content) : ''
  const displayName = (msg.name ?? '').replace(new RegExp(`^${toolPrefix}-`), '')

  return (
    <div className="mcp-gaode-bubble mcp-gaode-bubble-tool mcp-gaode-bubble-tool-result">
      <div className="mcp-gaode-bubble-tool-header" onClick={() => setCollapsed(!collapsed)}>
        <ToolOutlined className="mcp-gaode-tool-icon" />
        <span className="mcp-gaode-tool-title">
          返回结果: <span className="mcp-gaode-tool-name-used">{displayName}</span>
        </span>
      </div>
      {content && !collapsed && (
        <div className="mcp-gaode-bubble-tool-body">
          <pre className="mcp-gaode-json-block">{formatted}</pre>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ msg, toolPrefix }: { msg: ChatMessage; toolPrefix: string }) {
  if (!msg?.role) return null

  if (msg.role === 'user') {
    return (
      <div className="mcp-gaode-bubble mcp-gaode-bubble-user">
        <div className="mcp-gaode-bubble-text">{msg.content || ''}</div>
      </div>
    )
  }

  if (msg.role === 'assistant' && msg.function_call) {
    return <ToolCallStart msg={msg} toolPrefix={toolPrefix} />
  }

  if (msg.role === 'function') {
    return <ToolCallResult msg={msg} toolPrefix={toolPrefix} />
  }

  if (msg.role === 'assistant' && msg.content) {
    const content = msg.content || ''
    const isHtmlContent = content.includes('<details>') || content.includes('<summary>')
    return (
      <div className="mcp-gaode-bubble mcp-gaode-bubble-assistant">
        {isHtmlContent ? (
          <div className="mcp-gaode-bubble-text markdown-body" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className="mcp-gaode-bubble-text markdown-body">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    )
  }

  return null
}

export interface MCPGenericChatProps {
  /** 该助手的 `/ai/mcp-xxx` service（createMcpAgentService 生成） */
  service: McpAgentService
  /** MCP server_key，与后端 mcp_*.py 里的 server_key 一致，用于剥离工具名前缀（如 "stock-search_stock" -> "search_stock"） */
  toolPrefix: string
  icon: ReactNode
  tagLabel: string
  tagColor: string
  fallbackName: string
  fallbackDescription: string
  emptyIcon: ReactNode
  emptyText: string
  emptyHint: string
  recommendedPrompts: string[]
  typingLabel: string
  inputTopSlot?: ReactNode
}

export default function MCPGenericChat(props: MCPGenericChatProps) {
  const {
    service,
    toolPrefix,
    icon,
    tagLabel,
    tagColor,
    fallbackName,
    fallbackDescription,
    emptyIcon,
    emptyText,
    emptyHint,
    recommendedPrompts,
    typingLabel,
    inputTopSlot,
  } = props

  const [info, setInfo] = useState<McpAgentInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingInfo(true)
    service
      .fetchAgentInfo()
      .then((data) => {
        if (!cancelled) setInfo(data)
      })
      .catch((e) => {
        if (!cancelled) message.error((e as Error).message || '获取助手信息失败')
      })
      .finally(() => {
        if (!cancelled) setLoadingInfo(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, sending, scrollToBottom])

  const usedPlugins = useMemo(() => {
    const used = new Set<string>()
    messages.forEach((msg) => {
      if (msg.role === 'assistant' && msg.function_call?.name) used.add(msg.function_call.name)
      if (msg.role === 'function' && msg.name) used.add(msg.name)
    })
    return used
  }, [messages])

  const sendMessage = useCallback(
    async (content: string) => {
      const text = (content || input).trim()
      if (!text || sending) return
      if (info?.config_required) {
        message.warning('请先完成配置后再使用')
        return
      }

      const userMsg: ChatMessage = { role: 'user', content: text }
      const nextHistory = [...history, userMsg]
      setHistory(nextHistory)
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setSending(true)

      try {
        const nextHistoryFromStream = await service.chatStream(nextHistory, {
          onStep: (stepMessages) => {
            if (!Array.isArray(stepMessages) || stepMessages.length === 0) return
            const validMessages = stepMessages.filter((m) => m && m.role && typeof m.role === 'string')
            if (validMessages.length === 0) return
            setMessages((prev) => {
              let lastUserIndex = -1
              for (let i = prev.length - 1; i >= 0; i--) {
                if (prev[i]?.role === 'user') {
                  lastUserIndex = i
                  break
                }
              }
              if (lastUserIndex >= 0) {
                return [...prev.slice(0, lastUserIndex + 1), ...validMessages]
              }
              return [...prev, ...validMessages]
            })
          },
          onError: (errMsg) => {
            message.error(errMsg)
            setMessages((prev) => [...prev, { role: 'assistant', content: `错误: ${errMsg}`, name: undefined }])
          },
        })
        setHistory(nextHistoryFromStream)
      } catch (e) {
        message.error((e as Error).message || '发送失败')
        setMessages((prev) => [...prev, { role: 'assistant', content: `错误: ${(e as Error).message}`, name: undefined }])
      } finally {
        setSending(false)
      }
    },
    [history, input, sending, info?.config_required, service]
  )

  if (loadingInfo) {
    return (
      <div className="mcp-gaode-loading">
        <Spin size="large" tip="加载助手信息…" />
      </div>
    )
  }

  const agentName = info?.name ?? fallbackName

  return (
    <ErrorBoundary>
      <div className="mcp-gaode">
        <aside className="mcp-gaode-sidebar">
          <div className="mcp-gaode-sidebar-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div
                className="mcp-gaode-logo"
                style={{ width: 44, height: 44, fontSize: 22, marginBottom: 0, flexShrink: 0 }}
              >
                {icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 className="mcp-gaode-title" style={{ fontSize: 15, margin: '0 0 4px 0' }}>
                  {agentName}
                </h1>
                <Tag color={tagColor} style={{ margin: 0 }}>
                  {tagLabel}
                </Tag>
              </div>
            </div>
            <p className="mcp-gaode-desc">{info?.description ?? fallbackDescription}</p>
            {info?.config_required && (
              <Alert
                type="warning"
                showIcon
                message="未配置"
                description={info?.config_hint ?? '该服务尚未正确配置'}
                style={{ marginTop: 12 }}
              />
            )}
          </div>

          <div className="mcp-gaode-sidebar-card">
            <h2 className="mcp-gaode-sidebar-heading">工具</h2>
            <div className="mcp-gaode-plugins">
              {(info?.plugins ?? []).length === 0 && !info?.config_required && (
                <span className="mcp-gaode-plugin-tag">暂无工具列表</span>
              )}
              {(info?.plugins ?? []).map((p) => {
                const isUsed = usedPlugins.has(p)
                const displayName = p.replace(new RegExp(`^${toolPrefix}-`), '')
                return (
                  <span key={p} className={`mcp-gaode-plugin-tag ${isUsed ? 'mcp-gaode-plugin-tag-used' : ''}`}>
                    {displayName}
                  </span>
                )
              })}
            </div>
          </div>
        </aside>

        <main className="mcp-gaode-main">
          <div className="mcp-gaode-messages">
            {messages.length === 0 && (
              <div className="mcp-gaode-empty">
                <div className="mcp-gaode-empty-row">
                  {emptyIcon}
                  <span className="mcp-gaode-empty-text">{emptyText}</span>
                </div>
                <p className="mcp-gaode-empty-hint">{emptyHint}</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`mcp-gaode-row mcp-gaode-row-${msg.role}`}>
                <MessageBubble msg={msg} toolPrefix={toolPrefix} />
              </div>
            ))}
            {sending && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
              <div className="mcp-gaode-row mcp-gaode-row-assistant">
                <div className="mcp-gaode-bubble mcp-gaode-bubble-assistant mcp-gaode-typing">
                  <span className="mcp-gaode-typing-label">{typingLabel}</span>
                  <span className="mcp-gaode-typing-dots">
                    <i />
                    <i />
                    <i />
                  </span>
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
                {recommendedPrompts.map((prompt) => (
                  <Tag
                    key={prompt}
                    style={{
                      cursor: sending || info?.config_required ? 'not-allowed' : 'pointer',
                      borderRadius: 12,
                      padding: '2px 10px',
                      fontSize: 12,
                      margin: 0,
                    }}
                    onClick={() => !sending && !info?.config_required && sendMessage(prompt)}
                  >
                    {prompt}
                  </Tag>
                ))}
              </>
            }
            placeholder={`给 ${agentName} 发送消息`}
            loading={sending}
            disabled={info?.config_required}
            buttonText="提交"
          />
        </main>
      </div>
    </ErrorBoundary>
  )
}
