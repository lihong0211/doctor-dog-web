import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Layout, Typography, Space, Tag, Spin } from 'antd'
import { motion, AnimatePresence } from 'framer-motion'
import { chat, type ChatMessage } from '../service/api'
import AskInput from '../components/AskInput'

const { Content } = Layout
const { Title } = Typography

const MODEL_OPTIONS = [
  { label: 'qwen3:1.7b', value: 'qwen3:1.7b' },
  { label: 'deepseek-r1:1.5b', value: 'deepseek-r1:1.5b' },
]

interface ChatProps {
  onModelChange?: (model: string) => void
}

export default function Chat({ onModelChange }: ChatProps) {
  const [message, setMessage] = useState('')
  const [model, setModel] = useState('qwen3:1.7b')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [thinking, setThinking] = useState('')
  const [streamingResponse, setStreamingResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesRef = useRef<ChatMessage[]>([])
  const streamedContentRef = useRef('')
  const doneHandledRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingResponse, thinking, loading])

  const handleModelChange = (v: string) => {
    setModel(v)
    onModelChange?.(v)
  }

  const handleSend = async () => {
    const prompt = message.trim()
    if (!prompt || loading) return

    setLoading(true)
    setThinking('')
    setStreamingResponse('')
    setMessage('')
    streamedContentRef.current = ''
    doneHandledRef.current = false

    const userMessage: ChatMessage = { role: 'user', content: prompt }
    setMessages((prev) => [...prev, userMessage])

    const history = messagesRef.current
    await chat(prompt, {
      model,
      messages: history,
      onChunk: ({ thinking: t, response: r, done }) => {
        if (t) setThinking((prev) => prev + t)
        if (r) {
          streamedContentRef.current += r
          setStreamingResponse(streamedContentRef.current)
        }
        if (done && !doneHandledRef.current) {
          doneHandledRef.current = true
          setMessages((prev) => [...prev, { role: 'assistant', content: streamedContentRef.current }])
          setThinking('')
          setStreamingResponse('')
          setLoading(false)
        }
      },
      onError: (err: Error) => {
        setMessages((prev) => [...prev, { role: 'assistant', content: `错误: ${err.message}` }])
        setThinking('')
        setStreamingResponse('')
        setLoading(false)
      },
    })
  }

  return (
    <Layout
      className="chat-layout"
      style={{
        height: '100%',
        minHeight: 400,
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      <div
        className="chat-header"
        style={{
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
        }}
      >
        <Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
          语言模型
        </Title>
        <Space align="center" wrap size={[8, 8]}>
          {MODEL_OPTIONS.map((opt) => (
            <Tag
              key={opt.value}
              color={model === opt.value ? 'blue' : 'default'}
              style={{ cursor: 'pointer', margin: 0 }}
              onClick={() => handleModelChange(opt.value)}
            >
              {opt.label}
            </Tag>
          ))}
        </Space>
      </div>

      <Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        <div
          className="chat-messages"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 24,
            scrollBehavior: 'smooth',
          }}
        >
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, x: m.role === 'user' ? 16 : -16 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 16,
                }}
              >
                <div
                  className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}
                  style={{
                    maxWidth: '78%',
                    padding: m.role === 'user' ? '12px 16px' : '14px 16px',
                    background:
                      m.role === 'user'
                        ? 'var(--ds-user-bubble)'
                        : 'var(--ds-bg-chat)',
                    borderRadius: 12,
                  }}
                >
                  {m.role === 'user' ? (
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--ds-text)', lineHeight: 1.6 }}>
                      {m.content}
                    </div>
                  ) : (
                    <div className="markdown-body" style={{ lineHeight: 1.65, color: 'var(--ds-text)' }}>
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {loading && !thinking && !streamingResponse && (
              <motion.div
                key="loading-indicator"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    maxWidth: '78%',
                    color: 'var(--ds-text-muted)',
                    fontSize: 14,
                    padding: '12px 16px',
                    background: 'var(--ds-user-bubble)',
                    borderRadius: 12,
                  }}
                >
                  <Spin size="small" tip="思考中" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {thinking && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  maxWidth: '78%',
                  color: 'var(--ds-text-muted)',
                  fontSize: 13,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                  padding: '8px 12px',
                  background: 'var(--ds-user-bubble)',
                  borderRadius: 8,
                }}
              >
                {thinking}
              </div>
            </div>
          )}
          {streamingResponse && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
              <div
                className="chat-bubble-assistant"
                style={{
                  maxWidth: '78%',
                  padding: '14px 16px',
                  background: 'var(--ds-bg-chat)',
                  borderRadius: 12,
                }}
              >
                <div
                  className="markdown-body"
                  style={{ lineHeight: 1.65, color: 'var(--ds-text)' }}
                >
                  <ReactMarkdown>{streamingResponse}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <AskInput
          value={message}
          onChange={setMessage}
          onSend={handleSend}
          placeholder={`给 ${model} 发送消息`}
          loading={loading}
          maxRows={3}
        />
      </Content>
    </Layout>
  )
}
