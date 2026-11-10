import { useEffect, useState } from 'react'
import { Card, Tag, Spin, Badge, Typography, Collapse, Empty } from 'antd'
import { useNavigate } from 'react-router-dom'
import { CloudServerOutlined, ApiOutlined } from '@ant-design/icons'
import { get } from '../../service/request'
import type { McpAgentInfo } from '../../service/mcp-common'
import './MCPManager.css'

const { Paragraph, Text } = Typography

type ServiceCategory = 'builtin' | 'standalone'

interface ServiceMeta {
  key: string
  name: string
  icon: string
  category: ServiceCategory
  infoPath: string
  summary: string
  usage: string[]
  /** /mcp/{publicKey} 对应 service/ai/mcp/mcp_proxy.py 里的 _SERVICE_PORTS key，公网直连用 */
  publicKey?: string
}

/** 内置集成：接入外部/第三方 MCP 服务，只能在本应用里通过聊天体验 */
const BUILTIN_SERVICES: ServiceMeta[] = [
  {
    key: 'gaode',
    name: '高德地图助手',
    icon: '🗺️',
    category: 'builtin',
    infoPath: '/ai/mcp-gaode/info',
    summary: '接入高德地图 MCP 服务，支持地理编码、路线规划、周边搜索等。',
    usage: ['在「MCP 助手」页面切换到「高德地图助手」标签直接对话体验'],
  },
  {
    key: 'ppt',
    name: 'PPT 汇报助手',
    icon: '📊',
    category: 'builtin',
    infoPath: '/ai/mcp-ppt/info',
    summary: '自然语言描述汇报需求，自动拉取业务数据（Text2SQL）并生成 PPT，返回下载/在线编辑地址。',
    usage: ['在「MCP 助手」页面切换到「PPT 汇报助手」标签直接对话体验'],
  },
  {
    key: 'weather',
    name: '天气查询助手',
    icon: '🌤️',
    category: 'builtin',
    infoPath: '/ai/mcp-weather/info',
    summary: '接入 DashScope 天气 MCP，支持城市天气查询。',
    usage: ['在「MCP 助手」页面切换到「天气查询助手」标签直接对话体验'],
  },
  {
    key: 'tts',
    name: 'TTS 语音助手',
    icon: '🔊',
    category: 'builtin',
    infoPath: '/ai/mcp-tts/info',
    summary: '接入语音合成 MCP 服务（该助手的对话页面开发中）。',
    usage: ['后端接口已就绪，前端对话页面正在开发中'],
  },
  {
    key: 'stt',
    name: 'STT 语音识别助手',
    icon: '🎤',
    category: 'builtin',
    infoPath: '/ai/mcp-stt/info',
    summary: '接入语音识别 MCP 服务（该助手的对话页面开发中）。',
    usage: ['后端接口已就绪，前端对话页面正在开发中'],
  },
]

