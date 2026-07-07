import { FC, useState } from 'react'

interface ModelCard {
  id: string
  title: string
  description: string
  provider: string
  status: 'Ready' | 'Beta' | 'Coming Soon'
  color: string
  metrics: { speed: number; context: number; reasoning: number }
  contextLabel: string
}

const MODELS: ModelCard[] = [
  {
    id: '1', title: 'Qwen2.5-7B', description: '多语言理解与强推理能力，中文生态最佳',
    provider: 'Alibaba / DashScope', status: 'Ready', color: '#3B82F6',
    metrics: { speed: 92, context: 70, reasoning: 78 }, contextLabel: '128K',
  },
  {
    id: '2', title: 'DeepSeek-V3', description: '前沿代码生成与复杂多步推理',
    provider: 'DeepSeek', status: 'Ready', color: '#A855F7',
    metrics: { speed: 75, context: 88, reasoning: 95 }, contextLabel: '64K',
  },
  {
    id: '3', title: 'Llama 3.1 8B', description: '高速轻量，本地推理优选，延迟极低',
    provider: 'Meta / Ollama', status: 'Ready', color: '#10B981',
    metrics: { speed: 98, context: 55, reasoning: 70 }, contextLabel: '128K',
  },
  {
    id: '4', title: 'Mistral 7B', description: '指令遵循精准优化，工具调用表现出色',
    provider: 'Mistral AI / Ollama', status: 'Beta', color: '#F97316',
    metrics: { speed: 90, context: 52, reasoning: 72 }, contextLabel: '32K',
  },
  {
    id: '5', title: 'Yi-34B', description: '超长文本深度理解，文档处理首选',
    provider: 'Zero-One Everything', status: 'Ready', color: '#EF4444',
    metrics: { speed: 55, context: 96, reasoning: 85 }, contextLabel: '200K',
  },
  {
    id: '6', title: 'Gemma 2 9B', description: '谷歌开源旗舰，轻量高效多任务',
    provider: 'Google DeepMind', status: 'Coming Soon', color: '#06B6D4',
    metrics: { speed: 85, context: 60, reasoning: 80 }, contextLabel: '8K',
  },
]

const STATUS_CFG: Record<ModelCard['status'], { dot: string; text: string; label: string }> = {
  'Ready':       { dot: '#0CF07A', text: '#0CF07A', label: 'READY' },
  'Beta':        { dot: '#FBB042', text: '#FBB042', label: 'BETA' },
  'Coming Soon': { dot: '#3D5A80', text: '#3D5A80', label: 'SOON' },
}

// ─── Signal bar row ────────────────────────────────────────────────────────────
const SignalBar: FC<{ label: string; value: number; color: string; suffix?: string }> = ({
  label, value, color, suffix,
}) => (
  <div>
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      marginBottom: 4,
    }}>
      <span style={{
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: 9, fontWeight: 500, letterSpacing: '0.12em',
        color: '#3D5A80', textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 9, color: color, fontWeight: 600,
      }}>{suffix ?? `${value}%`}</span>
    </div>
    <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${value}%`,
        background: color,
        borderRadius: 2,
        boxShadow: `0 0 6px ${color}80`,
      }} />
    </div>
  </div>
)

// ─── Model card ────────────────────────────────────────────────────────────────
const ModelCardItem: FC<{ model: ModelCard }> = ({ model }) => {
  const [hovered, setHovered] = useState(false)
  const sc = STATUS_CFG[model.status]
  const isDisabled = model.status === 'Coming Soon'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered
          ? `linear-gradient(105deg, ${model.color}09 0%, #0C1526 40%)`
          : '#0C1526',
        borderRadius: 12,
        border: `1px solid ${hovered ? model.color + '30' : 'rgba(255,255,255,0.05)'}`,
        boxShadow: hovered
          ? `0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px ${model.color}20`
          : '0 4px 16px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
      }}
    >
      {/* Left accent stripe */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: hovered ? 4 : 3,
        background: model.color,
        transition: 'width 0.2s ease',
        borderRadius: '12px 0 0 12px',
      }} />

      <div style={{ padding: '20px 20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Top row: title + status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontFamily: '"Space Grotesk", -apple-system, sans-serif',
              color: '#C8DDF0', fontSize: 16, fontWeight: 700,
              letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 3,
            }}>
              {model.title}
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9, color: '#2A3A52', letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {model.provider}
            </div>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 9, fontWeight: 600, letterSpacing: '0.12em',
            color: sc.text, flexShrink: 0, marginLeft: 8,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              backgroundColor: sc.dot,
              boxShadow: model.status === 'Ready' ? `0 0 5px ${sc.dot}` : 'none',
              display: 'inline-block',
            }} />
            {sc.label}
          </span>
        </div>

        {/* Description */}
        <p style={{
          margin: 0,
          fontFamily: '-apple-system, sans-serif',
          color: '#526E8F', fontSize: 12, lineHeight: 1.65,
        }}>
          {model.description}
        </p>

        {/* Signal bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SignalBar label="SPEED"     value={model.metrics.speed}     color={model.color} />
          <SignalBar label="CONTEXT"   value={model.metrics.context}   color={model.color} suffix={model.contextLabel} />
          <SignalBar label="REASONING" value={model.metrics.reasoning} color={model.color} />
        </div>

        {/* CTA */}
        <button
          disabled={isDisabled}
          style={{
            width: '100%', padding: '9px 0', borderRadius: 8, marginTop: 2,
            border: isDisabled ? '1px solid rgba(255,255,255,0.04)' : `1px solid ${model.color}40`,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            fontFamily: '"Space Grotesk", -apple-system, sans-serif',
            fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
            background: isDisabled ? 'rgba(255,255,255,0.02)' : `${model.color}18`,
            color: isDisabled ? '#2A3A52' : model.color,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => !isDisabled && (e.currentTarget.style.background = `${model.color}28`)}
          onMouseLeave={e => !isDisabled && (e.currentTarget.style.background = `${model.color}18`)}
        >
          {isDisabled ? 'Coming Soon' : 'Try Now →'}
        </button>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
const ExperienceCenter: FC = () => (
  <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
      .ec-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      @media (max-width: 1024px) { .ec-grid { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 640px)  { .ec-grid { grid-template-columns: 1fr; } }
    `}</style>

    <div style={{
      minHeight: '100vh',
      background: '#080E1C',
      padding: '40px 28px',
      fontFamily: '"Space Grotesk", -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
            color: '#00E5C8', marginBottom: 10, textTransform: 'uppercase',
          }}>
            AI TECH LAB / MODEL HUB
          </div>
          <h1 style={{
            margin: '0 0 10px',
            color: '#C8DDF0', fontSize: 26, fontWeight: 700,
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            大模型体验中心
          </h1>
          <p style={{ margin: 0, color: '#3D5A80', fontSize: 13, lineHeight: 1.65 }}>
            选择一个模型，查看性能指标，开始推理对话
          </p>
        </div>

        {/* Grid */}
        <div className="ec-grid">
          {MODELS.map(m => <ModelCardItem key={m.id} model={m} />)}
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center', marginTop: 40,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10, color: '#1E2D42', letterSpacing: '0.06em',
        }}>
          DASHSCOPE API · OLLAMA LOCAL INFERENCE
        </p>
      </div>
    </div>
  </>
)

export default ExperienceCenter
