import { describe, expect, it } from 'vitest'
import { aiTheme } from './antdTheme'
import { aiTokens } from './tokens'

describe('AI Tech Lab theme', () => {
  it('maps the approved semantic tokens into Ant Design', () => {
    expect(aiTokens.primary).toBe('#00C98D')
    expect(aiTokens.canvas).toBe('#07090D')
    expect(aiTheme.token?.colorPrimary).toBe(aiTokens.primary)
    expect(aiTheme.token?.colorBgBase).toBe(aiTokens.canvas)
    expect(aiTheme.token?.borderRadius).toBe(8)
    expect(aiTheme.components?.Menu).toBeDefined()
    expect(aiTheme.components?.Table).toBeDefined()
  })
})
