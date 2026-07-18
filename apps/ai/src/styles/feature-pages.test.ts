import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('feature page style contract', () => {
  it('provides the shared dark page patterns', () => {
    const css = readFileSync('src/styles/feature-pages.css', 'utf8')
    for (const className of [
      '.ai-page', '.ai-page-header', '.ai-panel', '.ai-chat-shell',
      '.ai-chat-messages', '.ai-chat-composer', '.ai-result-panel',
    ]) {
      expect(css).toContain(className)
    }
    expect(css).toContain('var(--ai-canvas)')
    expect(css).toContain('var(--ai-surface-2)')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('prefers-reduced-motion')
  })
})