/** 独立 MCP Server：本项目自建、可独立部署给外部 MCP 客户端使用，同时也接进了本应用做演示 */
const STANDALONE_SERVICES: ServiceMeta[] = [
  {
    key: 'stock',
    name: '股票分析助手',
    icon: '📈',
    category: 'standalone',
    infoPath: '/ai/mcp-stock/info',
    summary: 'A 股搜索、历史行情查询、ARIMA 预测、布林带异常检测、Prophet 周期分解。数据源 Tushare，本地 SQLite 缓存。',
    usage: [
      '应用内体验：「MCP 助手」页面 →「股票分析助手」标签',
      '外部接入：MCP 客户端里填一行 url 即可，密钥在服务端已配置好，无需自己申请',
    ],
    publicKey: 'stock-analysis',
  },
  {
    key: 'scraper',
    name: '网页提取助手',
    icon: '🕸️',
    category: 'standalone',
    infoPath: '/ai/mcp-scraper/info',
    summary: '抓取网页正文（newspaper3k），并用 LLM 按 schema 提取结构化信息。',
    usage: [
      '应用内体验：「MCP 助手」页面 →「网页提取助手」标签',
      '外部接入：MCP 客户端里填一行 url 即可，密钥在服务端已配置好，无需自己申请',
    ],
    publicKey: 'web-scraper',
  },
  {
    key: 'data-analysis',
    name: '数据分析助手',
    icon: '🧮',
    category: 'standalone',
    infoPath: '/ai/mcp-data-analysis/info',
    summary: '加载 CSV/Excel 数据（DuckDB 内存表），自然语言问题自动生成并执行 SQL。',
    usage: [
      '应用内体验：「MCP 助手」页面 →「数据分析助手」标签（完整文件上传体验见「数据分析」独立页面）',
      '外部接入：MCP 客户端里填一行 url 即可，密钥在服务端已配置好，无需自己申请',
    ],
    publicKey: 'data-analysis',
  },
  {
    key: 'resume',
    name: '简历匹配助手',
    icon: '📄',
    category: 'standalone',
    infoPath: '/ai/mcp-resume/info',
    summary: '解析简历 PDF（PyPDF2/pdfplumber），与职位描述对比，输出匹配分/优势/差距/建议。',
    usage: [
      '应用内体验：「MCP 助手」页面 →「简历匹配助手」标签（完整 PDF 上传体验见「简历匹配」独立页面）',
      '外部接入：MCP 客户端里填一行 url 即可，密钥在服务端已配置好，无需自己申请',
    ],
    publicKey: 'resume-matcher',
  },
  {
    key: 'news',
    name: '新闻摘要助手',
    icon: '📰',
    category: 'standalone',
    infoPath: '/ai/mcp-news/info',
    summary: '并发抓取科技/AI 领域 RSS 源，逐篇生成摘要或生成今日要闻总结。',
    usage: [
      '应用内体验：「MCP 助手」页面 →「新闻摘要助手」标签',
      '外部接入：MCP 客户端里填一行 url 即可，密钥在服务端已配置好，无需自己申请',
    ],
    publicKey: 'news-agent',
  },
]

const ALL_SERVICES = [...BUILTIN_SERVICES, ...STANDALONE_SERVICES]

/** 公网可访问的服务地址，见 service/ai/mcp/mcp_proxy.py（反向代理到本地 mcp_servers 下各 server.py） */
const PUBLIC_BASE_URL = 'https://home.doctor-dog.com'

/** 生成远程 url 方式的 mcpServers 配置片段，格式与 Claude Desktop / OpenClaw 等主流 MCP 客户端一致：
 * 外部用户只需要把这一段贴进自己的配置文件（如 ~/.openclaw/openclaw.json、claude_desktop_config.json），
 * 不需要本地装 Python、不需要克隆代码、也不需要自己的 TUSHARE_TOKEN/DASHSCOPE_API_KEY —— 密钥在服务端持有。 */
function buildMcpClientConfig(meta: ServiceMeta): string {
  if (!meta.publicKey) return ''
  const configKey = meta.publicKey.replace(/-/g, '_')
  const config = {
    mcpServers: {
      [configKey]: {
        url: `${PUBLIC_BASE_URL}/mcp/${meta.publicKey}`,
      },
    },
  }
  return JSON.stringify(config, null, 2)
}

interface InfoApiResponse {
  code: number
  msg: string
  data: McpAgentInfo
}

