import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Layout,
  Typography,
  Input,
  Button,
  Select,
  Form,
  message,
  Card,
  Space,
  Table,
  Modal,
  Drawer,
  AutoComplete,
} from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import {
  createVectorDb,
  listVectorDbs,
  getVectorDbDetail,
  getVectorDbCategories,
  getVectorDbDocuments,
  updateDocument,
  addDocument,
  deleteVectorDb,
  deleteDocument,
  rebuildVectorDb,
  searchVectorDb,
  updateVectorDbMeta,
  type SearchResultItem,
  type VectorDbItem,
  type VectorDbDetail,
  type VectorDbCategoryItem,
  type VectorDbDocumentItem,
} from '../service/vector-db'

const { Content } = Layout
const { Title } = Typography

const NAME_REG = /^[a-zA-Z0-9_-]+$/
const PAGE_SIZE = 10

/** 列表页：仅新建名称+描述；编辑跳转独立页 */
export default function VectorDb() {
  const { id: routeId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const id = routeId ? Number(routeId) : undefined

  const [dbList, setDbList] = useState<VectorDbItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm] = Form.useForm()
  const [editMetaModalOpen, setEditMetaModalOpen] = useState(false)
  const [editingMetaItem, setEditingMetaItem] = useState<VectorDbItem | null>(null)
  const [editMetaSubmitting, setEditMetaSubmitting] = useState(false)
  const [editMetaForm] = Form.useForm<{ description: string }>()

  const loadList = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await listVectorDbs()
      setDbList(res.list ?? [])
    } catch (e) {
      message.error(e instanceof Error ? e.message : '获取库列表失败')
      setDbList([])
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  const handleCreate = async () => {
    const { name, description } = await createForm.validateFields().catch(() => null)
    if (name == null) return
    if (!NAME_REG.test(name)) {
      message.warning('库名仅允许 a-zA-Z0-9_-')
      return
    }
    setCreateLoading(true)
    try {
      const data = await createVectorDb({ name, description: description || undefined, documents: [] })
      message.success(`创建成功：${data.name}`)
      loadList()
      setCreateDrawerOpen(false)
      createForm.resetFields()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '创建失败')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteDb = (item: VectorDbItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除向量库「${item.name}」吗？将同时删除该库下所有文档与索引。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteVectorDb({ id: item.id })
          message.success('已删除')
          loadList()
        } catch (e) {
          message.error(e instanceof Error ? e.message : '删除失败')
        }
      },
    })
  }

  const openEditMetaModal = (item: VectorDbItem) => {
    setEditingMetaItem(item)
    editMetaForm.setFieldsValue({ description: item.description ?? '' })
    setEditMetaModalOpen(true)
  }

  const handleEditMetaCancel = () => {
    setEditMetaModalOpen(false)
    setEditingMetaItem(null)
    editMetaForm.resetFields()
  }

  const handleEditMetaOk = async () => {
    if (editingMetaItem == null) return
    try {
      const { description } = await editMetaForm.validateFields()
      setEditMetaSubmitting(true)
      await updateVectorDbMeta({
        id: editingMetaItem.id,
        description: description?.trim() ?? '',
      })
      message.success('已更新说明')
      handleEditMetaCancel()
      loadList()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error(e instanceof Error ? e.message : '更新失败')
    } finally {
      setEditMetaSubmitting(false)
    }
  }

  // 编辑页（独立页面，路由带 id）
  if (id != null && !Number.isNaN(id)) {
    return (
      <EmbeddingEditPage
        dbId={id}
        onBack={() => navigate('/skills/vector-db')}
        dbList={dbList}
      />
    )
  }

  // 列表页
  return (
    <Layout style={{ height: '100%', minHeight: 400, background: 'transparent', overflow: 'hidden' }}>
      <Content style={{ overflow: 'auto', padding: 24, background: 'transparent', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
            向量数据库
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateDrawerOpen(true)}>
            新增向量数据库
          </Button>
        </div>

        <Card size="small">
          <Table<VectorDbItem>
            dataSource={dbList}
            rowKey="id"
            columns={[
              { title: '库名', dataIndex: 'name', key: 'name', width: 160 },
              { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
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
                width: 220,
                render: (_, record) => (
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/skills/vector-db/${record.id}`)}
                    >
                      管理
                    </Button>
                    <Button type="link" size="small" onClick={() => openEditMetaModal(record)}>
                      编辑
                    </Button>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteDb(record)}>
                      删除
                    </Button>
                  </Space>
                ),
              },
            ]}
            loading={loadingList}
            pagination={false}
            locale={{ emptyText: '暂无向量库，请点击「新增向量数据库」创建' }}
          />
        </Card>

        <Modal
          title="编辑说明"
          open={editMetaModalOpen}
          onCancel={handleEditMetaCancel}
          onOk={handleEditMetaOk}
          confirmLoading={editMetaSubmitting}
          okText="保存"
          cancelText="取消"
          destroyOnClose
        >
          <Form form={editMetaForm} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item name="description" label="说明">
              <Input.TextArea rows={3} placeholder="向量库说明，可为空" />
            </Form.Item>
          </Form>
        </Modal>

        <Drawer
          title="新增向量数据库"
          open={createDrawerOpen}
          onClose={() => setCreateDrawerOpen(false)}
          width={480}
          destroyOnClose
          footer={
            <Space>
              <Button onClick={() => setCreateDrawerOpen(false)}>取消</Button>
              <Button type="primary" loading={createLoading} onClick={() => createForm.submit()}>
                保存
              </Button>
            </Space>
          }
        >
          <Form form={createForm} layout="vertical" onFinish={handleCreate}>
            <Form.Item
              name="name"
              label="库名（仅 a-zA-Z0-9_-）"
              rules={[
                { required: true, message: '请输入库名' },
                { pattern: NAME_REG, message: '仅允许字母、数字、下划线、中划线' },
              ]}
            >
              <Input placeholder="如 disney_faq" />
            </Form.Item>
            <Form.Item name="description" label="描述（可选）">
              <Input placeholder="如 迪士尼常见问题" />
            </Form.Item>
          </Form>
        </Drawer>

      </Content>
    </Layout>
  )
}

/** 编辑页：某库下的文档列表，分页、按分类筛选，新增/编辑/删除文档 */
function EmbeddingEditPage({
  dbId,
  onBack,
  dbList,
}: {
  dbId: number
  onBack: () => void
  dbList: VectorDbItem[]
}) {
  const dbItem = dbList.find((d) => d.id === dbId)
  const [detail, setDetail] = useState<VectorDbDetail | null>(null)
  const [categories, setCategories] = useState<VectorDbCategoryItem[]>([])
  const [docList, setDocList] = useState<VectorDbDocumentItem[]>([])
  const [docTotal, setDocTotal] = useState(0)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<VectorDbDocumentItem | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResultItem[] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchForm] = Form.useForm()
  const [rebuildLoading, setRebuildLoading] = useState(false)

  const loadDetail = useCallback(async () => {
    setLoadingDetail(true)
    try {
      const [d, catList] = await Promise.all([
        getVectorDbDetail({ id: dbId, db_id: dbId, with_documents: false }),
        getVectorDbCategories({ db_id: dbId }),
      ])
      setDetail(d)
      setCategories(catList ?? [])
    } catch (e) {
      message.error(e instanceof Error ? e.message : '获取库详情失败')
    } finally {
      setLoadingDetail(false)
    }
  }, [dbId])

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true)
    try {
      const res = await getVectorDbDocuments({
        db_id: dbId,
        page,
        page_size: PAGE_SIZE,
        category: categoryFilter,
      })
      setDocList(res.list ?? [])
      setDocTotal(res.total ?? 0)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '获取文档列表失败')
      setDocList([])
      setDocTotal(0)
    } finally {
      setLoadingDocs(false)
    }
  }, [dbId, page, categoryFilter])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  useEffect(() => {
    setPage(1)
  }, [categoryFilter])

  const handleAddDoc = async () => {
    const { text, category } = await addForm.validateFields().catch(() => null)
    if (!text?.trim()) return
    setSubmitLoading(true)
    try {
      await addDocument({
        db_id: dbId,
        text: text.trim(),
        category: (category ?? '').trim() || undefined,
      })
      message.success('文档已新增')
      setAddModalOpen(false)
      addForm.resetFields()
      loadDocuments()
      loadDetail()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '新增失败')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEditDoc = async () => {
    if (!editingDoc) return
    const { text, category } = await editForm.validateFields().catch(() => null)
    if (!text?.trim()) return
    setSubmitLoading(true)
    try {
      await updateDocument({
        db_id: dbId,
        doc_id: editingDoc.doc_id,
        text: text.trim(),
        category: (category ?? '').trim() || undefined,
      })
      message.success('文档已更新')
      setEditModalOpen(false)
      setEditingDoc(null)
      editForm.resetFields()
      loadDocuments()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '更新失败')
    } finally {
      setSubmitLoading(false)
    }
  }

  const dbName = detail?.name ?? dbItem?.name ?? ''

  const handleSearch = async () => {
    const { query, top_k } = await searchForm.validateFields().catch(() => null)
    if (!query?.trim() || !dbName) return
    setSearchLoading(true)
    setSearchResults(null)
    setSearchQuery(query.trim())
    try {
      const data = await searchVectorDb({ db: dbName, query: query.trim(), top_k: top_k ?? 3 })
      setSearchResults(data.results || [])
    } catch (e) {
      message.error(e instanceof Error ? e.message : '查询失败')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleRebuild = async () => {
    if (!dbName) return
    setRebuildLoading(true)
    try {
      await rebuildVectorDb({ name: dbName })
      message.success('重建向量完成')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '重建失败')
    } finally {
      setRebuildLoading(false)
    }
  }

  const handleDeleteDoc = (doc: VectorDbDocumentItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文档「${doc.doc_id}」吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setDeleteLoading(doc.doc_id)
        try {
          await deleteDocument({ db_id: dbId, doc_id: doc.doc_id })
          message.success('已删除')
          loadDocuments()
        } catch (e) {
          message.error(e instanceof Error ? e.message : '删除失败')
        } finally {
          setDeleteLoading(null)
        }
      },
    })
  }

  const openEditModal = (doc: VectorDbDocumentItem) => {
    setEditingDoc(doc)
    editForm.setFieldsValue({ text: doc.text, category: doc.category ?? '' })
    setEditModalOpen(true)
  }

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.name }))

  return (
    <Layout style={{ height: '100%', minHeight: 400, background: 'transparent', overflow: 'hidden' }}>
      <Content style={{ overflow: 'auto', padding: 24, background: 'transparent', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
              返回列表
            </Button>
            <Title level={5} style={{ margin: 0, color: 'var(--ds-text)', fontWeight: 600 }}>
              {loadingDetail ? '加载中...' : detail?.name ?? dbItem?.name ?? `库 ${dbId}`}
            </Title>
          </div>
          <Space>
            <Button loading={rebuildLoading} onClick={handleRebuild}>
              重建向量
            </Button>
            <Button icon={<SearchOutlined />} onClick={() => setSearchDrawerOpen(true)}>
              查询向量数据库
            </Button>
          </Space>
        </div>

        {detail && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary">描述：</Typography.Text>{' '}
            {detail.description || '-'}
          </Card>
        )}

        <Card
          size="small"
          title="文档列表（向量文本）"
          extra={
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
              新增文档
            </Button>
          }
        >
          <Space style={{ marginBottom: 12 }}>
            <Typography.Text type="secondary">按分类：</Typography.Text>
            <Select
              placeholder="全部分类"
              allowClear
              style={{ width: 140 }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[{ label: '全部分类', value: undefined }, ...categoryOptions]}
            />
          </Space>
          <Table<VectorDbDocumentItem>
            dataSource={docList}
            rowKey="doc_id"
            loading={loadingDocs}
            size="small"
            columns={[
              { title: 'doc_id', dataIndex: 'doc_id', key: 'doc_id', width: 100, ellipsis: true },
              {
                title: '文本',
                dataIndex: 'text',
                key: 'text',
                ellipsis: true,
                render: (t: string) => (t && t.length > 80 ? `${t.slice(0, 80)}...` : t),
              },
              { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
              {
                title: '创建时间',
                dataIndex: 'create_at',
                key: 'create_at',
                width: 160,
                render: (t: string | null) => (t ? new Date(t).toLocaleString() : '-'),
              },
              {
                title: '操作',
                key: 'action',
                width: 140,
                render: (_, record) => (
                  <Space>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                      编辑
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={deleteLoading === record.doc_id}
                      onClick={() => handleDeleteDoc(record)}
                    >
                      删除
                    </Button>
                  </Space>
                ),
              },
            ]}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total: docTotal,
              showSizeChanger: false,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p) => setPage(p),
            }}
            locale={{ emptyText: '暂无文档，点击「新增文档」添加' }}
          />
        </Card>

        <Modal
          title="新增文档"
          open={addModalOpen}
          onCancel={() => setAddModalOpen(false)}
          footer={
            <Space>
              <Button onClick={() => setAddModalOpen(false)}>取消</Button>
              <Button type="primary" loading={submitLoading} onClick={() => addForm.submit()}>
                保存
              </Button>
            </Space>
          }
        >
          <Form form={addForm} layout="vertical" onFinish={handleAddDoc}>
            <Form.Item name="category" label="分类（可选）">
              <AutoComplete
                placeholder="选择已有分类或输入新分类"
                allowClear
                options={categoryOptions.map((o) => ({ value: o.value }))}
              />
            </Form.Item>
            <Form.Item name="text" label="文本" rules={[{ required: true, message: '请输入文本' }]}>
              <Input.TextArea rows={4} placeholder="文档内容" />
            </Form.Item>
            
          </Form>
        </Modal>

        <Modal
          title="编辑文档"
          open={editModalOpen}
          onCancel={() => { setEditModalOpen(false); setEditingDoc(null) }}
          footer={
            <Space>
              <Button onClick={() => { setEditModalOpen(false); setEditingDoc(null) }}>取消</Button>
              <Button type="primary" loading={submitLoading} onClick={() => editForm.submit()}>
                保存
              </Button>
            </Space>
          }
        >
          <Form form={editForm} layout="vertical" onFinish={handleEditDoc}>
          <Form.Item name="category" label="分类（可选）">
              <AutoComplete
                placeholder="选择已有分类或输入新分类"
                allowClear
                options={categoryOptions.map((o) => ({ value: o.value }))}
              />
            </Form.Item>
            <Form.Item name="text" label="文本" rules={[{ required: true, message: '请输入文本' }]}>
              <Input.TextArea rows={4} placeholder="文档内容" />
            </Form.Item>
            
          </Form>
        </Modal>

        <Drawer
          title="向量查询"
          open={searchDrawerOpen}
          onClose={() => setSearchDrawerOpen(false)}
          width={560}
          destroyOnClose
        >
          <Form form={searchForm} layout="vertical" onFinish={handleSearch} initialValues={{ top_k: 3 }}>
            <Form.Item name="query" label="问题 / 检索文本" rules={[{ required: true, message: '请输入问题' }]}>
              <Input.TextArea rows={2} placeholder="门票怎么退款？/ 我腹泻怎么办？" />
            </Form.Item>
            <Form.Item name="top_k" label="返回条数">
              <Select options={[1, 2, 3, 5, 10, 20].map((n) => ({ label: String(n), value: n }))} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={searchLoading}>
                查询
              </Button>
            </Form.Item>
          </Form>
          {searchResults !== null && (
            <div style={{ marginTop: 16 }}>
              <Typography.Text type="secondary">查询「{searchQuery}」结果：</Typography.Text>
              <div style={{ marginTop: 8 }}>
                {searchResults.length === 0 ? (
                  <Typography.Text type="secondary">无匹配结果</Typography.Text>
                ) : (
                  searchResults.map((item, i) => (
                    <Card key={i} size="small" style={{ marginBottom: 8, background: 'var(--ds-bg)' }}>
                      <div style={{ fontSize: 12, color: 'var(--ds-text-muted)', marginBottom: 4 }}>
                        rank {item.rank} · distance {item.distance.toFixed(4)}
                        {item.doc.category != null && item.doc.category !== '' && (
                          <span style={{ marginLeft: 8 }}>· 分类：{item.doc.category}</span>
                        )}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', color: 'var(--ds-text)', lineHeight: 1.6 }}>
                        {item.doc.text ?? item.doc.content ?? '-'}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </Drawer>
      </Content>
    </Layout>
  )
}
