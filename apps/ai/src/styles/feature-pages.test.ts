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

  it('keeps shared skill workspaces and composers on dark theme surfaces', () => {
    const globalCss = readFileSync('src/index.css', 'utf8')
    const askInputCss = readFileSync('src/components/AskInput/index.css', 'utf8')
    const mcpCss = readFileSync('src/pages/MCP/MCPGaode.css', 'utf8')

    expect(globalCss).toContain('--ds-bg-secondary: var(--ai-surface-1)')
    expect(globalCss).toContain('--ds-text-secondary: var(--ai-text-secondary)')
    expect(askInputCss).toContain('background: var(--ai-surface-1)')
    expect(askInputCss).toContain('background: var(--ai-surface-2)')
    expect(mcpCss).toMatch(/\.mcp-gaode\s*\{[^}]*background: var\(--ai-canvas\)/s)
    expect(mcpCss).toMatch(/\.mcp-gaode-sidebar\s*\{[^}]*background: var\(--ai-surface-1\)/s)
    expect(mcpCss).toMatch(/\.mcp-unified\s*\{[^}]*background: var\(--ai-canvas\)/s)
    expect(mcpCss).not.toMatch(/background[^;]*(?:#f[0-9a-f]{5}|rgba\(255\s*,\s*255\s*,\s*255)/i)
  })
})
