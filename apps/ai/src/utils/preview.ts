/**
 * 与后端 serve_file_preview 一致：按扩展名判断预览方式
 * doc/docx/ppt/pptx/xls/xlsx 后端会转为 PDF 后返回，故也用 PdfPreview
 */

const PDF_EXT = '.pdf'
const OFFICE_TO_PDF_EXT = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'] as const
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'] as const
const TEXT_EXT = ['.txt', '.md'] as const

export function isPdfFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(PDF_EXT)
}

/** 原生 PDF 或后端会转为 PDF 的格式（doc/docx/ppt/pptx），用 PdfPreview 展示 */
export function usePdfPreview(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  if (lower.endsWith(PDF_EXT)) return true
  return OFFICE_TO_PDF_EXT.some((ext) => lower.endsWith(ext))
}

export function isImageFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return IMAGE_EXT.some((ext) => lower.endsWith(ext))
}

export function isTxtFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return TEXT_EXT.some((ext) => lower.endsWith(ext))
}

/** 上传时为防覆盖会在文件名前加 yyyyMMdd_HHmmss_ 时间戳（重复上传同名文件可能叠加多层），仅用于展示时去掉，不影响真实文件名 */
const TIMESTAMP_PREFIX_RE = /^(\d{8}_\d{6}_)+/

export function stripTimestampPrefix(fileName: string): string {
  return fileName.replace(TIMESTAMP_PREFIX_RE, '')
}
