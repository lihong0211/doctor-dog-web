import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Layout,
  Typography,
  Button,
  Card,
  Modal,
  Steps,
  Form,
  Input,
  InputNumber,
  Upload,
  message,
  Spin,
  Tooltip,
} from 'antd'
import { InboxOutlined, ArrowLeftOutlined, DeleteOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import {
  createKnowledgeBase,
  uploadKnowledgeBaseFiles,
  executeSegments,
  listKnowledgeBaseDocuments,
  getDocumentSegments,
  getDocumentPreviewUrl,
  vectorizeKnowledgeBase,
  deleteKnowledgeBaseDocument,
  type KnowledgeBaseDocumentItem,
  type KnowledgeBaseSegmentItem,
} from '../service/knowledge-base'
import ReactMarkdown from 'react-markdown'
import PdfPreview from '../components/PdfPreview'
import ImagePreview from '../components/ImagePreview'
import TxtPreview from '../components/TxtPreview'
import { usePdfPreview, isImageFileName, isTxtFileName } from '../utils/preview'

const { Content } = Layout
const { Text } = Typography

const NAME_REG = /^[a-zA-Z0-9_-]+$/
const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp'
const STEP_UPLOAD = 0
const STEP_SETTINGS = 1
const STEP_PREVIEW = 2
const STEP_VECTORIZE = 3

const steps = [
  { title: '上传', description: '上传文档' },
  { title: '创建设置', description: '分段与配置' },
  { title: '分段预览', description: '预览分段结果' },
  { title: '数据处理', description: '向量化' },
]

export default function KnowledgeBaseNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const kbIdFromUrl = searchParams.get('kb_id')
  const isAddFilesMode = kbIdFromUrl != null && kbIdFromUrl !== '' && !Number.isNaN(Number(kbIdFromUrl))

  const [currentStep, setCurrentStep] = useState(STEP_UPLOAD)
  const [createKbId, setCreateKbId] = useState<number | null>(() =>
    isAddFilesMode ? Number(kbIdFromUrl) : null
  )
  const [stepLoading, setStepLoading] = useState(false)
  const [kbDocuments, setKbDocuments] = useState<KnowledgeBaseDocumentItem[]>([])
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)
  const [segmentList, setSegmentList] = useState<KnowledgeBaseSegmentItem[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [loadingSegments, setLoadingSegments] = useState(false)
  const [vectorizeLoading, setVectorizeLoading] = useState(false)
  const [vectorizeDone, setVectorizeDone] = useState(false)
  const [previewFullscreen, setPreviewFullscreen] = useState(false)
  /** 添加文件模式下本次上传的文档列表，Step3 仅展示此列表 */
  const [addedFilesDocuments, setAddedFilesDocuments] = useState<KnowledgeBaseDocumentItem[]>([])

  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const notifyDuplicatedFiles = (res?: {
    duplicated_files?: string[]
    documents?: { file_name: string; overwritten?: boolean }[]
  }) => {
    const duplicated = (res?.duplicated_files ?? []).filter(Boolean)
    const overwritten = (res?.documents ?? [])
      .filter((d) => d?.overwritten === true && d?.file_name)
      .map((d) => d.file_name)
    const list = duplicated.length > 0 ? duplicated : overwritten
    if (list.length === 0) return
    Modal.warning({
      title: '发现重复文件，已覆盖',
      content: (
        <div style={{ maxHeight: 240, overflow: 'auto' }}>
          {list.map((name, i) => (
            <div key={`${name}-${i}`} style={{ wordBreak: 'break-all' }}>
              {name}
            </div>
          ))}
        </div>
      ),
      okText: '知道了',
    })
  }

  // Step 1: 上传 — 新建时创建知识库 + 上传；添加文件时仅上传到已有库
  const handleStep1Next = async () => {
    const files = fileList.filter((f) => (f as { originFileObj?: File }).originFileObj).map((f) => (f as { originFileObj: File }).originFileObj)
    if (files.length === 0) {
      message.warning(isAddFilesMode ? '请至少选择一个文件' : '请至少上传一个文件')
      return
    }

    if (isAddFilesMode && createKbId != null) {
      setStepLoading(true)
      try {
        const uploadRes = await uploadKnowledgeBaseFiles({
          files,
          kb_id: createKbId,
          skip_ocr: true,
        })
        notifyDuplicatedFiles(uploadRes)
        setAddedFilesDocuments(
          (uploadRes?.documents ?? []).map((d) => ({
            id: d.document_id,
            file_name: d.file_name,
            segment_count: d.segment_count,
          }))
        )
        if (uploadRes?.skipped_ocr) {
          message.success('已保存文件（已跳过 OCR），可在下一步执行分段时再处理')
        } else {
          message.success('上传完成')
        }
        setCurrentStep(STEP_SETTINGS)
      } catch (e) {
        message.error(e instanceof Error ? e.message : '上传失败')
      } finally {
        setStepLoading(false)
      }
      return
    }

    const { name, description } = await form.validateFields(['name', 'description']).catch(() => ({}))
    if (!name?.trim()) return
    if (!NAME_REG.test(name.trim())) {
      message.warning('库名仅允许 a-zA-Z0-9_-')
      return
    }

    setStepLoading(true)
    try {
      const createRes = await createKnowledgeBase({
        name: name.trim(),
        description: description?.trim() || undefined,
      })
      const kbId = createRes.id
      setCreateKbId(kbId)

      const uploadRes = await uploadKnowledgeBaseFiles({
        files,
        kb_id: kbId,
        skip_ocr: true,
      })
      notifyDuplicatedFiles(uploadRes)
      if (uploadRes?.skipped_ocr) {
        message.success('已保存文件（已跳过 OCR），可在下一步执行分段时再处理')
      } else {
        message.success('上传完成')
      }
      setCurrentStep(STEP_SETTINGS)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '上传失败')
    } finally {
      setStepLoading(false)
    }
  }

  // Step 2: 创建设置 — 下一步时执行分段
  const handleStep2Next = async () => {
    const { chunk_size, chunk_overlap } = await form.validateFields(['chunk_size', 'chunk_overlap']).catch(() => null)
    if (chunk_size == null || chunk_overlap == null) return
    if (createKbId == null) return
    setStepLoading(true)
    try {
      const documentIds = isAddFilesMode
        ? addedFilesDocuments.map((d) => d.id)
        : (await listKnowledgeBaseDocuments({ kb_id: createKbId })).list.map((d) => d.id)
      if (documentIds.length === 0) {
        message.warning(isAddFilesMode ? '请先在上一步上传文件' : '当前知识库暂无文档，请先在上一步上传')
        return
      }
      const segRes = await executeSegments({
        document_ids: documentIds,
        chunk_size: Number(chunk_size),
        chunk_overlap: Number(chunk_overlap),
      })
      if (isAddFilesMode && segRes?.results?.length) {
        setAddedFilesDocuments((prev) =>
          prev.map((d) => {
            const r = segRes.results.find((x) => x.document_id === d.id)
            return { ...d, segment_count: r?.segment_count ?? d.segment_count }
          })
        )
      }
      message.success('分段完成')
      setCurrentStep(STEP_PREVIEW)
      setSelectedDocId(null)
      setSegmentList([])
    } catch (e) {
      message.error(e instanceof Error ? e.message : '执行分段失败')
    } finally {
      setStepLoading(false)
    }
  }

  useEffect(() => {
    if (currentStep !== STEP_PREVIEW || createKbId == null) return
    if (isAddFilesMode) {
      setKbDocuments(addedFilesDocuments)
      return
    }
    let cancelled = false
    setLoadingDocs(true)
    setKbDocuments([])
    listKnowledgeBaseDocuments({ kb_id: createKbId })
      .then((res) => {
        if (!cancelled) setKbDocuments(res.list ?? [])
      })
      .catch(() => {
        if (!cancelled) setKbDocuments([])
      })
      .finally(() => {
        if (!cancelled) setLoadingDocs(false)
      })
    return () => { cancelled = true }
  }, [currentStep, createKbId, isAddFilesMode, addedFilesDocuments])

  const handleDeleteDoc = (doc: KnowledgeBaseDocumentItem) => {
    if (createKbId == null) return
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文档「${doc.file_name}」吗？将同时删除该文档的所有分段。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteKnowledgeBaseDocument({ document_id: doc.id })
          message.success('已删除')
          if (selectedDocId === doc.id) {
            setSelectedDocId(null)
            setSegmentList([])
          }
          if (isAddFilesMode) {
            setAddedFilesDocuments((prev) => prev.filter((d) => d.id !== doc.id))
            setKbDocuments((prev) => prev.filter((d) => d.id !== doc.id))
          } else {
            const res = await listKnowledgeBaseDocuments({ kb_id: createKbId })
            setKbDocuments(res.list ?? [])
          }
        } catch (e) {
          message.error(e instanceof Error ? e.message : '删除失败')
        }
      },
    })
  }

  const handleSelectDoc = async (doc: KnowledgeBaseDocumentItem) => {
    setSelectedDocId(doc.id)
    setLoadingSegments(true)
    setSegmentList([])
    try {
      const res = await getDocumentSegments(doc.id)
      setSegmentList(res.list ?? [])
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载分段失败')
      setSegmentList([])
    } finally {
      setLoadingSegments(false)
    }
  }

  const handleVectorize = async () => {
    if (createKbId == null) return
    setVectorizeLoading(true)
    try {
      await vectorizeKnowledgeBase({ knowledge_base_id: createKbId })
      setVectorizeDone(true)
      message.success('向量化完成')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '向量化失败')
    } finally {
      setVectorizeLoading(false)
    }
  }

  const handleFinish = () => {
    navigate('/skills/knowledge-base')
  }

  return (
    <Layout style={{ height: '100%', minHeight: 400, background: 'transparent', overflow: 'hidden' }}>
      <Content style={{ overflow: 'auto', padding: 24, background: 'transparent', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/skills/knowledge-base')}>
            返回列表
          </Button>
          <Typography.Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
            {isAddFilesMode ? '添加文件' : '新增知识库'}
          </Typography.Title>
        </div>

        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

        {/* Step 1: 上传 — 新建需填库名/描述，添加文件仅上传；支持图片与「跳过 OCR」 */}
        {currentStep === STEP_UPLOAD && (
          <>
            <Form form={form} layout="vertical" initialValues={{ chunk_size: 250, chunk_overlap: 25 }}>
              {!isAddFilesMode && (
                <>
                  <Form.Item name="name" label="库名（仅 a-zA-Z0-9_-）" rules={[{ required: true }, { pattern: NAME_REG, message: '仅允许字母、数字、下划线、中划线' }]}>
                    <Input placeholder="如 my_kb" />
                  </Form.Item>
                  <Form.Item name="description" label="描述（可选）">
                    <Input placeholder="知识库说明" />
                  </Form.Item>
                </>
              )}
              {isAddFilesMode && (
                <div style={{ marginBottom: 16 }}>
                  <Typography.Text type="secondary">向当前知识库追加文档，选择文件后点击下一步上传。</Typography.Text>
                </div>
              )}
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                <Upload.Dragger
                  accept={ACCEPT}
                  fileList={fileList}
                  multiple
                  beforeUpload={() => false}
                  onChange={({ fileList: next }) => setFileList(next)}
                  maxCount={300}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ color: 'var(--ant-color-primary)' }} />
                  </p>
                  <p className="ant-upload-text">点击上传或拖拽文档到这里</p>
                  <p className="ant-upload-hint">支持 PDF、DOC、DOCX、PPT、PPTX、XLS、XLSX、TXT、MD、JPG、PNG、GIF、WEBP，最多 100 个文件</p>
                </Upload.Dragger>
              </div>
            </Form>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button type="primary" onClick={handleStep1Next} loading={stepLoading}>
                下一步
              </Button>
            </div>
          </>
        )}

        {/* Step 2: 创建设置 */}
        {currentStep === STEP_SETTINGS && (
          <>
            <Form form={form} layout="vertical" initialValues={{ chunk_size: 10, chunk_overlap: 200 }}>
              <Form.Item name="chunk_size" label="分段长度" rules={[{ required: true, message: '请输入分段长度' }]}>
                <InputNumber min={100} max={5000} style={{ width: '100%' }} placeholder="250" />
              </Form.Item>
              <Form.Item name="chunk_overlap" label="分段重叠" rules={[{ required: true, message: '请输入分段重叠' }]}>
                <InputNumber min={0} max={1000} style={{ width: '100%' }} placeholder="250" />
              </Form.Item>
            </Form>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Text type="secondary">已上传的文档将按以上参数执行分段。点击下一步开始分段并进入预览。</Text>
            </Card>
            <div style={{ textAlign: 'right' }}>
              <Button style={{ marginRight: 8 }} onClick={() => setCurrentStep(STEP_UPLOAD)}>
                上一步
              </Button>
              <Button type="primary" onClick={handleStep2Next} loading={stepLoading}>
                下一步
              </Button>
            </div>
          </>
        )}

        {/* Step 3: 分段预览 — 三列等高，左侧文档列表可滚动 */}
        {currentStep === STEP_PREVIEW && (
          <>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 16, height: '70vh', minHeight: 360, marginBottom: 16 }}>
              <div style={{ width: 220, minWidth: 0, flexShrink: 0, alignSelf: 'stretch', border: '1px solid var(--ant-color-border)', borderRadius: 8, background: 'var(--ant-color-fill-quaternary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', marginBottom: 8, padding: '8px 8px 0', flexShrink: 0 }}>自动分段与清洗 · 文档列表</div>
                <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', padding: 8 }}>
                  {loadingDocs ? (
                    <div style={{ textAlign: 'center', padding: 16 }}><Spin size="small" /></div>
                  ) : kbDocuments.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>暂无文档，请在上一步上传</Text>
                  ) : (
                    kbDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleSelectDoc(doc)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '8px 10px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          background: selectedDocId === doc.id ? 'var(--ant-color-primary-bg)' : 'transparent',
                          marginBottom: 4,
                          fontSize: 13,
                          minWidth: 0,
                          overflow: 'hidden',
                        }}
                      >
                        <Tooltip title={doc.file_name} placement="topLeft">
                          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</span>
                        </Tooltip>
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteDoc(doc)
                          }}
                          style={{ flexShrink: 0, padding: '0 4px', height: 24 }}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0, minHeight: 0, alignSelf: 'stretch', border: '1px solid var(--ant-color-border)', borderRadius: 8, overflow: 'hidden', background: 'var(--ai-surface-2)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 8px', borderBottom: '1px solid var(--ant-color-border)', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>原始文档预览</span>
                  {selectedDocId != null && (
                    <Tooltip title="全屏">
                      <Button type="text" size="small" icon={<FullscreenOutlined />} onClick={() => setPreviewFullscreen(true)} />
                    </Tooltip>
                  )}
                </div>
                {selectedDocId == null ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 0 }}>
                    <Text type="secondary">请从左侧选择文档</Text>
                  </div>
                ) : (() => {
                  const previewUrl = getDocumentPreviewUrl(selectedDocId)
                  const selectedDoc = kbDocuments.find((d) => d.id === selectedDocId)
                  const fileName = selectedDoc?.file_name ?? ''
                  if (usePdfPreview(fileName)) {
                    return (
                      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                        <PdfPreview url={previewUrl} style={{ width: '100%', height: '100%' }} />
                      </div>
                    )
                  }
                  if (isImageFileName(fileName)) {
                    return <ImagePreview url={previewUrl} alt={fileName} style={{ flex: 1, minHeight: 0 }} />
                  }
                  if (isTxtFileName(fileName)) {
                    return (
                      <TxtPreview
                        url={previewUrl}
                        style={{ flex: 1, minHeight: 0 }}
                        renderAsMarkdown={fileName.toLowerCase().endsWith('.md')}
                      />
                    )
                  }
                  return (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, flexDirection: 'column', gap: 8 }}>
                      <Text type="secondary">该格式可在浏览器中打开预览</Text>
                      <a href={previewUrl} target="_blank" rel="noopener noreferrer">新标签打开</a>
                    </div>
                  )
                })()}
              </div>
              <div style={{ flex: 1, minWidth: 0, minHeight: 0, alignSelf: 'stretch', border: '1px solid var(--ant-color-border)', borderRadius: 8, background: 'var(--ai-surface-2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', marginBottom: 8, padding: '12px 12px 0', flexShrink: 0 }}>分段预览</div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 12px 12px' }}>
                  {loadingSegments ? (
                    <div style={{ textAlign: 'center', padding: 24 }}><Spin tip="加载分段..." /></div>
                  ) : segmentList.length === 0 ? (
                    <Text type="secondary">选择左侧文档后显示分段列表</Text>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
                      {segmentList.map((seg, i) => (
                        <Card key={seg.id ?? i} size="small" style={{ background: 'var(--ant-color-fill-quaternary)' }}>
                          <div style={{ fontSize: 11, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>
                            第 {seg.index != null ? seg.index + 1 : i + 1} 段
                            {seg.id != null && ` · id ${seg.id}`}
                          </div>
                          <div className="markdown-body kb-segment-markdown" style={{ wordBreak: 'break-word', fontSize: 13 }}>
                            <ReactMarkdown>{seg.text ?? ''}</ReactMarkdown>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Button style={{ marginRight: 8 }} onClick={() => setCurrentStep(STEP_SETTINGS)}>
                上一步
              </Button>
              <Button type="primary" onClick={() => setCurrentStep(STEP_VECTORIZE)}>
                下一步
              </Button>
            </div>

            {previewFullscreen && selectedDocId != null && (() => {
              const previewUrl = getDocumentPreviewUrl(selectedDocId)
              const selectedDoc = kbDocuments.find((d) => d.id === selectedDocId)
              const fileName = selectedDoc?.file_name ?? ''
              return (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    background: 'var(--ai-surface-2)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--ant-color-border)', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, color: 'var(--ant-color-text)' }}>原始文档预览</span>
                    <Tooltip title="退出全屏">
                      <Button type="text" size="small" icon={<FullscreenExitOutlined />} onClick={() => setPreviewFullscreen(false)} />
                    </Tooltip>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    {usePdfPreview(fileName) && (
                      <PdfPreview url={previewUrl} style={{ width: '100%', height: '100%' }} />
                    )}
                    {!usePdfPreview(fileName) && isImageFileName(fileName) && (
                      <ImagePreview url={previewUrl} alt={fileName} style={{ flex: 1, minHeight: 0, height: '100%' }} />
                    )}
                    {!usePdfPreview(fileName) && !isImageFileName(fileName) && isTxtFileName(fileName) && (
                      <TxtPreview
                        url={previewUrl}
                        style={{ flex: 1, minHeight: 0, height: '100%' }}
                        renderAsMarkdown={fileName.toLowerCase().endsWith('.md')}
                      />
                    )}
                    {!usePdfPreview(fileName) && !isImageFileName(fileName) && !isTxtFileName(fileName) && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8 }}>
                        <Text type="secondary">该格式可在浏览器中打开预览</Text>
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer">新标签打开</a>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </>
        )}

        {/* Step 4: 数据处理（向量化） */}
        {currentStep === STEP_VECTORIZE && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
            {vectorizeDone && (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="success">向量化已完成。</Text>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: 24, textAlign: 'right' }}>
              <Button onClick={() => setCurrentStep(STEP_PREVIEW)} style={{ marginRight: 8 }}>上一步</Button>
              {!vectorizeDone && (
                <Button type="primary" onClick={handleVectorize} loading={vectorizeLoading} style={{ marginRight: 8 }}>
                  向量化
                </Button>
              )}
              <Button type="primary" onClick={handleFinish}>
                {vectorizeDone ? '完成' : '稍后处理'}
              </Button>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  )
}
