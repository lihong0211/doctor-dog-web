import { describe, expect, it } from 'vitest'
import { enTokens } from './tokens'
import { enTheme } from './antdTheme'

describe('EN dark workbench theme', () => {
  it('uses the approved AI-family dark tokens', () => {
    expect(enTokens.primary).toBe('#00C98D')
    expect(enTokens.canvas).toBe('#07090D')
    expect(enTheme.token?.colorPrimary).toBe(enTokens.primary)
    expect(enTheme.token?.colorBgBase).toBe(enTokens.canvas)
    expect(enTheme.components?.Table).toBeDefined()
    expect(enTheme.components?.Menu).toBeDefined()
    expect(enTheme.components?.Drawer).toBeDefined()
  })
})
