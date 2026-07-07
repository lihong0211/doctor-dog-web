/**
 * AI 门户 - 以周期表形式展示，每个元素对应一个 AI 网站，点击跳转
 * 顶部为分类图例卡片，下方为周期表 iframe
 */
import { useEffect } from 'react'
import { PORTAL_SITES, CATEGORY_COLORS } from '../data/portalSites'
import { AI_PRODUCTS_BY_CATEGORY } from '../data/aiProductsByCategory'

declare global {
  interface Window {
    __PORTAL_SITES__?: typeof PORTAL_SITES
    __PORTAL_CATEGORY_COLORS__?: typeof CATEGORY_COLORS
  }
}

const CARD_SIZE = { width: 80, height: 36 }

export default function Portal() {
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'PORTAL_OPEN_URL' && typeof e.data.url === 'string' && e.data.url) {
        window.open(e.data.url, '_blank', 'noopener,noreferrer')
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (typeof window !== 'undefined') {
    window.__PORTAL_SITES__ = PORTAL_SITES
    window.__PORTAL_CATEGORY_COLORS__ = CATEGORY_COLORS
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000' }}>
      <div
        style={{
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          padding: '12px 16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        {AI_PRODUCTS_BY_CATEGORY.map((cat) => (
          <div
            key={cat.key}
            style={{
              width: CARD_SIZE.width + 20,
              height: CARD_SIZE.height,
              minWidth: CARD_SIZE.width,
              minHeight: CARD_SIZE.height,
              backgroundColor: CATEGORY_COLORS[cat.key] ?? CATEGORY_COLORS[''],
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.95)',
            }}
            title={cat.label}
          >
            {cat.key}
          </div>
        ))}
      </div>
      <iframe
        src={`${import.meta.env.BASE_URL}portal.html`}
        title="Portal"
        style={{
          display: 'block',
          flex: 1,
          width: '100%',
          minHeight: 0,
          border: 'none',
        }}
      />
    </div>
  )
}
