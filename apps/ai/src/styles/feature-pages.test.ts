import { readFileSync, readdirSync } from 'node:fs'
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

  it('does not allow light hard-coded backgrounds on feature page root layouts', () => {
    const pageFiles = readdirSync('src/pages')
      .filter(file => file.endsWith('.tsx'))
      .map(file => `src/pages/${file}`)
    const offenders = pageFiles.filter(file => {
      const source = readFileSync(file, 'utf8')
      return /<Layout style=\{\{ height: '100%', background: '#f/i.test(source)
    })

    expect(offenders).toEqual([])
  })
})
