import { useState, useEffect, useRef, useCallback, useMemo, Component, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { message, Spin, Alert, Tag } from 'antd'
import { AudioOutlined, ToolOutlined } from '@ant-design/icons'
import {
  fetchSttAgentInfo,
  sttChatStream,
  type SttAgentInfo,
  type ChatMessage,
} from '../../service/mcp-stt'
import './MCPGaode.css'
import AskInput from '../../components/AskInput'

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
    console.error('[MCP STT Error]', error)
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
  '将这段语音转换为文字',
  '识别这段音频内容',
  '转写这段录音',
  '帮我识别这段语音',
  '提取音频中的文字内容',
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

function toolDisplayName(toolName: string): string {
  return toolName.replace(/^stt-/, '')
}

function ToolCallStart({ msg }: { msg: ChatMessage }) {
  const [collapsed, setCollapsed] = useState(true)
  if (!msg?.function_call) return null
  const args = msg.function_call.arguments ?? ''
  const formatted = args ? tryFormatJson(args) : ''
  const displayName = toolDisplayName(msg.function_call.name ?? '')

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
  const displayName = toolDisplayName(msg.name ?? '')

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

export default function MCPStt() {
  const [info, setInfo] = useState<SttAgentInfo | null>(null)
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
    fetchSttAgentInfo()
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
        message.warning('请先配置 STT MCP 后再使用')
        return
      }

      const userMsg: ChatMessage = { role: 'user', content: text }
      const nextHistory = [...history, userMsg]
      setHistory(nextHistory)
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setSending(true)

      try {
        const nextHistoryFromStream = await sttChatStream(nextHistory, {
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
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: `错误: ${errMsg}`, name: undefined },
            ])
          },
        })
        setHistory(nextHistoryFromStream)
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
    [history, input, sending, info?.config_required]
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div
                className="mcp-gaode-logo"
                style={{ width: 44, height: 44, fontSize: 22, marginBottom: 0, flexShrink: 0 }}
              >
                🎤
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 className="mcp-gaode-title" style={{ fontSize: 15, margin: '0 0 4px 0' }}>
                  {info?.name ?? 'STT 语音识别助手'}
                </h1>
                <Tag color="orange" style={{ margin: 0 }}>语音识别</Tag>
              </div>
            </div>
            <p className="mcp-gaode-desc">{info?.description ?? '将语音转换为文字，支持多种语言和音频格式'}</p>
            {info?.config_required && (
              <Alert
                type="warning"
                showIcon
                message="未配置"
                description={info?.config_hint ?? '请配置 STT MCP 相关参数'}
                style={{ marginTop: 12 }}
              />
            )}
          </div>

          <div className="mcp-gaode-sidebar-card">
            <h2 className="mcp-gaode-sidebar-heading">插件</h2>
            <div className="mcp-gaode-plugins">
              {(info?.plugins ?? []).length === 0 && !info?.config_required && (
                <span className="mcp-gaode-plugin-tag">暂无插件列表</span>
              )}
              {(info?.plugins ?? []).map((p) => {
                const isUsed = usedPlugins.has(p)
                return (
                  <span
                    key={p}
                    className={`mcp-gaode-plugin-tag ${isUsed ? 'mcp-gaode-plugin-tag-used' : ''}`}
                  >
                    {toolDisplayName(p)}
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
                  <AudioOutlined className="mcp-gaode-empty-icon" />
                  <span className="mcp-gaode-empty-text">语音转文字助手</span>
                </div>
                <p className="mcp-gaode-empty-hint">输入语音内容或问题，我会帮你转换为文字</p>
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
                  <span className="mcp-gaode-typing-label">正在识别语音，请稍候…</span>
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
                  style={{ cursor: sending || info?.config_required ? 'not-allowed' : 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0 }}
                  onClick={() => !sending && !info?.config_required && sendMessage(prompt)}
                >
                  {prompt}
                </Tag>
              ))
            }
            placeholder="给 STT 语音识别助手 发送消息"
            loading={sending}
            disabled={info?.config_required}
            buttonText="提交"
          />
        </main>
      </div>
    </ErrorBoundary>
  )
}
