import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MossTTS from './MossTTS'
import * as api from '../../../service/moss-tts'

vi.mock('../../../service/moss-tts', () => ({ getMossTTSStatus: vi.fn(), mossTTSSynthesize: vi.fn() }))
vi.mock('@ant-design/icons', () => ({
  CustomerServiceOutlined: () => null, CheckCircleOutlined: () => null, CloseCircleOutlined: () => null,
  UploadOutlined: () => null, AudioOutlined: () => null, DeleteOutlined: () => null,
}))

beforeEach(() => {
  vi.resetAllMocks()
  URL.revokeObjectURL = vi.fn()
  vi.mocked(api.getMossTTSStatus).mockResolvedValue({ online: true, loaded: false, msg: '模型尚未加载（首次请求时自动触发）' })
  vi.mocked(api.mossTTSSynthesize).mockResolvedValue('blob:test-speech')
})

it('allows the first synthesis while the model is unloaded', async () => {
  const user = userEvent.setup()
  render(<MossTTS />)
  expect(await screen.findByText(/模型尚未加载/)).toBeInTheDocument()
  expect(screen.queryByText('服务未启动')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /内置音色/ }))
  await user.type(screen.getByPlaceholderText(/输入要合成的文字/), '你好')
  const generate = screen.getByRole('button', { name: /生成语音/ })
  expect(generate).toBeEnabled()
  await user.click(generate)
  expect(await screen.findByText(/下载 WAV/)).toBeInTheDocument()
  expect(api.mossTTSSynthesize).toHaveBeenCalledWith('你好', null, 'zh_1')
})
