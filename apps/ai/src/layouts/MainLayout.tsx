import { useState, type ReactNode } from 'react'
import { Button, Drawer } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ApiOutlined, BookOutlined, CloudOutlined, CodeOutlined, DatabaseOutlined,
  ExperimentOutlined, HomeOutlined, LinkOutlined, MenuOutlined, RobotOutlined,
  SwapOutlined, ToolOutlined,
} from '@ant-design/icons'
import './MainLayout.css'

type NavItem = { key: string; label: string; icon: ReactNode }

const hubItems: NavItem[] = [
  { key: '/hub', icon: <HomeOutlined />, label: '应用广场' },
]

const skillItems: NavItem[] = [
  { key: '/skills/vector-db', icon: <ApiOutlined />, label: 'VectorDB' },
  { key: '/skills/knowledge-base', icon: <BookOutlined />, label: 'Knowledge Base' },
  { key: '/skills/rag', icon: <DatabaseOutlined />, label: 'RAG' },
  { key: '/skills/text2sql', icon: <CodeOutlined />, label: 'Text2SQL' },
  { key: '/skills/langchain', icon: <LinkOutlined />, label: 'LangChain' },
  { key: '/skills/function-call', icon: <ToolOutlined />, label: 'Function Call' },
  { key: '/skills/mcp', icon: <CloudOutlined />, label: 'MCP' },
  { key: '/skills/a2a', icon: <SwapOutlined />, label: 'A2A' },
  { key: '/skills/agent', icon: <RobotOutlined />, label: 'Agent' },
  { key: '/skills/fine-tuning', icon: <ExperimentOutlined />, label: 'Fine-tuning' },
]

function getSection(pathname: string): 'hub' | 'skills' {
  return pathname.startsWith('/skills/') ? 'skills' : 'hub'
}

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isPortal = location.pathname === '/portal'
  const section = getSection(location.pathname)
  const items = section === 'skills' ? skillItems : hubItems
  const navLabel = section === 'skills' ? '技能导航' : '体验导航'

  const go = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

  const navigation = (
    <nav className="ai-shell-nav" aria-label={navLabel}>
      <div className="ai-shell-nav-label">{section === 'skills' ? '核心技术' : '应用中心'}</div>
      <div role="menu" className="ai-shell-menu">
        {items.map(item => {
          const current = location.pathname === item.key ||
            (item.key !== '/hub' && location.pathname.startsWith(item.key))
          return (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              aria-current={current ? 'page' : undefined}
              className={`ai-shell-menu-item${current ? ' is-current' : ''}`}
              onClick={() => go(item.key)}
            >
              {item.icon}<span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )

  if (isPortal) return <main className="ai-portal"><Outlet /></main>

  return (
    <div className="ai-shell">
      <header className="ai-shell-header">
        <Button
          className="ai-shell-mobile-trigger"
          type="text"
          icon={<MenuOutlined />}
          aria-label="打开技能导航"
          onClick={() => setDrawerOpen(true)}
        />
        <div className="ai-shell-brand">
          <span className="ai-shell-logo"><RobotOutlined /></span>
          <strong>AI Tech Lab</strong>
        </div>
        <div className="ai-shell-tabs" role="tablist" aria-label="产品分区">
          <button
            role="tab"
            aria-selected={section === 'skills'}
            className={section === 'skills' ? 'is-active' : ''}
            onClick={() => go('/skills/vector-db')}
          >技能中心</button>
          <button
            role="tab"
            aria-selected={section === 'hub'}
            className={section === 'hub' ? 'is-active' : ''}
            onClick={() => go('/hub')}
          >体验中心</button>
        </div>
      </header>
      <div className="ai-shell-body">
        <aside className="ai-shell-sidebar">{navigation}</aside>
        <main className="ai-shell-content"><Outlet /></main>
      </div>
      <Drawer
        className="ai-shell-drawer"
        placement="left"
        size={280}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="AI Tech Lab"
      >
        {navigation}
      </Drawer>
    </div>
  )
}
