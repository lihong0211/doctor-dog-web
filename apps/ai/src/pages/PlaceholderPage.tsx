import { Typography } from 'antd'

const { Title } = Typography

interface PlaceholderPageProps {
  title?: string
}

export default function PlaceholderPage({ title = '功能开发中' }: PlaceholderPageProps) {
  return (
    <div style={{ background: 'var(--ds-card)', padding: 24, borderRadius: 8, textAlign: 'center', color: 'var(--ds-text-secondary)' }}>
      <Title level={4} style={{ color: 'inherit' }}>{title}</Title>
      <p style={{ marginTop: 8 }}>该页面正在规划或开发中</p>
    </div>
  )
}
