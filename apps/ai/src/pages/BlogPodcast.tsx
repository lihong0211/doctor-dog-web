import { useState } from 'react'
import { Layout, Typography, Card, Input, Button, Select, Space, message, Spin, Tabs } from 'antd'
import { PlaySquareOutlined, DownloadOutlined } from '@ant-design/icons'
import { getBlogScript, getBlogAudio, type BlogScript } from '../service/blog-podcast'

const { Content } = Layout
const { Title, Paragraph } = Typography

const VOICES = [
  { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓（中文女）' },
  { value: 'zh-CN-YunxiNeural', label: '云希（中文男）' },
  { value: 'zh-CN-XiaohanNeural', label: '晓涵（中文女）' },
  { value: 'en-US-JennyNeural', label: 'Jenny（英文女）' },
  { value: 'en-US-GuyNeural', label: 'Guy（英文男）' },
]

export default function BlogPodcast() {
  const [url, setUrl] = useState('')
  const [voice, setVoice] = useState('zh-CN-XiaoxiaoNeural')
  const [loadingScript, setLoadingScript] = useState(false)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const [script, setScript] = useState<BlogScript | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const handleGetScript = async () => {
    if (!url.trim()) return message.warning('请输入博客 URL')
    setLoadingScript(true)
    setScript(null)
    setAudioUrl(null)
    try {
      const s = await getBlogScript(url.trim())
      setScript(s)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '获取失败')
    } finally {
      setLoadingScript(false)
    }
  }

  const handleGetAudio = async () => {
    if (!url.trim()) return
    setLoadingAudio(true)
    setAudioUrl(null)
    try {
      const blobUrl = await getBlogAudio(url.trim(), voice)
      setAudioUrl(blobUrl)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '音频生成失败')
    } finally {
      setLoadingAudio(false)
    }
  }

  return (
    <Layout style={{ height: '100%', background: '#f9f0ff' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <PlaySquareOutlined style={{ fontSize: 28, color: '#722ed1' }} />
          <Title level={3} style={{ margin: 0 }}>博客转播客</Title>
        </Space>

        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Input
              placeholder="输入博客 URL，例如：https://blog.anthropic.com/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              size="large"
            />
            <Space>
              <Select value={voice} onChange={setVoice} style={{ width: 180 }}>
                {VOICES.map(v => <Select.Option key={v.value} value={v.value}>{v.label}</Select.Option>)}
              </Select>
              <Button type="primary" onClick={handleGetScript} loading={loadingScript} style={{ background: '#722ed1', borderColor: '#722ed1' }}>
                获取播客脚本
              </Button>
              <Button onClick={handleGetAudio} loading={loadingAudio} disabled={!url.trim()}>
                直接生成音频
              </Button>
            </Space>
          </Space>
        </Card>

        {(loadingScript || loadingAudio) && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" tip={loadingScript ? '正在抓取和改写脚本...' : '正在生成语音...'} />
          </div>
        )}

        {script && (
          <Card>
            <Tabs items={[
              {
                key: 'script',
                label: '播客脚本',
                children: (
                  <div>
                    <Title level={5}>{script.title}</Title>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', lineHeight: 1.8, background: '#f9f0ff', padding: 16, borderRadius: 8, fontSize: 14 }}>
                      {script.podcast_script}
                    </pre>
                    <Button onClick={handleGetAudio} loading={loadingAudio} type="primary" style={{ marginTop: 12, background: '#722ed1', borderColor: '#722ed1' }}>
                      生成音频
                    </Button>
                  </div>
                ),
              },
              {
                key: 'original',
                label: '原文摘要',
                children: <Paragraph style={{ lineHeight: 1.8 }}>{script.original_summary}</Paragraph>,
              },
            ]} />
          </Card>
        )}

        {audioUrl && (
          <Card title="播客音频" style={{ marginTop: 16 }}>
            <audio controls src={audioUrl} style={{ width: '100%' }} />
            <a href={audioUrl} download="podcast.mp3" style={{ display: 'inline-block', marginTop: 12 }}>
              <Button icon={<DownloadOutlined />}>下载 MP3</Button>
            </a>
          </Card>
        )}
      </Content>
    </Layout>
  )
}
