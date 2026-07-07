import { useState, useEffect, useRef, useCallback, useMemo, Component, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { message, Spin, Tag } from 'antd'
import { EnvironmentOutlined, ToolOutlined } from '@ant-design/icons'
import {
  fetchAgentInfo,
  chatStream,
  type GaodeAgentInfo,
  type ChatMessage,
  type ChatResponse,
} from '../../service/mcp-gaode'
import './MCPGaode.css'
import AskInput from '../../components/AskInput'

/** 错误边界：捕获渲染错误 */
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[MCPGaode Error]', error)
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
  "帮我规划上海一日游行程，主要想去外滩和迪士尼",
  "从浦东机场到外滩怎么走最方便？",
  "推荐上海三个适合拍照的网红景点",
  "从徐家汇到外滩有哪些公交路线？",
  "上海野生动物园到迪士尼乐园怎么走？",
]

/** 尝试格式化 JSON 字符串 */
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

/** 工具调用开始 */
function ToolCallStart({ msg }: { msg: ChatMessage }) {
  const [collapsed, setCollapsed] = useState(true)
  if (!msg || !msg.function_call) return null
  const args = msg.function_call?.arguments ?? ''
  const formatted = args ? tryFormatJson(args) : ''
  const toolName = msg.function_call?.name ?? ''
  const displayName = toolName.replace(/^amap-maps-maps_/, '')

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

/** 工具调用返回 */
function ToolCallResult({ msg }: { msg: ChatMessage }) {
  const [collapsed, setCollapsed] = useState(true)
  if (!msg || msg.role !== 'function') return null
  const content = msg.content ?? ''
  const formatted = content ? tryFormatJson(content) : ''
  const toolName = msg.name ?? ''
  const displayName = toolName.replace(/^amap-maps-maps_/, '')

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

/** 单条消息气泡 */
function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (!msg || !msg.role) return null

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

export interface MCPGaodeProps {
  inputTopSlot?: ReactNode
}

export default function MCPGaode(props: MCPGaodeProps = {}) {
  const { inputTopSlot } = props
  const [info, setInfo] = useState<GaodeAgentInfo | null>(null)
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
    fetchAgentInfo()
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

  // 从消息中提取使用过的插件名称
  const usedPlugins = useMemo(() => {
    const used = new Set<string>()
    messages.forEach((msg) => {
      if (msg.role === 'assistant' && msg.function_call?.name) {
        used.add(msg.function_call.name)
      }
      if (msg.role === 'function' && msg.name) {
        used.add(msg.name)
      }
    })
    return used
  }, [messages])

  const sendMessage = useCallback(
    async (content: string) => {
      const text = (content || input).trim()
      if (!text || sending) return

      const userMsg: ChatMessage = { role: 'user', content: text }
      const nextHistory = [...history, userMsg]
      setHistory(nextHistory)
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setSending(true)

      try {
        await chatStream(nextHistory, {
          onStep: (stepMessages) => {
            try {
              if (!Array.isArray(stepMessages)) {
                console.warn('[onStep] stepMessages is not an array:', stepMessages)
                return
              }
              const validMessages = stepMessages.filter((m) => m && m.role && typeof m.role === 'string')
              if (validMessages.length === 0) return
              setMessages((prev) => {
                let lastUserIndex = -1
                for (let i = prev.length - 1; i >= 0; i--) {
                  if (prev[i] && prev[i].role === 'user') {
                    lastUserIndex = i
                    break
                  }
                }
                if (lastUserIndex >= 0) {
                  return [...prev.slice(0, lastUserIndex + 1), ...validMessages]
                }
                return [...prev, ...validMessages]
              })
            } catch (e) {
              console.error('[onStep error]', e, stepMessages)
            }
          },
          onDone: (data: ChatResponse) => {
            setHistory(data.history)
            if (data.reply_messages && data.reply_messages.length > 0) {
              const lastAssistantMsg = data.reply_messages[data.reply_messages.length - 1]
              if (lastAssistantMsg.role === 'assistant') {
                setMessages((prev) => {
                  let lastUserIndex = -1
                  for (let i = prev.length - 1; i >= 0; i--) {
                    if (prev[i] && prev[i].role === 'user') {
                      lastUserIndex = i
                      break
                    }
                  }
                  if (lastUserIndex >= 0) {
                    return [...prev.slice(0, lastUserIndex + 1), lastAssistantMsg]
                  }
                  return [...prev, lastAssistantMsg]
                })
              }
            }
          },
          onError: (errMsg) => {
            message.error(errMsg)
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: `错误: ${errMsg}`, name: null },
            ])
          },
        })
      } catch (e) {
        message.error((e as Error).message || '发送失败')
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `错误: ${(e as Error).message}`, name: null },
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div
              className="mcp-gaode-logo"
              style={{ width: 44, height: 44, fontSize: 22, marginBottom: 0, flexShrink: 0 }}
            >
              🗺️
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 className="mcp-gaode-title" style={{ fontSize: 15, margin: '0 0 4px 0' }}>
                {info?.name ?? '高德地图助手'}
              </h1>
              <Tag color="blue" style={{ margin: 0 }}>地图助手</Tag>
            </div>
          </div>
          <p className="mcp-gaode-desc">{info?.description ?? '地图查询与路线规划'}</p>
        </div>

        <div className="mcp-gaode-sidebar-card">
          <h2 className="mcp-gaode-sidebar-heading">插件</h2>
          <div className="mcp-gaode-plugins">
            {(info?.plugins ?? []).map((p) => {
              const isUsed = usedPlugins.has(p)
              return (
                <span
                  key={p}
                  className={`mcp-gaode-plugin-tag ${isUsed ? 'mcp-gaode-plugin-tag-used' : ''}`}
                >
                  {p.replace(/^amap-maps-maps_/, '')}
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
                <EnvironmentOutlined className="mcp-gaode-empty-icon" />
                <span className="mcp-gaode-empty-text">今天有什么可以帮到你？</span>
              </div>
              <p className="mcp-gaode-empty-hint">我可以帮你查天气、推荐景点、规划路线等</p>
            </div>
          )}
          {messages.map((msg, i) => {
            if (!msg || !msg.role) return null
            return (
              <div key={i} className={`mcp-gaode-row mcp-gaode-row-${msg.role}`}>
                <MessageBubble msg={msg} />
              </div>
            )
          })}
         
          {sending && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
            <div className="mcp-gaode-row mcp-gaode-row-assistant">
              <div className="mcp-gaode-bubble mcp-gaode-bubble-assistant mcp-gaode-typing">
                <span className="mcp-gaode-typing-label">请稍候，助手正在思考中</span>
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
            <>
              {inputTopSlot}
              {RECOMMENDED_PROMPTS.map((prompt) => (
                <Tag
                  key={prompt}
                  style={{ cursor: sending ? 'not-allowed' : 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0 }}
                  onClick={() => !sending && sendMessage(prompt)}
                >
                  {prompt}
                </Tag>
              ))}
            </>
          }
          placeholder="给 高德地图助手 发送消息"
          loading={sending}
          buttonText="提交"
        />
      </main>
    </div>
    </ErrorBoundary>
  )
}
