import { useState } from 'react'
import MCPGaode from './MCPGaode'
import MCPPpt from './MCPPpt'
import MCPWeather from './MCPWeather'
import './MCPGaode.css'

export type MCPAssistantKey = 'gaode' | 'ppt' | 'weather' | 'tts' | 'stt'

const OPTIONS: { value: MCPAssistantKey; label: string; icon: string }[] = [
  { value: 'gaode', label: '高德地图助手', icon: '🗺️' },
  { value: 'ppt', label: 'PPT 汇报助手', icon: '📊' },
  { value: 'weather', label: '天气查询助手', icon: '🌤️' },
  { value: 'tts', label: 'TTS 语音助手', icon: '🔊' },
  { value: 'stt', label: 'STT 语音识别助手', icon: '🎤' },
]

const TAB_COLORS: Record<MCPAssistantKey, { bg: string; border: string; selectedBg: string }> = {
  gaode: { bg: 'rgba(59, 130, 246, 0.12)', border: 'var(--ai-primary)', selectedBg: 'var(--ai-primary)' },
  ppt: { bg: 'rgba(139, 92, 246, 0.12)', border: '#8b5cf6', selectedBg: '#8b5cf6' },
  weather: { bg: 'rgba(34, 197, 94, 0.12)', border: '#22c55e', selectedBg: '#22c55e' },
  tts: { bg: 'rgba(100, 116, 139, 0.12)', border: '#64748b', selectedBg: '#64748b' },
  stt: { bg: 'rgba(249, 115, 22, 0.12)', border: '#f97316', selectedBg: '#f97316' },
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
