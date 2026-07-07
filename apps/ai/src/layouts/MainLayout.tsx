import { Layout, Menu, Typography, Tabs } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  ApiOutlined,
  DatabaseOutlined,
  CodeOutlined,
  LinkOutlined,
  ToolOutlined,
  CloudOutlined,
  SwapOutlined,
  RobotOutlined,
  ExperimentOutlined,
  BookOutlined,
  HomeOutlined,
} from '@ant-design/icons'

const { Sider, Content } = Layout
const { Text } = Typography

// ─── Hub sidebar (体验中心) ─────────────────────────────────────────────────
const hubSidebarItems = [
  {
    key: 'hub-group',
    type: 'group' as const,
    label: <Text type="secondary" style={{ fontSize: 11, letterSpacing: 1 }}>应用中心</Text>,
    children: [
      { key: '/hub', icon: <HomeOutlined />, label: '应用广场' },
    ],
  },
]

// ─── Skills sidebar (技能中心) — 核心 AI 技术能力 ──────────────────────────
const skillsSidebarItems = [
  {
    key: 'skills-group',
    type: 'group' as const,
    label: <Text type="secondary" style={{ fontSize: 11, letterSpacing: 1 }}>核心技术</Text>,
    children: [
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
    ],
  },
]

function getSection(pathname: string): 'hub' | 'skills' {
  if (pathname === '/hub') return 'hub'
  return 'skills'
}

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const isPortal = location.pathname === '/portal'
  const section = getSection(location.pathname)

  // Which sidebar to show
  const sidebarItems = section === 'hub' ? hubSidebarItems : skillsSidebarItems

  // Determine selected menu key
  const allKeys = sidebarItems.flatMap(g =>
    (g.children || []).map(item => (item as { key: string }).key)
  )
  const selectedKey =
    allKeys.find(k => location.pathname === k || (k !== '/hub' && location.pathname.startsWith(k))) || ''

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('/')) navigate(key)
  }

  const handleTabChange = (key: string) => {
    if (key === 'hub') navigate('/hub')
    else navigate('/skills/vector-db')
  }

  // Skills and hub manage their own scroll; parent must be overflow:hidden
  const contentHidden = true

  if (isPortal) {
    return (
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <Content style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Outlet />
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top navigation bar ── */}
      <div style={{
        height: 52,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        gap: 32,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RobotOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <Text strong style={{ fontSize: 15 }}>AI Tech Lab</Text>
        </div>

        {/* Top-level section tabs */}
        <Tabs
          activeKey={section}
          onChange={handleTabChange}
          size="large"
          style={{ marginBottom: 0, flex: 1 }}
          tabBarStyle={{ marginBottom: 0, borderBottom: 'none' }}
          items={[
            { key: 'hub', label: '体验中心' },
            { key: 'skills', label: '技能中心' },
          ]}
        />
      </div>

      {/* ── Body: Sider + Content ── */}
      <Layout style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Sider
          width={200}
          style={{ background: '#fafafa', borderRight: '1px solid #f0f0f0' }}
        >
          <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingTop: 8 }}>
            <Menu
              mode="inline"
              selectedKeys={selectedKey ? [selectedKey] : []}
              onClick={handleMenuClick}
              style={{ borderRight: 0, background: '#fafafa' }}
              items={sidebarItems}
            />
          </div>
        </Sider>

        <Layout style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Content
            style={{
              flex: 1,
              minHeight: 0,
              overflow: contentHidden ? 'hidden' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              background: 'transparent',
            }}
          >
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}
