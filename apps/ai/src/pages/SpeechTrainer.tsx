import { useState, useRef } from 'react'
import { Layout, Typography, Card, Upload, Button, Space, Tag, Progress, List, message, Spin } from 'antd'
import { AudioOutlined, InboxOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { analyzeSpeech, type SpeechResult } from '../service/speech-trainer'

const { Content } = Layout
const { Title, Text, Paragraph } = Typography
const { Dragger } = Upload

export default function SpeechTrainer() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SpeechResult | null>(null)
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  const handleRecord = async () => {
    if (recording) {
      recorderRef.current?.stop()
      setRecording(false)
      return
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
      setAudioFile(file)
      setFileList([{ uid: '-1', name: 'recording.webm', status: 'done' } as UploadFile])
      stream.getTracks().forEach(t => t.stop())
    }
    recorder.start()
    recorderRef.current = recorder
    setRecording(true)
  }

  const handleAnalyze = async () => {
    if (!audioFile) return message.warning('请上传或录制音频')
    setLoading(true)
    setResult(null)
    try {
      const data = await analyzeSpeech(audioFile)
      setResult(data)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '分析失败')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (s: number) => s >= 8 ? '#52c41a' : s >= 6 ? '#faad14' : '#f5222d'

  return (
    <Layout style={{ height: '100%', background: '#f5f5f5' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <AudioOutlined style={{ fontSize: 28, color: '#1677ff' }} />
          <Title level={3} style={{ margin: 0 }}>AI 演讲训练 Agent</Title>
        </Space>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <Dragger
              accept=".mp3,.wav,.m4a,.webm,.ogg"
              fileList={fileList}
              beforeUpload={(file) => { setAudioFile(file); setFileList([file as unknown as UploadFile]); return false }}
              onRemove={() => { setAudioFile(null); setFileList([]) }}
              maxCount={1}
              style={{ flex: 1 }}
            >
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">点击或拖拽上传音频（mp3/wav/m4a/webm）</p>
            </Dragger>
            <div style={{ textAlign: 'center' }}>
              <Button
                size="large"
                type={recording ? 'default' : 'primary'}
                danger={recording}
                shape="circle"
                icon={<AudioOutlined />}
                onClick={handleRecord}
                style={{ width: 60, height: 60, fontSize: 24, ...(recording ? { animation: 'pulse 1s infinite' } : {}) }}
              />
              <div style={{ marginTop: 4, fontSize: 12, color: recording ? '#f5222d' : '#666' }}>
                {recording ? '录音中...' : '麦克风录音'}
              </div>
            </div>
          </div>
          <Button type="primary" size="large" onClick={handleAnalyze} loading={loading}
            style={{ marginTop: 12 }} disabled={!audioFile}>
            开始分析演讲
          </Button>
        </Card>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" tip="AI 正在分析演讲..." />
          </div>
        )}

        {result && (
          <>
            <Card title="转录文字" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                <div><Text type="secondary">时长</Text><br /><Text strong>{result.duration}秒</Text></div>
                <div><Text type="secondary">字数</Text><br /><Text strong>{result.word_count}</Text></div>
                <div><Text type="secondary">语速</Text><br /><Text strong>{result.words_per_minute}字/分</Text></div>
                <div><Text type="secondary">语速评估</Text><br /><Text strong>{result.analysis.pace_assessment}</Text></div>
              </div>
              <Paragraph style={{ background: '#fafafa', padding: 12, borderRadius: 6, lineHeight: 1.8 }}>
                {result.transcript}
              </Paragraph>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Card title="评分">
                <Space style={{ width: '100%', justifyContent: 'space-around' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Progress type="circle" percent={result.analysis.structure_score * 10} strokeColor={scoreColor(result.analysis.structure_score)} size={80} format={p => `${(p || 0) / 10}`} />
                    <div style={{ marginTop: 4 }}>逻辑结构</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Progress type="circle" percent={result.analysis.language_score * 10} strokeColor={scoreColor(result.analysis.language_score)} size={80} format={p => `${(p || 0) / 10}`} />
                    <div style={{ marginTop: 4 }}>语言表达</div>
                  </div>
                </Space>
                <Paragraph style={{ marginTop: 12, color: '#666' }}>{result.analysis.overall_feedback}</Paragraph>
              </Card>
              <Card title="填充词">
                {result.analysis.filler_words.length > 0
                  ? <Space wrap>{result.analysis.filler_words.map((w, i) => <Tag key={i} color="orange">{w}</Tag>)}</Space>
                  : <Text type="secondary">未检测到明显填充词，表达流畅！</Text>}
              </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Card title={<span style={{ color: '#52c41a' }}>优点</span>} size="small">
                <List size="small" dataSource={result.analysis.strengths} renderItem={item => <List.Item><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 6 }} />{item}</List.Item>} />
              </Card>
              <Card title={<span style={{ color: '#fa8c16' }}>改进点</span>} size="small">
                <List size="small" dataSource={result.analysis.improvements} renderItem={(item, i) => <List.Item>{i + 1}. {item}</List.Item>} />
              </Card>
              <Card title={<span style={{ color: '#1677ff' }}>具体建议</span>} size="small">
                <List size="small" dataSource={result.analysis.suggestions} renderItem={(item, i) => <List.Item>{i + 1}. {item}</List.Item>} />
              </Card>
            </div>
          </>
        )}
      </Content>
    </Layout>
  )
}
