import { Layout, Typography, Card, Alert, Space } from 'antd'
import { CustomerServiceOutlined, LockOutlined } from '@ant-design/icons'

const { Content } = Layout
const { Title, Paragraph, Text } = Typography

export default function MusicGenerator() {
  return (
    <Layout style={{ height: '100%', background: 'var(--ai-surface-2)' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <CustomerServiceOutlined style={{ fontSize: 28, color: '#722ed1' }} />
          <Title level={3} style={{ margin: 0 }}>AI 音乐生成</Title>
        </Space>

        <Alert
          message="需要配置音乐生成 API"
          description="此功能需要 Suno AI 或其他音乐生成服务的 API Key。"
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Card title="配置说明">
          <Paragraph>
            <ol style={{ lineHeight: 2.2 }}>
              <li>注册 <a href="https://suno.com" target="_blank" rel="noopener noreferrer">Suno AI</a> 账号并获取 API Key</li>
              <li>或使用开源替代方案（如本地部署的 MusicGen）</li>
              <li>将 API Key 写入 <Text code>service-home/.env</Text> 文件：</li>
            </ol>
          </Paragraph>
          <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8, fontSize: 13 }}>
{`SUNO_API_KEY=your_suno_api_key_here`}
          </pre>
          <Paragraph style={{ marginTop: 12 }}>
            <strong>备选方案（本地无 GPU）：</strong>
            <br />使用 <Text code>edge-tts</Text> 朗读歌词代替生成音乐，或集成开源的 bark 模型（需要 GPU）。
          </Paragraph>
        </Card>
      </Content>
    </Layout>
  )
}
