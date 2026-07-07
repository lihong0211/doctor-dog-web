import { useState, useEffect, useRef, useCallback, useMemo, Component, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { message, Spin, Tag } from 'antd'
import { ThunderboltOutlined, ToolOutlined } from '@ant-design/icons'
import {
  fetchFunctionCallingInfo,
  functionCallingChat,
  type FunctionCallingInfo,
  type FunctionCallingTool,
  type ChatMessage,
} from '../service/function-calling'
import './MCP/McpGaode.css'
import AskInput from '../components/AskInput'

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
    console.error('[Function Call Error]', error)
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

const RECOMMENDED_PROMPTS = [
  '北京今天天气怎么样',
  '上海明天天气如何',
  '深圳现在多少度',
  '杭州会下雨吗',
  '广州未来三天天气预报',
]

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

function ToolCallStart({ msg }: { msg: ChatMessage }) {
  const [collapsed, setCollapsed] = useState(true)
  if (!msg?.function_call) return null
  const args = msg.function_call.arguments ?? ''
  const formatted = args ? tryFormatJson(args) : ''
  const displayName = msg.function_call.name ?? ''

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

function ToolCallResult({ msg }: { msg: ChatMessage }) {
  const [collapsed, setCollapsed] = useState(true)
  if (!msg || msg.role !== 'function') return null
  const content = msg.content ?? ''
  const formatted = content ? tryFormatJson(content) : ''
  const displayName = msg.name ?? ''

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

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (!msg?.role) return null

  if (msg.role === 'user') {
    return (
      <div className="mcp-gaode-bubble mcp-gaode-bubble-user">
        <div className="mcp-gaode-bubble-text">{msg.content || ''}</div>
      </div>
    )
  }

  if (msg.role === 'assistant' && msg.function_call) {
    return <ToolCallStart msg={msg} />
  }

  if (msg.role === 'function') {
    return <ToolCallResult msg={msg} />
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

function ToolCard({ tool, used }: { tool: FunctionCallingTool; used: boolean }) {
  const [collapsed, setCollapsed] = useState(false)
  const paramsStr = tool.parameters
    ? JSON.stringify(tool.parameters, null, 2)
    : ''

  return (
    <div style={{ marginBottom: 12 }}>
      <span className={`mcp-gaode-plugin-tag ${used ? 'mcp-gaode-plugin-tag-used' : ''}`}>{tool.name}</span>
      <p style={{ fontSize: 12, color: 'var(--ds-text-muted)', margin: '6px 0 0 0', lineHeight: 1.4 }}>
        {tool.description}
      </p>
      {paramsStr && (
        <>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 11, marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            {collapsed ? '展开 parameters' : '收起 parameters'}
          </button>
          {!collapsed && (
            <pre className="mcp-gaode-json-block" style={{ fontSize: 11, marginTop: 6 }}>{paramsStr}</pre>
          )}
        </>
      )}
    </div>
  )
}

export default function FunctionCall() {
  const [info, setInfo] = useState<FunctionCallingInfo | null>(null)
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
    fetchFunctionCallingInfo()
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
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, sending, scrollToBottom])

  const usedToolNames = useMemo(() => {
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

      const userMsg: ChatMessage = { role: 'user', content: text }
      const nextHistory: ChatMessage[] = [...history, userMsg]
      setHistory(nextHistory)
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setSending(true)

      try {
        const res = await functionCallingChat({ messages: nextHistory })
        // 后端可能直接返回 data 为最终回复字符串（如 "北京今天的天气是晴天..."）
        if (typeof res === 'string') {
          const newHistory: ChatMessage[] = [...nextHistory, { role: 'assistant', content: res }]
          setHistory(newHistory)
          setMessages(newHistory)
          return
        }
        if (res.error) {
          message.error(res.error)
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `错误: ${res.error}`, name: undefined },
          ])
          return
        }
        const newHistory = res.history ?? (res.final_answer
          ? [...nextHistory, { role: 'assistant', content: res.final_answer }]
          : nextHistory)
        setHistory(newHistory)
        setMessages(newHistory)
      } catch (e) {
        message.error((e as Error).message || '发送失败')
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `错误: ${(e as Error).message}`, name: undefined },
        ])
      } finally {
        setSending(false)
      }
    },
    [history, input, sending]
  )

  if (loadingInfo) {
    return (
      <div className="mcp-gaode-loading">
        <Spin size="large" tip="加载助手信息…" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="mcp-gaode">
        <aside className="mcp-gaode-sidebar">
          <div className="mcp-gaode-sidebar-card">
            <h1 className="mcp-gaode-title">{info?.name ?? 'Function Calling'}</h1>
            <p className="mcp-gaode-desc">
              {info?.description ?? 'DashScope 多轮对话 + 本地执行工具（当前内置天气 get_current_weather）'}
            </p>
          </div>

          <div className="mcp-gaode-sidebar-card">
            <h2 className="mcp-gaode-sidebar-heading">工具列表</h2>
            <div className="mcp-gaode-plugins" style={{ flexDirection: 'column', gap: 12 }}>
              {(info?.tools ?? []).length === 0 ? (
                <span className="mcp-gaode-plugin-tag">暂无工具</span>
              ) : (
                (info?.tools ?? []).map((tool) => (
                  <ToolCard key={tool.name} tool={tool} used={usedToolNames.has(tool.name)} />
                ))
              )}
            </div>
          </div>

        </aside>

        <main className="mcp-gaode-main">
          <div className="mcp-gaode-messages">
            {messages.length === 0 && (
              <div className="mcp-gaode-empty">
                <div className="mcp-gaode-empty-row">
                  <ThunderboltOutlined className="mcp-gaode-empty-icon" />
                  <span className="mcp-gaode-empty-text">今天有什么可以帮到你</span>
                </div>
                <p className="mcp-gaode-empty-hint">我可以帮你查天气</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`mcp-gaode-row mcp-gaode-row-${msg.role}`}>
                <MessageBubble msg={msg} />
              </div>
            ))}
            {sending && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
              <div className="mcp-gaode-row mcp-gaode-row-assistant">
                <div className="mcp-gaode-bubble mcp-gaode-bubble-assistant mcp-gaode-typing">
                  <span className="mcp-gaode-typing-label">正在调用工具并生成回复</span>
                  <span className="mcp-gaode-typing-dots">
                    <i /><i /><i />
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
              RECOMMENDED_PROMPTS.map((prompt) => (
                <Tag
                  key={prompt}
                  style={{ cursor: sending ? 'not-allowed' : 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0 }}
                  onClick={() => !sending && sendMessage(prompt)}
                >
                  {prompt}
                </Tag>
              ))
            }
            placeholder="发送消息（如：北京今天天气怎么样）"
            loading={sending}
            buttonText="提交"
          />
        </main>
      </div>
    </ErrorBoundary>
  )
}
