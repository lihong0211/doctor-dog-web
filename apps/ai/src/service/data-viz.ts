import request from './request'

export interface ColumnsResult {
  columns: string[]
  dtypes: Record<string, string>
  row_count: number
  preview: Record<string, unknown>[]
}

export interface ChartResult {
  image_base64: string
  generated_code: string
}

export async function getColumns(file: File): Promise<ColumnsResult> {
  const form = new FormData()
  form.append('csv', file)
  const res = await request.post('/ai/data-viz/columns', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function generateChart(file: File, question: string): Promise<ChartResult> {
  const form = new FormData()
  form.append('csv', file)
  form.append('question', question)
  const res = await request.post('/ai/data-viz/chart', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
  return res.data
}
