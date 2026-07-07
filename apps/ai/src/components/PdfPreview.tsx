/**
 * PDF 预览：仅渲染正文铺满容器，无缩略图、无工具栏（基于 react-pdf）
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Spin } from 'antd'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// 使用与 react-pdf 内置 pdfjs 相同的版本，从 CDN 加载对应的 worker（3.x 为 .js）
// 若后续有 CSP 限制，可改为将 worker 拷贝到 public 并改为相对路径
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface PdfPreviewProps {
  /** 预览 URL（同源或后端代理可访问） */
  url: string
  className?: string
  style?: React.CSSProperties
}

export default function PdfPreview({ url, className, style }: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
    setError(null)
  }, [])

  const onDocumentLoadError = useCallback((e: Error) => {
    setError(e?.message || 'PDF 加载失败')
    setNumPages(null)
  }, [])

  // 根据容器宽度缩放，铺满
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const updateWidth = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setWidth(w)
    }
    updateWidth()
    const ro = new ResizeObserver(updateWidth)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (error) {
    return (
      <div className={className} style={{ padding: 24, color: 'var(--ant-color-error)', ...style }}>
        {error}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ overflow: 'auto', ...style }}
    >
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Spin tip="加载 PDF…" />
          </div>
        }
      >
        {numPages != null &&
          Array.from(new Array(numPages), (_, i) => (
            <Page
              key={i}
              pageNumber={i + 1}
              width={width}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          ))}
      </Document>
    </div>
  )
}
