import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout, Typography, Button, Card, Table, Modal, message, Space, Spin, Form, Input, Tooltip } from 'antd'
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined, FileTextOutlined, EditOutlined, ThunderboltOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import {
  listKnowledgeBases,
  deleteKnowledgeBase,
  updateKnowledgeBase,
  vectorizeKnowledgeBase,
  listKnowledgeBaseDocuments,
  getDocumentSegments,
  getDocumentPreviewUrl,
  deleteKnowledgeBaseDocument,
  type KbItem,
  type KnowledgeBaseDocumentItem,
  type KnowledgeBaseSegmentItem,
} from '../service/knowledge-base'
import PdfPreview from '../components/PdfPreview'
import ImagePreview from '../components/ImagePreview'
import TxtPreview from '../components/TxtPreview'
import { usePdfPreview, isImageFileName, isTxtFileName } from '../utils/preview'

const { Content } = Layout
const { Title, Text } = Typography

export default function KnowledgeBase() {
  const { id: routeId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const kbId = routeId ? Number(routeId) : undefined

  const [list, setList] = useState<KbItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  // 文件预览页：文档列表 + 分段预览
  const [kbDocuments, setKbDocuments] = useState<KnowledgeBaseDocumentItem[]>([])
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)
  const [segmentList, setSegmentList] = useState<KnowledgeBaseSegmentItem[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [loadingSegments, setLoadingSegments] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KbItem | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm] = Form.useForm<{ name: string; description: string }>()
  const [vectorizingId, setVectorizingId] = useState<number | null>(null)
  const [previewFullscreen, setPreviewFullscreen] = useState(false)

  const loadList = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await listKnowledgeBases()
      setList(res ?? [])
    } catch (e) {
      message.error(e instanceof Error ? e.message : '获取列表失败')
      setList([])
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  // 详情页：按 kbId 拉取文档列表
  useEffect(() => {
    if (kbId == null || Number.isNaN(kbId)) return
    let cancelled = false
    setLoadingDocs(true)
    setKbDocuments([])
    listKnowledgeBaseDocuments({ kb_id: kbId })
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
  }, [kbId])

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

  const handleDeleteDoc = (doc: KnowledgeBaseDocumentItem) => {
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
          const res = await listKnowledgeBaseDocuments({ kb_id: kbId! })
          setKbDocuments(res.list ?? [])
        } catch (e) {
          message.error(e instanceof Error ? e.message : '删除失败')
        }
      },
    })
  }

  const handleDelete = (item: KbItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除知识库「${item.name}」吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteKnowledgeBase({ id: item.id })
          message.success('已删除')
          loadList()
        } catch (e) {
          message.error(e instanceof Error ? e.message : '删除失败')
        }
      },
    })
  }

  const openEditModal = (item: KbItem) => {
    setEditingItem(item)
    editForm.setFieldsValue({
      name: item.name ?? '',
      description: item.description ?? '',
    })
    setEditModalOpen(true)
  }

  const handleEditCancel = () => {
    setEditModalOpen(false)
    setEditingItem(null)
    editForm.resetFields()
  }

  const handleEditOk = async () => {
    if (editingItem == null) return
    try {
      const values = await editForm.validateFields()
      setEditSubmitting(true)
      await updateKnowledgeBase({
        id: editingItem.id,
        name: values.name?.trim() || undefined,
        description: values.description?.trim() || undefined,
      })
      message.success('已更新')
      handleEditCancel()
      loadList()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error(e instanceof Error ? e.message : '更新失败')
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleVectorize = async (item: KbItem) => {
    Modal.confirm({
      title: '确认向量化',
      content: '本次操作会将现有所有分片执行向量化，是否确认？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setVectorizingId(item.id)
        try {
          const res = await vectorizeKnowledgeBase({ knowledge_base_id: item.id })
          message.success(res.created ? `已创建向量库，共 ${res.count} 条` : `已更新向量库，共 ${res.count} 条`)
          loadList()
        } catch (e) {
          message.error(e instanceof Error ? e.message : '向量化失败')
        } finally {
          setVectorizingId(null)
        }
      },
    })
  }

  // 知识库详情：文件预览（按 id 进入）
  if (kbId != null && !Number.isNaN(kbId)) {
    const kbItem = list.find((k) => k.id === kbId)
    return (
      <Layout style={{ height: '100%', minHeight: 400, background: 'transparent', overflow: 'hidden' }}>
        <Content style={{ overflow: 'auto', padding: 24, background: 'transparent', width: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/skills/knowledge-base')}>
              返回列表
            </Button>
            <Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
              {kbItem?.name ?? `知识库 ${kbId}`} · 文件管理
            </Title>
            <div style={{ flex: 1 }} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/skills/knowledge-base/new?kb_id=${kbId}`)}>
              添加文件
            </Button>
          </div>
          <div style={{ flex: 1, minHeight: 360, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 16, flex: 1, minHeight: 360, height: '70vh' }}>
              {/* 左：文档列表（knowledge_base_document） */}
              <div style={{ width: 260, minWidth: 0, flexShrink: 0, alignSelf: 'stretch', border: '1px solid var(--ant-color-border)', borderRadius: 8, background: 'var(--ant-color-fill-quaternary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', marginBottom: 8, padding: '8px 8px 0', flexShrink: 0 }}>文档列表</div>
                <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', padding: 8 }}>
                  {loadingDocs ? (
                    <div style={{ textAlign: 'center', padding: 16 }}><Spin size="small" /></div>
                  ) : kbDocuments.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>暂无文档，请先上传</Text>
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

              {/* 中：原始文档预览 */}
              <div style={{ flex: 1, minWidth: 0, minHeight: 0, alignSelf: 'stretch', border: '1px solid var(--ant-color-border)', borderRadius: 8, overflow: 'hidden', background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
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
                    return <TxtPreview url={previewUrl} style={{ flex: 1, minHeight: 0 }} />
                  }
                  return (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, flexDirection: 'column', gap: 8 }}>
                      <Text type="secondary">该格式可在浏览器中打开预览</Text>
                      <a href={previewUrl} target="_blank" rel="noopener noreferrer">新标签打开</a>
                    </div>
                  )
                })()}
              </div>

              {/* 右：分段预览 */}
              <div style={{ flex: 1, minWidth: 0, minHeight: 0, alignSelf: 'stretch', border: '1px solid var(--ant-color-border)', borderRadius: 8, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13 }}>
                            {seg.text}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
                    background: '#fff',
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
                      <TxtPreview url={previewUrl} style={{ flex: 1, minHeight: 0, height: '100%' }} />
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
          </div>
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ height: '100%', minHeight: 400, background: 'transparent', overflow: 'hidden' }}>
      <Content style={{ overflow: 'auto', padding: 24, background: 'transparent', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
            知识库
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/skills/knowledge-base/new')}>
            新增知识库
          </Button>
        </div>

        <Card size="small">
          <Table<KbItem>
            dataSource={list}
            rowKey="id"
            columns={[
              { title: '库名', dataIndex: 'name', key: 'name', width: 200 },
              { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, width: 200 },
              {
                title: '分段数',
                dataIndex: 'segment_count',
                key: 'segment_count',
                width: 80,
                render: (n: number | undefined) => (n != null ? n : '-'),
              },
              {
                title: '向量库',
                dataIndex: 'vector_db_name',
                key: 'vector_db_name',
                width: 80,
                ellipsis: true,
                render: (v: string | undefined) => v ?? '-',
              },
              {
                title: '创建时间',
                dataIndex: 'create_at',
                key: 'create_at',
                width: 180,
                render: (t: string | null) => (t ? new Date(t).toLocaleString() : '-'),
              },
              {
                title: '操作',
                key: 'action',
                width: 400,
                render: (_, record) => (
                  <Space wrap>
                    <Button
                      type="link"
                      size="small"
                      icon={<FileTextOutlined />}
                      onClick={() => navigate(`/skills/knowledge-base/${record.id}`)}
                    >
                      文件预览
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openEditModal(record)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<ThunderboltOutlined />}
                      loading={vectorizingId === record.id}
                      onClick={() => handleVectorize(record)}
                    >
                      向量化
                    </Button>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                      删除
                    </Button>
                  </Space>
                ),
              },
            ]}
            loading={loadingList}
            pagination={false}
            locale={{ emptyText: '暂无知识库，请点击「新增知识库」创建' }}
          />
        </Card>

        <Modal
          title="编辑知识库"
          open={editModalOpen}
          onCancel={handleEditCancel}
          onOk={handleEditOk}
          confirmLoading={editSubmitting}
          okText="保存"
          cancelText="取消"
          destroyOnClose
        >
          <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="name"
              label="库名"
              rules={[{ required: true, message: '请输入库名' }, { pattern: /^[a-zA-Z0-9_-]+$/, message: '仅允许字母、数字、下划线、中划线' }]}
            >
              <Input placeholder="知识库名称" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={3} placeholder="选填" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  )
}
