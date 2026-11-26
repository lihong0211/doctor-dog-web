import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FineTuning from './FineTuning'
import * as api from '../../service/finetuning'

vi.mock('../../service/finetuning', () => ({
  finetuningChat: vi.fn(), finetuningChatStream: vi.fn(), finetuningChatStreamCompare: vi.fn(),
}))
vi.mock('../../components/AskInput', () => ({
  default: ({ value, onChange, onSend }: { value: string; onChange: (value: string) => void; onSend: () => void }) =>
    <div><input aria-label="问题" value={value} onChange={event => onChange(event.target.value)} /><button onClick={onSend}>发送</button></div>,
}))

beforeEach(() => {
  vi.resetAllMocks()
  Element.prototype.scrollIntoView = vi.fn()
  vi.mocked(api.finetuningChatStream).mockImplementation(async (_payload, callbacks) => {
    callbacks.onChunk('微调回答')
    callbacks.onDone()
  })
  vi.mocked(api.finetuningChatStreamCompare).mockImplementation(async (_payload, callbacks) => {
    callbacks.onBaseChunk('原版回答')
    callbacks.onLoraChunk('微调回答')
    callbacks.onDone()
  })
})

it('uses one model by default and preserves the chosen LoRA', async () => {
  const user = userEvent.setup()
  render(<FineTuning />)
  await user.click(screen.getByRole('button', { name: /法律咨询 LoRA/ }))
  await user.type(screen.getByLabelText('问题'), '试用期最长多久？')
  await user.click(screen.getByRole('button', { name: '发送' }))
  await screen.findByText('微调回答')
  expect(api.finetuningChatStream).toHaveBeenCalledWith(expect.objectContaining({ lora: 'legal' }), expect.any(Object))
  expect(api.finetuningChatStreamCompare).not.toHaveBeenCalled()
})

it('loads both models only when comparison is explicitly enabled', async () => {
  const user = userEvent.setup()
  render(<FineTuning />)
  await user.click(screen.getByLabelText('对比基座模型'))
  await user.type(screen.getByLabelText('问题'), '我头痛怎么办？')
  await user.click(screen.getByRole('button', { name: '发送' }))
  await screen.findByText('原版回答')
  expect(api.finetuningChatStreamCompare).toHaveBeenCalled()
  expect(api.finetuningChatStream).not.toHaveBeenCalled()
})

it('preserves the chosen LoRA and comparison mode when falling back to non-streaming', async () => {
  vi.mocked(api.finetuningChatStream).mockRejectedValue(new Error('stream unavailable'))
  vi.mocked(api.finetuningChat).mockResolvedValue({ code: 0, base: '', lora: '备用回答' })
  const user = userEvent.setup()
  render(<FineTuning />)
  await user.click(screen.getByRole('button', { name: /法律咨询 LoRA/ }))
  await user.type(screen.getByLabelText('问题'), '试用期最长多久？')
  await user.click(screen.getByRole('button', { name: '发送' }))
  await waitFor(() => expect(api.finetuningChat).toHaveBeenCalledWith(expect.objectContaining({ lora: 'legal', compare: false })))
  expect(await screen.findByText('备用回答')).toBeInTheDocument()
})
