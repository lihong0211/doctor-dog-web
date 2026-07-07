import { useState, useRef } from 'react'
import { Layout, Typography, Input, Button, message } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import { videoUnderstand } from '../service/video'

const { Content } = Layout
const { Title } = Typography
const { TextArea } = Input

export default function VideoUnderstand() {
  const [question, setQuestion] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('video/')) return
    setVideoFile(file)
    setError(null)
    setResult('')
    e.target.value = ''
  }

  const handleSubmit = async () => {
    const q = question.trim()
    if (!q) {
      message.warning('请输入问题')
      return
    }
    if (!videoFile) {
      message.warning('请先上传视频')
      return
    }
    if (loading) return
    setError(null)
    setResult('')
    setLoading(true)
    try {
      const text = await videoUnderstand(videoFile, q)
      setResult(text || '（无文本结果）')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '请求失败'
      setError(msg)
      message.error(msg)
    } finally {
      setLoading(false)
    }
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
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
        }}
      >
        <Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
          视频理解
        </Title>
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
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 24,
            minHeight: 120,
          }}
        >
          {error && (
            <div style={{ color: 'var(--ds-primary)', fontSize: 14, marginBottom: 8 }}>{error}</div>
          )}
          {result && (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: 'var(--ds-bg)',
                border: '1px solid var(--ds-border, #eee)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.7,
                color: 'var(--ds-text)',
              }}
            >
              {result}
            </div>
          )}
          {!result && !error && !loading && (
            <span style={{ color: 'var(--ds-text-muted)', fontSize: 14 }}>上传视频并输入问题后提交</span>
          )}
        </div>

        <div
          style={{
            padding: '16px 24px 24px',
            background: 'transparent',
            flexShrink: 0,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div
            style={{
              borderRadius: 12,
              padding: '12px 14px',
              background: 'var(--ds-bg)',
              border: 'none',
              boxShadow: 'none',
            }}
          >
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
                minHeight: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                marginBottom: 10,
                borderRadius: 8,
                border: '1px dashed var(--ds-border)',
              }}
            >
              <PlayCircleOutlined style={{ fontSize: 20, color: 'var(--ds-primary)' }} />
              <span style={{ fontSize: 14, color: 'var(--ds-text-muted)' }}>
                {videoFile ? videoFile.name : '点击上传视频'}
              </span>
            </div>
            <TextArea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="描述这个视频 / 向视频提问"
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
                loading={loading}
                onClick={handleSubmit}
                style={{
                  background: 'var(--ds-primary)',
                  borderColor: 'var(--ds-primary)',
                  fontWeight: 500,
                  minWidth: 88,
                }}
              >
                {loading ? '理解中...' : '提交'}
              </Button>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  )
}
