import { useState } from 'react'
import { Empty } from 'antd'
import { RightOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { APPS, CATEGORIES, type AppCard } from './appHubData'
import './AppHub.css'

const STATUS = {
  live: { label: 'LIVE', className: 'is-live' },
  'needs-api': { label: 'BETA', className: 'is-beta' },
  planned: { label: 'SOON', className: 'is-planned' },
} as const

export function filterApps(apps: AppCard[], category: string, searchText: string) {
  const query = searchText.trim().toLocaleLowerCase()
  return apps.filter(app => {
    const matchesCategory = category === '全部' || app.category === category
    const haystack = [app.title, app.description, ...(app.tags ?? [])].join(' ').toLocaleLowerCase()
    return matchesCategory && (!query || haystack.includes(query))
  })
}

function ApplicationCard({ app, onOpen }: { app: AppCard; onOpen: (path: string) => void }) {
  const clickable = app.status !== 'planned'
  const status = STATUS[app.status]
  return (
    <article className="apphub-card">
      <div className="apphub-card-top">
        <span className="apphub-card-icon">{app.icon}</span>
        <span className={`apphub-status ${status.className}`}>
          <i aria-hidden="true" />{status.label}
        </span>
      </div>
      <h2>{app.title}</h2>
      <p>{app.description}</p>
      <div className="apphub-tags" aria-label="技术标签">
        {app.tags?.map(tag => <span key={tag}>{tag}</span>)}
      </div>
      <button
        type="button"
        className="apphub-launch"
        disabled={!clickable}
        onClick={() => clickable && onOpen(app.path)}
      >
        {clickable ? '打开应用' : '即将上线'} <RightOutlined />
      </button>
    </article>
  )
}

export default function AppHubModern() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('全部')
  const [searchText, setSearchText] = useState('')
  const filtered = filterApps(APPS, activeCategory, searchText)
  const liveCount = APPS.filter(app => app.status === 'live').length

  return (
    <section className="apphub">
      <header className="apphub-header">
        <div>
          <div className="apphub-eyebrow">AI TECH LAB / APPS</div>
          <h1>大模型应用体验中心</h1>
          <p>基于 DashScope · Ollama · Qdrant 构建的 AI 应用集合</p>
        </div>
        <div className="apphub-summary" aria-label="应用状态统计">
          <span><i />{liveCount} LIVE</span>
          <small>{APPS.length} TOTAL</small>
        </div>
      </header>

      <div className="apphub-tools">
        <label className="apphub-search">
          <SearchOutlined />
          <span className="sr-only">搜索应用</span>
          <input
            type="search"
            aria-label="搜索应用"
            placeholder="搜索应用名称、标签..."
            value={searchText}
            onChange={event => setSearchText(event.target.value)}
          />
        </label>
        <div className="apphub-filters" aria-label="应用分类">
          {CATEGORIES.map(category => {
            const selected = category === activeCategory
            const count = category === '全部' ? APPS.length : APPS.filter(app => app.category === category).length
            return (
              <button
                key={category}
                type="button"
                aria-pressed={selected}
                className={selected ? 'is-active' : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}<span>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length ? (
        <div className="apphub-grid">
          {filtered.map(app => <ApplicationCard key={app.id} app={app} onOpen={navigate} />)}
        </div>
      ) : (
        <div className="apphub-empty">
          <Empty description="没有找到匹配的应用" />
        </div>
      )}
    </section>
  )
}
