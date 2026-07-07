import { useState } from 'react'
import { Layout, Typography, Upload, Button, Card, Space, Tag, Progress, List, message, Spin } from 'antd'
import { FileTextOutlined, InboxOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { matchResume, type MatchResult } from '../service/resume-matcher'

const { Content } = Layout
const { Title, Text } = Typography
const { Dragger } = Upload
const { Paragraph } = Typography

export default function ResumeMatcher() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MatchResult | null>(null)

  const handleAnalyze = async () => {
    if (!resumeFile) return message.warning('请上传简历 PDF')
    if (!jd.trim()) return message.warning('请输入职位描述')
    setLoading(true)
    setResult(null)
    try {
      const data = await matchResume(resumeFile, jd.trim())
      setResult(data)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '分析失败')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = result
    ? result.score >= 80 ? '#52c41a' : result.score >= 60 ? '#faad14' : '#ff4d4f'
    : '#1677ff'

  return (
    <Layout style={{ height: '100%', background: '#f5f7fa' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <FileTextOutlined style={{ fontSize: 24, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>简历与职位匹配</Title>
        </Space>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card title="上传简历 PDF">
            <Dragger
              accept=".pdf"
              fileList={fileList}
              beforeUpload={(file) => {
                setResumeFile(file)
                setFileList([file as unknown as UploadFile])
                return false
              }}
              onRemove={() => { setResumeFile(null); setFileList([]) }}
              maxCount={1}
            >
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">点击或拖拽上传简历 PDF</p>
            </Dragger>
          </Card>

          <Card title="职位描述">
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="粘贴职位描述（JD）..."
              style={{ width: '100%', height: 140, padding: 8, border: '1px solid #d9d9d9', borderRadius: 6, resize: 'vertical', fontSize: 13, fontFamily: 'inherit' }}
            />
          </Card>
        </div>

        <Button type="primary" size="large" onClick={handleAnalyze} loading={loading} style={{ marginBottom: 24 }}>
          开始分析
        </Button>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin tip="AI 正在分析简历匹配度..." size="large" />
          </div>
        )}

        {result && (
          <div>
            {/* 匹配分数 */}
            <Card style={{ marginBottom: 16, textAlign: 'center' }}>
              <Progress type="circle" percent={result.score} strokeColor={scoreColor} size={120} />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 16 }}>匹配分数：{result.score}/100</Text>
              </div>
              <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>{result.resume_summary}</Paragraph>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Card title={<span style={{ color: '#52c41a' }}>✅ 优势</span>} size="small">
                <Space wrap>
                  {result.strengths.map((s, i) => <Tag key={i} color="success">{s}</Tag>)}
                </Space>
              </Card>
              <Card title={<span style={{ color: '#ff4d4f' }}>❌ 差距</span>} size="small">
                <Space wrap>
                  {result.gaps.map((g, i) => <Tag key={i} color="error">{g}</Tag>)}
                </Space>
              </Card>
              <Card title={<span style={{ color: '#1677ff' }}>💡 建议</span>} size="small">
                <List
                  size="small"
                  dataSource={result.suggestions}
                  renderItem={(item, i) => <List.Item style={{ padding: '2px 0', fontSize: 13 }}>{i + 1}. {item}</List.Item>}
                />
              </Card>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  )
}
