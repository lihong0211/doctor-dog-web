import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Layout, Typography, Image, Spin } from 'antd'
import { PictureOutlined } from '@ant-design/icons'
import { ocr, type ChatMessage } from '../service/api'

const { Content } = Layout
const { Title } = Typography

/** 前端展示用：带图片预览 URL */
type DisplayMessage = ChatMessage & { imagePreview?: string }

/** 将 File 转为纯 base64 字符串（不含 data URL 前缀） */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
      resolve(base64 || '')
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const DEFAULT_PROMPT = '请识别图中的文字'

export default function OCR() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [thinking, setThinking] = useState('')
  const [streamingResponse, setStreamingResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamedContentRef = useRef('')
  const doneHandledRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingResponse, thinking, loading])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/') || loading) return
    e.target.value = ''
    const preview = URL.createObjectURL(file)
    fileToBase64(file).then((base64) => {
      const userMessage: DisplayMessage = {
        role: 'user',
        content: DEFAULT_PROMPT,
        images: [''],
        imagePreview: preview,
      }
      setMessages((prev) => [...prev, userMessage])
      setLoading(true)
      setThinking('')
      setStreamingResponse('')
      streamedContentRef.current = ''
      doneHandledRef.current = false
      ocr({
        images: [base64],
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
          OCR
        </Title>
        <span style={{ color: 'var(--ds-text-muted)', fontSize: 14, fontWeight: 500 }}>
          deepseek-ocr
        </span>
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
          {messages.map((m, i) => (
            <div
              key={i}
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
                    m.role === 'user' ? 'var(--ds-user-bubble)' : 'var(--ds-bg-chat)',
                  borderRadius: 12,
                }}
              >
                {m.role === 'user' && m.imagePreview ? (
                  <Image
                    src={m.imagePreview}
                    alt=""
                    style={{ maxWidth: 280, maxHeight: 280, borderRadius: 8 }}
                  />
                ) : m.role === 'assistant' ? (
                  <div className="markdown-body" style={{ lineHeight: 1.65, color: 'var(--ds-text)' }}>
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {loading && !thinking && !streamingResponse && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
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
                <Spin size="small" tip="识别中" />
              </div>
            </div>
          )}
          {thinking && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
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

        <div
          className="chat-input-wrap"
          style={{
            padding: '16px 24px 24px',
            background: 'transparent',
            flexShrink: 0,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => !loading && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !loading) {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
            style={{
              borderRadius: 12,
              padding: '12px 14px',
              background: 'var(--ds-bg)',
              border: 'none',
              boxShadow: 'none',
              minHeight: 116,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background 0.2s',
            }}
            className="ocr-upload-zone"
            title="点击上传图片，识别图中文字"
          >
            <PictureOutlined style={{ fontSize: 28, color: 'var(--ds-primary)' }} />
            <span style={{ fontSize: 14, color: 'var(--ds-text-muted)' }}>
              点击上传图片，识别图中文字 · 支持 JPG、PNG
            </span>
          </div>
        </div>
      </Content>
    </Layout>
  )
}
