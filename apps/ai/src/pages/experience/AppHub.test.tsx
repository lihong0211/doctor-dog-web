import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AppHub, { filterApps, type AppCard } from './AppHub'

const sampleApps: AppCard[] = [
  { id: 1, title: 'Chat with GitHub', description: '代码问答', category: '知识处理', path: '/github', icon: null, status: 'live', tags: ['RAG'] },
  { id: 2, title: 'AI 数据分析', description: '分析 CSV', category: '数据分析', path: '/data', icon: null, status: 'live', tags: ['CSV'] },
]

describe('AppHub', () => {
  it('filters by search and category', () => {
    expect(filterApps(sampleApps, '全部', 'GitHub')).toHaveLength(1)
    expect(filterApps(sampleApps, '知识处理', '')).toEqual([
      expect.objectContaining({ title: 'Chat with GitHub' }),
    ])
  })

  it('exposes filter state and a useful empty state', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><AppHub /></MemoryRouter>)
    const allFilter = screen.getByRole('button', { name: /^全部/ })
    expect(allFilter).toHaveAttribute('aria-pressed', 'true')
    await user.type(screen.getByRole('searchbox', { name: '搜索应用' }), '不存在的应用')
    expect(screen.getByText('没有找到匹配的应用')).toBeVisible()
  })
})
