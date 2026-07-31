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

  it('keeps Fine-tuning model choices readable on dark cards', () => {
    const fineTuningSource = readFileSync('src/pages/FineTuning.tsx', 'utf8')
    const mcpCss = readFileSync('src/pages/MCP/MCPGaode.css', 'utf8')

    expect(fineTuningSource).not.toContain("color: '#1e293b'")
    expect(mcpCss).toMatch(/\.mcp-gaode-recommended-btn\s*\{[^}]*color:\s*var\(--ai-text\)/s)
    expect(mcpCss).toMatch(/\.mcp-gaode-recommended-btn\s*\{[^}]*border:[^;]*var\(--ai-border\)/s)
  })

  it('keeps Text2SQL tab content scrollable and Data pagination visible', () => {
    const globalCss = readFileSync('src/index.css', 'utf8')
    const text2SqlSource = readFileSync('src/pages/Text2SQL.tsx', 'utf8')

    expect(globalCss).toMatch(/\.text2sql-tabs-fill \.ant-tabs-body-holder\s*\{[^}]*flex:\s*1[^}]*min-height:\s*0/s)
    expect(globalCss).toMatch(/\.text2sql-tabs-fill \.ant-tabs-body\s*\{[^}]*height:\s*100%/s)
    expect(globalCss).toMatch(/\.text2sql-tabs-fill \.ant-tabs-content:not\(\.ant-tabs-content-hidden\)\s*\{[^}]*display:\s*flex[^}]*min-height:\s*0/s)
    expect(globalCss).toMatch(/\.text2sql-tabs-fill \.ant-tabs-content-hidden\s*\{[^}]*display:\s*none/s)
    expect(globalCss).not.toContain('.text2sql-tabs-fill .ant-tabs-content-holder')
    expect(globalCss).not.toContain('.text2sql-tabs-fill .ant-tabs-tabpane')
    expect(globalCss).toMatch(/\.text2sql-data-table\s*\{[^}]*height:\s*100%[^}]*display:\s*flex/s)
    expect(globalCss).toMatch(/\.text2sql-data-table \.ant-pagination\s*\{[^}]*flex-shrink:\s*0/s)
    expect(text2SqlSource).toContain('className="text2sql-data-table"')
    expect(text2SqlSource).toContain('className="text2sql-results-scroll"')
    expect(text2SqlSource).not.toContain('ResizeObserver')
    expect(text2SqlSource).toContain("y: 'max(160px, calc(100vh - 360px))'")
  })
})
