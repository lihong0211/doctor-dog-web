import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('App routing', () => {
  it('opens the skills center by default', () => {
    const source = readFileSync('src/App.tsx', 'utf8')
    const rootIndexRoute = source.match(
      /<Route path="\/" element=\{<MainLayout \/>\}>\s*(<Route index [^\n]+\/>)/,
    )?.[1]

    expect(rootIndexRoute).toBe(
      '<Route index element={<Navigate to="/skills/vector-db" replace />} />',
    )
  })
})
