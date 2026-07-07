import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Layout, Typography, Input, Button, Tag, Space, Collapse, Drawer, message } from 'antd'
import { SendOutlined, DownloadOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons'
import { imageGenerate } from '../service/image'

const { Content } = Layout
const { Title } = Typography
const { TextArea } = Input

const MD_URLS = ['docs/code-1.md', 'docs/code-2.md'].map(
  (p) => `${import.meta.env.BASE_URL}${p}`,
)
const MD_LABELS = ['Qwen-Image-2512', 'Stable Diffusion'] as const

const MODEL_OPTIONS = [
  {
    label: 'Qwen-Image-2512 + Wuli-Art Turbo LoRA',
    value: 'qwen-wuli',
  },
  { label: 'Stable Diffusion XL Base 1.0', value: 'sdxl' },
] as const

export default function ImageGenerate() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0].value)
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mdContents, setMdContents] = useState<[string | null, string | null]>([null, null])
  const [codeDrawerOpen, setCodeDrawerOpen] = useState(false)
  const objectUrlRef = useRef<string | null>(null)

  const extractPythonCode = (md: string): string => {
    const match = md.match(/```python\n([\s\S]*?)```/)
    return match ? match[1].trim() : ''
  }

  const copyPythonCode = (index: number) => {
    const md = mdContents[index]
    if (!md) return
    const code = extractPythonCode(md)
    if (!code) {
      message.warning('未找到 Python 代码')
      return
    }
    navigator.clipboard.writeText(code).then(
      () => message.success('已复制 Python 代码'),
      () => message.error('复制失败')
    )
  }

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    Promise.all(MD_URLS.map((url) => fetch(url).then((r) => (r.ok ? r.text() : ''))))
      .then(([a, b]) => setMdContents([a || null, b || null]))
      .catch(() => setMdContents([null, null]))
  }, [])

  const handleGenerate = async () => {
    const trimmed = prompt.trim()
    if (!trimmed) {
      message.warning('请输入描述')
      return
    }
    if (loading) return
    setError(null)
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setImageUrl(null)
    setLoading(true)
    try {
      const blob = await imageGenerate(trimmed, model)
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url
      setImageUrl(url)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '生成失败'
      setError(msg)
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `image-${Date.now()}.png`
    a.click()
  }

  return (
    <Layout
      style={{
        height: '100%',
        minHeight: 400,
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: 'transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
            图片生成
          </Title>
          <Space align="center" wrap size={[8, 8]}>
            {MODEL_OPTIONS.map((opt) => (
              <Tag
                key={opt.value}
                color={model === opt.value ? 'blue' : 'default'}
                style={{ cursor: 'pointer', margin: 0 }}
                onClick={() => setModel(opt.value)}
              >
                {opt.label}
              </Tag>
            ))}
          </Space>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="text"
            icon={<CodeOutlined />}
            onClick={() => setCodeDrawerOpen(true)}
            style={{ color: 'var(--ds-text-muted)', fontSize: 14 }}
          >
            代码
          </Button>
        </div>
      </div>

      <Drawer
        title="参考代码"
        placement="right"
        width={'50%'}
        open={codeDrawerOpen}
        onClose={() => setCodeDrawerOpen(false)}
        styles={{ body: { paddingTop: 8 } }}
      >
        <Collapse
          size="small"
          defaultActiveKey={['1']}
          items={MD_URLS.map((_, i) => ({
            key: String(i),
            label: MD_LABELS[i],
            children: mdContents[i] ? (
              <div style={{ position: 'relative' }}>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copyPythonCode(i)}
                  style={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}
                >
                  复制
                </Button>
                <div
                  className="markdown-body"
                  style={{
                    lineHeight: 1.65,
                    color: 'var(--ds-text)',
                    fontSize: 13,
                    paddingTop: 32,
                  }}
                >
                  <ReactMarkdown>{mdContents[i]}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <span style={{ color: 'var(--ds-text-muted)' }}>加载中...</span>
            ),
          }))}
          style={{ background: 'var(--ds-bg)', borderRadius: 12, border: '1px solid var(--ds-border, #eee)' }}
        />
      </Drawer>

      <Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            minHeight: 200,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            {error && (
              <div style={{ color: 'var(--ds-primary)', fontSize: 14, textAlign: 'center' }}>{error}</div>
            )}
            {!error && imageUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <img
                  src={imageUrl}
                  alt="生成结果"
                  style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: 12 }}
                />
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  style={{ flexShrink: 0 }}
                >
                  下载
                </Button>
              </div>
            )}
            {!error && !imageUrl && !loading && (
              <span style={{ color: 'var(--ds-text-muted)', fontSize: 14 }}>输入描述后点击生成</span>
            )}
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px 24px',
            background: 'transparent',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              borderRadius: 12,
              padding: '12px 14px',
              background: 'var(--ds-bg)',
              border: 'none',
              boxShadow: 'none',
            }}
          >
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault()
                  handleGenerate()
                }
              }}
              placeholder="描述你想生成的图片，如：一只可爱的猫咪在阳光下睡觉"
              autoSize={{ minRows: 1, maxRows: 3 }}
              bordered={false}
              style={{
                background: 'transparent',
                resize: 'none',
                color: 'var(--ds-text)',
              }}
              disabled={loading}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={loading}
                onClick={handleGenerate}
                style={{
                  background: 'var(--ds-primary)',
                  borderColor: 'var(--ds-primary)',
                  fontWeight: 500,
                  minWidth: 88,
                }}
              >
                生成
              </Button>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  )
}
