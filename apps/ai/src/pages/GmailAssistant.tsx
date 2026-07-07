import { Layout, Typography, Card, Alert, Space } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'

const { Content } = Layout
const { Title, Paragraph, Text } = Typography

export default function GmailAssistant() {
  return (
    <Layout style={{ height: '100%', background: '#f5f5f5' }}>
      <Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <Space align="center" style={{ marginBottom: 20 }}>
          <MailOutlined style={{ fontSize: 28, color: '#ea4335' }} />
          <Title level={3} style={{ margin: 0 }}>Gmail 智能助手</Title>
        </Space>

        <Alert
          message="需要配置 Google OAuth"
          description="此功能需要 Google Cloud Console 的 OAuth 2.0 凭证才能使用。"
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Card title="配置步骤">
          <Paragraph>
            <ol style={{ lineHeight: 2.2 }}>
              <li>前往 <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console</a> → APIs & Services → Credentials</li>
              <li>创建 OAuth 2.0 客户端 ID（类型：Web 应用）</li>
              <li>添加授权回调 URI：<Text code>http://localhost:3000/ai/gmail/callback</Text></li>
              <li>前往 <a href="https://console.cloud.google.com/apis/library/gmail.googleapis.com" target="_blank" rel="noopener noreferrer">Gmail API 页面</a> 启用 Gmail API</li>
              <li>将以下变量写入 <Text code>service-home/.env</Text> 文件：</li>
            </ol>
          </Paragraph>
          <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8, fontSize: 13 }}>
{`GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/ai/gmail/callback`}
          </pre>
          <Paragraph style={{ marginTop: 12 }}>
            配置完成后，需要安装依赖：
          </Paragraph>
          <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8, fontSize: 13 }}>
{`pip install google-auth-oauthlib google-api-python-client`}
          </pre>
        </Card>
      </Content>
    </Layout>
  )
}
