import { useState, useEffect, useMemo } from 'react'
import { Input, List, Spin, Empty, Typography, Tooltip } from 'antd'
import { SearchOutlined, FilePdfOutlined, FileTextOutlined, FileOutlined } from '@ant-design/icons'
import { listFiles, getFilePreviewUrl, canPreviewInBrowser, type FileItem } from '../service/file'
import { listKnowledgeBaseDocuments, getDocumentPreviewUrl, type KnowledgeBaseDocumentItem } from '../service/knowledge-base'
import { usePdfPreview, isImageFileName } from '../utils/preview'
import PdfPreview from './PdfPreview'
import ImagePreview from './ImagePreview'
import TxtPreview from './TxtPreview'

const { Text } = Typography

interface DocumentListProps {
  /** 知识库/向量库 id，用于拉取文件列表 */
  kbId: number | string
  /** 是否显示右侧预览区 */
  showPreview?: boolean
  /** 列表样式 */
  listStyle?: React.CSSProperties
  /** 为 true 时使用与「分段预览」相同的接口：GET /ai/knowledge-base/documents、GET .../document/<id>/preview */
  useKnowledgeBaseApi?: boolean
}

function fileIcon(name: string) {
  const n = name.toLowerCase()
  if (n.endsWith('.pdf')) return <FilePdfOutlined style={{ color: '#c00' }} />
  if (n.endsWith('.txt') || n.endsWith('.md')) return <FileTextOutlined />
  return <FileOutlined />
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function DocumentList({ kbId, showPreview = true, listStyle, useKnowledgeBaseApi = false }: DocumentListProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [kbDocs, setKbDocs] = useState<KnowledgeBaseDocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<FileItem | null>(null)
  const [selectedKbDoc, setSelectedKbDoc] = useState<KnowledgeBaseDocumentItem | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    if (useKnowledgeBaseApi) {
      const id = typeof kbId === 'string' ? parseInt(kbId, 10) : kbId
      if (Number.isNaN(id)) {
        setKbDocs([])
        setLoading(false)
        return
      }
      listKnowledgeBaseDocuments({ kb_id: id })
        .then((res) => {
          if (!cancelled) setKbDocs(res.list ?? [])
        })
        .catch(() => {
          if (!cancelled) setKbDocs([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    } else {
      listFiles(kbId)
        .then((list) => {
          if (!cancelled) setFiles(list)
        })
        .catch(() => {
          if (!cancelled) setFiles([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }
    return () => { cancelled = true }
  }, [kbId, useKnowledgeBaseApi])

  const filteredFiles = useMemo(() => {
    if (!keyword.trim()) return files
    const k = keyword.trim().toLowerCase()
    return files.filter((f) => f.name.toLowerCase().includes(k))
  }, [files, keyword])

  const filteredKbDocs = useMemo(() => {
    if (!keyword.trim()) return kbDocs
    const k = keyword.trim().toLowerCase()
    return kbDocs.filter((d) => (d.file_name || '').toLowerCase().includes(k))
  }, [kbDocs, keyword])

  const list = useKnowledgeBaseApi ? filteredKbDocs : filteredFiles
  const previewUrl = useKnowledgeBaseApi
    ? (selectedKbDoc ? getDocumentPreviewUrl(selectedKbDoc.id) : null)
    : (selected ? getFilePreviewUrl(selected) : null)
  const displayName = useKnowledgeBaseApi ? (selectedKbDoc?.file_name ?? '') : (selected?.name ?? '')
  const isPdf = (useKnowledgeBaseApi ? selectedKbDoc : selected) && usePdfPreview(displayName || '')
  const isTxt = (useKnowledgeBaseApi ? selectedKbDoc : selected) && /\.(txt|md)$/i.test(displayName || '')
  const isImage = (useKnowledgeBaseApi ? selectedKbDoc : selected) && isImageFileName(displayName || '')

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 320, gap: 16 }}>
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', ...listStyle }}>
        <Input
          placeholder="搜索"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ marginBottom: 8 }}
        />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Spin />
            </div>
          ) : list.length === 0 ? (
            <Empty description="暂无文档" />
          ) : useKnowledgeBaseApi ? (
            <List
              size="small"
              dataSource={filteredKbDocs}
              renderItem={(item: KnowledgeBaseDocumentItem) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background: selectedKbDoc?.id === item.id ? 'var(--ant-color-primary-bg)' : undefined,
                    borderRadius: 4,
                    padding: '8px 12px',
                  }}
                  onClick={() => { setSelectedKbDoc(item); setSelected(null) }}
                >
                  <span style={{ marginRight: 8 }}>{fileIcon(item.file_name || '')}</span>
                  <Tooltip title={item.file_name || ''} placement="topLeft">
                    <Text ellipsis style={{ flex: 1 }}>
                      {item.file_name}
                    </Text>
                  </Tooltip>
                  {item.segment_count != null && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.segment_count} 段
                    </Text>
                  )}
                </List.Item>
              )}
            />
          ) : (
            <List
              size="small"
              dataSource={filteredFiles}
              renderItem={(item: FileItem) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background: selected?.id === item.id ? 'var(--ant-color-primary-bg)' : undefined,
                    borderRadius: 4,
                    padding: '8px 12px',
                  }}
                  onClick={() => { setSelected(item); setSelectedKbDoc(null) }}
                >
                  <span style={{ marginRight: 8 }}>{fileIcon(item.name)}</span>
                  <Tooltip title={item.name} placement="topLeft">
                    <Text ellipsis style={{ flex: 1 }}>
                      {item.name}
                    </Text>
                  </Tooltip>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatSize(item.size)}
                  </Text>
                </List.Item>
              )}
            />
          )}
        </div>
      </div>

      {showPreview && (
        <div style={{ flex: 1, minWidth: 0, border: '1px solid var(--ant-color-border)', borderRadius: 8, overflow: 'hidden', background: '#fafafa' }}>
          {!(useKnowledgeBaseApi ? selectedKbDoc : selected) ? (
            <Empty description="选择左侧文档预览" style={{ marginTop: 48 }} />
          ) : (
            <>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--ant-color-border)', background: '#fff' }}>
                <Text strong>{displayName}</Text>
                {!useKnowledgeBaseApi && selected && (
                  <Text type="secondary" style={{ marginLeft: 8 }}>{formatSize(selected.size)}</Text>
                )}
                {useKnowledgeBaseApi && selectedKbDoc?.segment_count != null && (
                  <Text type="secondary" style={{ marginLeft: 8 }}>{selectedKbDoc.segment_count} 段</Text>
                )}
              </div>
              <div style={{ height: 'calc(100% - 48px)', overflow: 'auto' }}>
                {isPdf && previewUrl && (
                  <PdfPreview
                    url={previewUrl}
                    style={{ width: '100%', height: '100%', minHeight: 480 }}
                  />
                )}
                {isImage && previewUrl && (
                  <ImagePreview url={previewUrl} alt={displayName} style={{ minHeight: 480 }} />
                )}
                {isTxt && previewUrl && (
                  <TxtPreview url={previewUrl} />
                )}
                {!isPdf && !isImage && !isTxt && previewUrl && (useKnowledgeBaseApi || (selected && canPreviewInBrowser(selected))) && (
                  <div style={{ padding: 24 }}>
                    <Text type="secondary">该格式可在浏览器中打开</Text>
                    <br />
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer">新标签打开</a>
                  </div>
                )}
                {!useKnowledgeBaseApi && selected && !canPreviewInBrowser(selected) && !isPdf && !isImage && !isTxt && previewUrl && (
                  <div style={{ padding: 24 }}>
                    <Empty description="该格式需后端转 PDF 后预览，或直接下载" />
                    <a href={previewUrl!} target="_blank" rel="noopener noreferrer">
                      下载文件
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

