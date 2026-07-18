import { useState } from 'react'
import { Layout, Typography, Card, Upload, Input, Button, Space, Tag, message, Spin } from 'antd'
import { LineChartOutlined, InboxOutlined, SendOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { getColumns, generateChart, type ColumnsResult } from '../service/data-viz'

const { Content } = Layout
const { Title, Text } = Typography
const { Dragger } = Upload
const { TextArea } = Input

const EXAMPLE_QUESTIONS = [
  '用柱状图展示各列的分布',
  '画折线图展示数值趋势',
  '用散点图分析两列的关系',
  '用饼图展示类别分布比例',
]

export default function DataVisualization() {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<ColumnsResult | null>(null)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [chartBase64, setChartBase64] = useState<string | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setCsvFile(file)
    setFileList([file as unknown as UploadFile])
    setColumns(null)
    setChartBase64(null)
    try {
      const result = await getColumns(file)
      setColumns(result)
    } catch (e) {
      message.error('CSV 解析失败')
    }
  }

  const handleGenerateChart = async () => {
    if (!csvFile || !question.trim()) return message.warning('请上传 CSV 并描述图表需求')
    setLoading(true)
    setChartBase64(null)
    try {
      const result = await generateChart(csvFile, question.trim())
      setChartBase64(result.image_base64)
      setGeneratedCode(result.generated_code)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '图表生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ height: '100%', background: 'var(--ai-canvas)' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <LineChartOutlined style={{ fontSize: 28, color: '#722ed1' }} />
          <Title level={3} style={{ margin: 0 }}>AI 数据可视化</Title>
        </Space>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16 }}>
          <div>
            <Card title="上传数据" style={{ marginBottom: 16 }}>
              <Dragger
                accept=".csv"
                fileList={fileList}
                beforeUpload={(file) => { handleUpload(file); return false }}
                onRemove={() => { setCsvFile(null); setFileList([]); setColumns(null) }}
                maxCount={1}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">点击或拖拽上传 CSV</p>
              </Dragger>

              {columns && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">{columns.row_count} 行，{columns.columns.length} 列：</Text>
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {columns.columns.map(col => (
                      <Tag key={col} color="purple" style={{ fontSize: 11 }}>{col}<span style={{ color: '#aaa', marginLeft: 2 }}>({columns.dtypes[col]})</span></Tag>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card title="描述图表">
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <TextArea
                  placeholder="用自然语言描述想要的图表..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  rows={3}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {EXAMPLE_QUESTIONS.map(q => (
                    <Button key={q} size="small" type="dashed" onClick={() => setQuestion(q)} style={{ fontSize: 11 }}>{q}</Button>
                  ))}
                </div>
                <Button type="primary" block icon={<SendOutlined />} onClick={handleGenerateChart} loading={loading} disabled={!csvFile} style={{ background: '#722ed1', borderColor: '#722ed1' }}>
                  生成图表
                </Button>
              </Space>
            </Card>
          </div>

          <div>
            <Card title="图表结果" style={{ minHeight: 400 }}>
              {loading && <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" tip="AI 正在生成图表..." /></div>}
              {!loading && !chartBase64 && (
                <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
                  <LineChartOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                  <div>上传 CSV 并描述图表，AI 自动生成</div>
                </div>
              )}
              {chartBase64 && (
                <img src={`data:image/png;base64,${chartBase64}`} alt="chart" style={{ width: '100%', borderRadius: 8 }} />
              )}
            </Card>
            {generatedCode && (
              <Card title="生成的代码" size="small" style={{ marginTop: 12 }}>
                <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto', maxHeight: 200 }}>
                  {generatedCode}
                </pre>
              </Card>
            )}
          </div>
        </div>
      </Content>
    </Layout>
  )
}
