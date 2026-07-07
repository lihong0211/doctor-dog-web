/**
 * 文本预览：请求预览 URL 获取 text/plain 并展示
 * renderAsMarkdown=true 时按 Markdown 渲染（用于 .md 文件）
 */
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface TxtPreviewProps {
  url: string
  className?: string
  style?: React.CSSProperties
  /** 为 true 时按 Markdown 渲染，否则纯文本 <pre> */
  renderAsMarkdown?: boolean
}

export default function TxtPreview({ url, className, style, renderAsMarkdown }: TxtPreviewProps) {
  const [text, setText] = useState<string>('')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setErr(null)
    fetch(url, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText)
        return r.text()
      })
      .then((t) => {
        if (!cancelled) setText(t)
      })
      .catch((e) => {
        if (!cancelled) setErr(e?.message || '加载失败')
      })
    return () => { cancelled = true }
  }, [url])

  if (err) {
    return (
      <div className={className} style={{ padding: 16, color: 'var(--ant-color-error)', ...style }}>
        {err}
      </div>
    )
  }
  if (renderAsMarkdown) {
    return (
      <div
        className={`markdown-body ${className ?? ''}`.trim()}
        style={{
          margin: 0,
          padding: 16,
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          wordBreak: 'break-word',
          ...style,
        }}
      >
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    )
  }
  return (
    <pre
      className={className}
      style={{
        margin: 0,
        padding: 16,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        ...style,
      }}
    >
      {text}
    </pre>
  )
}
