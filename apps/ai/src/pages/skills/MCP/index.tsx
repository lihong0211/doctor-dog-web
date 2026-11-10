import { useState } from 'react'
import MCPGaode from './MCPGaode'
import MCPPpt from './MCPPpt'
import MCPWeather from './MCPWeather'
import MCPGenericChat from './MCPGenericChat'
import { stockAgentService } from '../../../service/mcp-stock'
import { scraperAgentService } from '../../../service/mcp-scraper'
import { dataAnalysisAgentService } from '../../../service/mcp-data-analysis'
import { resumeAgentService } from '../../../service/mcp-resume'
import { newsAgentService } from '../../../service/mcp-news'
import './MCPGaode.css'

export type MCPAssistantKey = 'gaode' | 'ppt' | 'weather' | 'tts' | 'stt' | 'stock' | 'scraper' | 'data-analysis' | 'resume' | 'news'

const OPTIONS: { value: MCPAssistantKey; label: string; icon: string }[] = [
  { value: 'gaode', label: '高德地图助手', icon: '🗺️' },
  { value: 'ppt', label: 'PPT 汇报助手', icon: '📊' },
  { value: 'weather', label: '天气查询助手', icon: '🌤️' },
  { value: 'tts', label: 'TTS 语音助手', icon: '🔊' },
  { value: 'stt', label: 'STT 语音识别助手', icon: '🎤' },
  { value: 'stock', label: '股票分析助手', icon: '📈' },
  { value: 'scraper', label: '网页提取助手', icon: '🕸️' },
  { value: 'data-analysis', label: '数据分析助手', icon: '🧮' },
  { value: 'resume', label: '简历匹配助手', icon: '📄' },
  { value: 'news', label: '新闻摘要助手', icon: '📰' },
]