function ServiceCard({ meta, info, loading }: { meta: ServiceMeta; info: McpAgentInfo | null; loading: boolean }) {
  const isReady = !loading && info && !info.config_required
  const isConfigRequired = !loading && info?.config_required

  return (
    <Card className="mcp-manager-card" variant="outlined">
      <div className="mcp-manager-card-head">
        <span className="mcp-manager-card-icon">{meta.icon}</span>
        <div className="mcp-manager-card-title-wrap">
          <div className="mcp-manager-card-title">{meta.name}</div>
          <div className="mcp-manager-card-tags">
            <Tag color={meta.category === 'standalone' ? 'purple' : 'blue'}>
              {meta.category === 'standalone' ? '独立 MCP Server' : '内置集成'}
            </Tag>
            {loading && <Badge status="processing" text="检测中" />}
            {isReady && <Badge status="success" text="已就绪" />}
            {isConfigRequired && <Badge status="error" text="需要配置" />}
          </div>
        </div>
      </div>

      <Paragraph className="mcp-manager-card-summary">{meta.summary}</Paragraph>

      {isConfigRequired && info?.config_hint && (
        <Paragraph type="danger" className="mcp-manager-card-hint">
          {info.config_hint}
        </Paragraph>
      )}

      <div className="mcp-manager-card-section">
        <Text strong className="mcp-manager-card-section-title">
          <ApiOutlined /> 暴露的工具
        </Text>
        <div className="mcp-manager-plugins">
          {loading && <Spin size="small" />}
          {!loading && (info?.plugins?.length ?? 0) === 0 && <Text type="secondary">暂无（服务未连接或无工具）</Text>}
          {!loading &&
            (info?.plugins ?? []).map((p) => (
              <Tag key={p} className="mcp-manager-plugin-tag">
                {p.replace(new RegExp(`^${meta.key.replace('-', '_')}-`), '')}
              </Tag>
            ))}
        </div>
      </div>

      <div className="mcp-manager-card-section">
        <Text strong className="mcp-manager-card-section-title">
          <CloudServerOutlined /> 使用方式
        </Text>
        <ul className="mcp-manager-usage-list">
          {meta.usage.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
        {meta.publicKey && (
          <>
            <div className="mcp-manager-code-label">添加到 MCP 客户端配置，无需本地安装</div>
            <pre className="mcp-manager-code-block">{buildMcpClientConfig(meta)}</pre>
          </>
        )}
      </div>
    </Card>
  )
}

export default function MCPManager() {
  const navigate = useNavigate()
  const [infoByKey, setInfoByKey] = useState<Record<string, McpAgentInfo | null>>({})
  const [loadingByKey, setLoadingByKey] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_SERVICES.map((s) => [s.key, true]))
  )

  useEffect(() => {
    let cancelled = false
    ALL_SERVICES.forEach((svc) => {
      get<InfoApiResponse>(svc.infoPath)
        .then((res) => {
          const payload = res as unknown as InfoApiResponse
          if (cancelled) return
          setInfoByKey((prev) => ({ ...prev, [svc.key]: payload?.data ?? null }))
        })
        .catch(() => {
          if (cancelled) return
          setInfoByKey((prev) => ({ ...prev, [svc.key]: null }))
        })
        .finally(() => {
          if (cancelled) return
          setLoadingByKey((prev) => ({ ...prev, [svc.key]: false }))
        })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mcp-manager">
      <div className="mcp-manager-header">
        <h1 className="mcp-manager-heading">MCP 服务管理</h1>
        <Paragraph className="mcp-manager-desc">
          汇总本项目接入 / 自建的所有 MCP 服务：工具列表实时从各服务的 <Text code>/info</Text> 接口读取，
          「独立 MCP Server」类已通过反向代理暴露公网地址，外部 MCP 客户端（Claude Desktop / OpenClaw 等）
          只需在自己的配置里填一行 url 即可接入，无需本地安装、无需自己的 API Key。
          点击下方按钮可前往「MCP 助手」页面直接对话体验。
        </Paragraph>
        <button className="mcp-manager-goto-btn" onClick={() => navigate('/skills/mcp')}>
          前往 MCP 助手对话页 →
        </button>
      </div>

      <Collapse
        defaultActiveKey={['builtin', 'standalone']}
        className="mcp-manager-collapse"
        items={[
          {
            key: 'builtin',
            label: `内置集成（${BUILTIN_SERVICES.length}）— 接入外部 / 第三方 MCP 服务`,
            children: (
              <div className="mcp-manager-grid">
                {BUILTIN_SERVICES.map((svc) => (
                  <ServiceCard key={svc.key} meta={svc} info={infoByKey[svc.key] ?? null} loading={loadingByKey[svc.key]} />
                ))}
              </div>
            ),
          },
          {
            key: 'standalone',
            label: `独立 MCP Server（${STANDALONE_SERVICES.length}）— 本项目自建，已暴露公网 url 供外部 MCP 客户端直连`,
            children: (
              <div className="mcp-manager-grid">
                {STANDALONE_SERVICES.map((svc) => (
                  <ServiceCard key={svc.key} meta={svc} info={infoByKey[svc.key] ?? null} loading={loadingByKey[svc.key]} />
                ))}
              </div>
            ),
          },
        ]}
      />

      {ALL_SERVICES.length === 0 && <Empty description="暂无 MCP 服务" />}
    </div>
  )
}
