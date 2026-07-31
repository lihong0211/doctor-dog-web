import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import MainLayout from './MainLayout'

function renderLayout(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route path="hub" element={<div>Hub content</div>} />
          <Route path="skills/vector-db" element={<div>Skill content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('MainLayout', () => {
  it('marks the skills section and skill navigation as current', () => {
    renderLayout('/skills/vector-db')
    expect(screen.getByText('AI Tech Lab')).toBeVisible()
    expect(screen.getByRole('tab', { name: '技能中心' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('navigation', { name: '技能导航' })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: /VectorDB/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByText('核心技术')).not.toBeInTheDocument()
  })

  it('uses the full content width in the experience center without navigation', () => {
    renderLayout('/hub')
    expect(screen.getByRole('tab', { name: '体验中心' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '打开技能导航' })).not.toBeInTheDocument()
    expect(screen.getByText('Hub content')).toBeVisible()
  })
})