const TAB_COLORS: Record<MCPAssistantKey, { bg: string; border: string; selectedBg: string }> = {
  gaode: { bg: 'rgba(59, 130, 246, 0.12)', border: 'var(--ai-primary)', selectedBg: 'var(--ai-primary)' },
  ppt: { bg: 'rgba(139, 92, 246, 0.12)', border: '#8b5cf6', selectedBg: '#8b5cf6' },
  weather: { bg: 'rgba(34, 197, 94, 0.12)', border: '#22c55e', selectedBg: '#22c55e' },
  tts: { bg: 'rgba(100, 116, 139, 0.12)', border: '#64748b', selectedBg: '#64748b' },
  stt: { bg: 'rgba(249, 115, 22, 0.12)', border: '#f97316', selectedBg: '#f97316' },
  stock: { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', selectedBg: '#ef4444' },
  scraper: { bg: 'rgba(20, 184, 166, 0.12)', border: '#14b8a6', selectedBg: '#14b8a6' },
  'data-analysis': { bg: 'rgba(99, 102, 241, 0.12)', border: '#6366f1', selectedBg: '#6366f1' },
  resume: { bg: 'rgba(236, 72, 153, 0.12)', border: '#ec4899', selectedBg: '#ec4899' },
  news: { bg: 'rgba(234, 179, 8, 0.12)', border: '#eab308', selectedBg: '#eab308' },
}

/** 助手选择标签（放在输入框内，未选中为灰色） */
export function MCPAssistantTabs({
  value,
  onChange,
  disabled,
}: {
  value: MCPAssistantKey
  onChange: (v: MCPAssistantKey) => void
  disabled?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {OPTIONS.map((o) => {
        const isSelected = value === o.value
        const colors = TAB_COLORS[o.value]
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(o.value)}
            style={{
              height: 26,
              padding: '0 10px',
              borderRadius: 8,
              border: 'none',
              minWidth: 72,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              background: isSelected ? colors.selectedBg : colors.bg,
              color: isSelected ? '#fff' : colors.border,
              fontWeight: 600,
              fontSize: 12,
              lineHeight: 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            <span>{o.icon}</span>
            <span>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function MCP() {
  const [assistant, setAssistant] = useState<MCPAssistantKey>('gaode')

  const inputTopSlot = (
    <MCPAssistantTabs
      value={assistant}
      onChange={(v) => setAssistant(v)}
    />
  )

  return (
    <div className="mcp-unified">
      <div className="mcp-unified-body">
        {assistant === 'gaode' && <MCPGaode inputTopSlot={inputTopSlot} />}
        {assistant === 'ppt' && <MCPPpt inputTopSlot={inputTopSlot} />}
        {assistant === 'weather' && <MCPWeather inputTopSlot={inputTopSlot} />}
        {assistant === 'stock' && (
          <MCPGenericChat
            inputTopSlot={inputTopSlot}
            service={stockAgentService}
            toolPrefix="stock"
            icon="📈"
            tagLabel="股票分析"
            tagColor="red"
            fallbackName="股票分析助手"
            fallbackDescription="接入本地股票分析 MCP Server，支持 A 股搜索、历史行情查询、ARIMA 预测、布林带异常检测、Prophet 周期分解"
            emptyIcon={<span style={{ fontSize: 22 }}>📈</span>}
            emptyText="问股票"
            emptyHint="输入股票名称或代码，如「贵州茅台最近走势怎么样」"
            recommendedPrompts={['贵州茅台股票代码是多少', '600519 最近一年布林带有没有超买超卖', '帮我预测一下比亚迪未来5天走势']}
            typingLabel="正在分析…"
          />
        )}
        {assistant === 'scraper' && (
          <MCPGenericChat
            inputTopSlot={inputTopSlot}
            service={scraperAgentService}
            toolPrefix="scraper"
            icon="🕸️"
            tagLabel="网页提取"
            tagColor="cyan"
            fallbackName="网页提取助手"
            fallbackDescription="接入本地网页智能提取 MCP Server，抓取网页正文并按需要的字段结构化提取信息"
            emptyIcon={<span style={{ fontSize: 22 }}>🕸️</span>}
            emptyText="提取网页信息"
            emptyHint="粘贴一个网页链接，如「帮我提取这篇文章的标题和摘要 https://...」"
            recommendedPrompts={['帮我提取这篇网页的标题和摘要', '这个链接的主要内容是什么']}
            typingLabel="正在抓取网页…"
          />
        )}
        {assistant === 'data-analysis' && (
          <MCPGenericChat
            inputTopSlot={inputTopSlot}
            service={dataAnalysisAgentService}
            toolPrefix="data_analysis"
            icon="🧮"
            tagLabel="数据分析"
            tagColor="geekblue"
            fallbackName="数据分析助手"
            fallbackDescription="接入本地数据分析 MCP Server，支持加载 CSV/Excel 数据并用自然语言转 SQL 查询"
            emptyIcon={<span style={{ fontSize: 22 }}>🧮</span>}
            emptyText="用自然语言查数据"
            emptyHint="该助手通过 MCP 工具加载/查询数据集，完整的文件上传体验请到「数据分析」独立页面"
            recommendedPrompts={['这个服务提供哪些工具', '如何加载一份 CSV 数据']}
            typingLabel="正在查询…"
          />
        )}
        {assistant === 'resume' && (
          <MCPGenericChat
            inputTopSlot={inputTopSlot}
            service={resumeAgentService}
            toolPrefix="resume"
            icon="📄"
            tagLabel="简历匹配"
            tagColor="magenta"
            fallbackName="简历匹配助手"
            fallbackDescription="接入本地简历匹配 MCP Server，分析简历 PDF 与职位描述的匹配程度"
            emptyIcon={<span style={{ fontSize: 22 }}>📄</span>}
            emptyText="简历与职位匹配分析"
            emptyHint="该助手通过 MCP 工具分析简历，完整的 PDF 上传体验请到「简历匹配」独立页面"
            recommendedPrompts={['这个服务是做什么的', '需要提供什么信息才能分析']}
            typingLabel="正在分析…"
          />
        )}
        {assistant === 'news' && (
          <MCPGenericChat
            inputTopSlot={inputTopSlot}
            service={newsAgentService}
            toolPrefix="news"
            icon="📰"
            tagLabel="新闻摘要"
            tagColor="gold"
            fallbackName="新闻摘要助手"
            fallbackDescription="接入本地新闻摘要 MCP Server，抓取科技/AI 领域 RSS 源并生成今日要闻总结"
            emptyIcon={<span style={{ fontSize: 22 }}>📰</span>}
            emptyText="今日科技要闻"
            emptyHint="试试「给我一段今日科技新闻摘要」或「有哪些值得关注的 AI 新闻」"
            recommendedPrompts={['给我一段今日科技新闻摘要', '有哪些值得关注的 AI 新闻', '抓取最新文章列表']}
            typingLabel="正在抓取新闻…"
          />
        )}
        {(assistant === 'tts' || assistant === 'stt') && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <div className="mcp-unified-developing" style={{ flex: 1, minHeight: 0 }}>
              <div className="mcp-unified-developing-card">
                <span className="mcp-unified-developing-icon">{assistant === 'tts' ? '🔊' : '🎤'}</span>
                <div className="mcp-unified-developing-text">开发中</div>
                <div className="mcp-unified-developing-hint">该助手功能正在开发中，敬请期待</div>
              </div>
            </div>
            <div className="mcp-unified-input-only">
              <div className="mcp-unified-input-only-box">
                <MCPAssistantTabs value={assistant} onChange={(v) => setAssistant(v)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
