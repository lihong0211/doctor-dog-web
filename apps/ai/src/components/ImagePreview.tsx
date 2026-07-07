/**
 * 图片预览：使用预览 URL 内联显示（后端返回 mimetype + as_attachment=False）
 */
interface ImagePreviewProps {
  url: string
  alt?: string
  className?: string
  style?: React.CSSProperties
}

export default function ImagePreview({ url, alt = '', className, style }: ImagePreviewProps) {
  return (
    <div
      className={className}
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'var(--ant-color-fill-quaternary)',
        ...style,
      }}
    >
      <img
        src={url}
        alt={alt}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />
    </div>
  )
}
