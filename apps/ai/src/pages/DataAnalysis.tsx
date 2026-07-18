import { useState } from 'react'
import { Layout, Typography, Upload, Table, Input, Button, Card, Space, Tag, message, Spin } from 'antd'
import { InboxOutlined, BarChartOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { uploadDataFile, queryData, type ColumnInfo, type QueryDataResponse } from '../service/data-analysis'

const { Content } = Layout
const { Title, Text } = Typography
const { Dragger } = Upload
const { TextArea } = Input

interface SessionState {
  sessionId: string
  columns: ColumnInfo[]
  rowCount: number
  preview: (string | number | null)[][]
}

export default function DataAnalysis() {
  const [uploading, setUploading] = useState(false)
  const [session, setSession] = useState<SessionState | null>(null)
  const [question, setQuestion] = useState('')
  const [querying, setQuerying] = useState(false)
  const [queryResult, setQueryResult] = useState<QueryDataResponse | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const handleUpload = async (file: File) => {
    setUploading(true)
    setSession(null)
    setQueryResult(null)
    try {
      const data = await uploadDataFile(file)
      setSession({
        sessionId: data.session_id,
        columns: data.columns,
        rowCount: data.row_count,
        preview: data.preview,
      })
      message.success(`文件上传成功，共 ${data.row_count} 行数据`)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '上传失败')
    } finally {
      setUploading(false)
    }
    return false
  }

  const handleQuery = async () => {
    if (!session) return message.warning('请先上传数据文件')
    if (!question.trim()) return message.warning('请输入查询问题')
    setQuerying(true)
    setQueryResult(null)
    try {
      const result = await queryData(session.sessionId, question)
      setQueryResult(result)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '查询失败')
    } finally {
      setQuerying(false)
    }
  }

  const previewColumns = session?.columns.map((col) => ({
    title: (
      <span>
        {col.name} <Tag color="blue" style={{ fontSize: 10 }}>{col.type}</Tag>
      </span>
    ),
    dataIndex: col.name,
    key: col.name,
    ellipsis: true,
  })) ?? []

  const previewData = session?.preview.map((row, i) => {
    const obj: Record<string, unknown> = { key: i }
    session.columns.forEach((col, j) => { obj[col.name] = row[j] })
    return obj
  }) ?? []

  const resultColumns = queryResult?.columns.map((col) => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
  })) ?? []

  const resultData = queryResult?.rows.map((row, i) => {
    const obj: Record<string, unknown> = { key: i }
    queryResult.columns.forEach((col, j) => { obj[col] = row[j] })
    return obj
  }) ?? []

  return (
    <Layout style={{ height: '100%', background: '#f5f7fa' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <BarChartOutlined style={{ fontSize: 24, color: 'var(--ai-primary)' }} />
          <Title level={4} style={{ margin: 0 }}>AI 数据分析</Title>
        </Space>

        <Card title="上传数据文件" style={{ marginBottom: 16 }}>
          <Dragger
            accept=".csv,.xlsx,.xls"
            fileList={fileList}
            beforeUpload={(file) => {
              setFileList([file as unknown as UploadFile])
              handleUpload(file)
              return false
            }}
            onRemove={() => {
              setFileList([])
              setSession(null)
              setQueryResult(null)
            }}
            maxCount={1}
            disabled={uploading}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽上传 CSV / Excel 文件</p>
            <p className="ant-upload-hint">支持 .csv、.xlsx、.xls 格式</p>
          </Dragger>

          {uploading && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Spin tip="正在解析文件..." />
            </div>
          )}

          {session && (
            <div style={{ marginTop: 16 }}>
              <Space style={{ marginBottom: 8 }}>
                <Text strong>数据预览</Text>
                <Tag color="green">{session.rowCount} 行</Tag>
                <Tag color="blue">{session.columns.length} 列</Tag>
              </Space>
              <Table
                columns={previewColumns}
                dataSource={previewData}
                size="small"
                pagination={false}
                scroll={{ x: true }}
                bordered
              />
            </div>
          )}
        </Card>

        <Card title="自然语言查询" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <TextArea
              placeholder="用自然语言描述你的查询，例如：各部门的平均薪资是多少？"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 4 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault()
                  handleQuery()
                }
              }}
              disabled={querying || !session}
              style={{ marginBottom: 8 }}
            />
            <Button
              type="primary"
              onClick={handleQuery}
              loading={querying}
              disabled={!session}
            >
              查询
            </Button>
          </div>

          {queryResult && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <Text strong>生成 SQL：</Text>
                <pre style={{
                  background: '#1e1e1e',
                  color: '#d4d4d4',
                  padding: '10px 14px',
                  borderRadius: 6,
                  marginTop: 6,
                  fontSize: 13,
                  overflowX: 'auto',
                }}>
                  {queryResult.sql}
                </pre>
              </div>
              <Text strong>查询结果：</Text>
              <Table
                columns={resultColumns}
                dataSource={resultData}
                size="small"
                scroll={{ x: true }}
                bordered
                style={{ marginTop: 8 }}
                pagination={{ pageSize: 20, showSizeChanger: false }}
              />
            </div>
          )}
        </Card>
      </Content>
    </Layout>
  )
}
