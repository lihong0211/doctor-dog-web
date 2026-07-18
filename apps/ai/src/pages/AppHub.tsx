import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SearchOutlined, BarChartOutlined, GithubOutlined, VideoCameraOutlined,
  ThunderboltOutlined, TeamOutlined, FileTextOutlined, GlobalOutlined,
  CompassOutlined, ForkOutlined, HeartOutlined, BulbOutlined,
  AudioOutlined, PlaySquareOutlined, LineChartOutlined, FilePdfOutlined,
  DollarOutlined, SmileOutlined, AppstoreOutlined, SwapOutlined,
  StarOutlined, ReadOutlined, RocketOutlined, MailOutlined,
  CustomerServiceOutlined, DatabaseOutlined,
} from '@ant-design/icons'

export interface AppCard {
  id: number
  title: string
  description: string
  category: string
  path: string
  icon: React.ReactNode
  status: 'live' | 'planned' | 'needs-api'
  tags?: string[]
}

export const CATEGORIES = ['全部', '对话Agent', '知识处理', '数据分析', '多媒体处理', '游戏娱乐', '娱乐体验', '推理模型']

// Category accent colors — left-stripe signature
const CAT_COLOR: Record<string, string> = {
  '对话Agent': '#3B82F6',
  '知识处理':  '#00E5C8',
  '数据分析':  '#A855F7',
  '多媒体处理': '#F97316',
  '游戏娱乐':  '#EF4444',
  '娱乐体验':  '#EC4899',
  '推理模型':  '#10B981',
}

const STATUS_CFG = {
  live:        { dot: '#0CF07A', text: '#0CF07A', label: 'LIVE' },
  'needs-api': { dot: '#FBB042', text: '#FBB042', label: 'BETA' },
  planned:     { dot: '#3D5A80', text: '#3D5A80', label: 'SOON' },
}

export const APPS: AppCard[] = [
  { id: 1,  title: 'AI 数据分析',    category: '数据分析',   description: '上传 CSV/Excel，用自然语言提问，AI 自动生成 SQL 并返回结果', path: '/apps/data-analysis',  icon: <BarChartOutlined />,      status: 'live',      tags: ['CSV', 'DuckDB', 'Text2SQL'] },
  { id: 2,  title: 'Chat with GitHub', category: '知识处理', description: '输入 GitHub 仓库 URL，AI 为代码建立向量索引，支持 RAG 问答',  path: '/apps/github-chat',   icon: <GithubOutlined />,        status: 'live',      tags: ['RAG', 'Qdrant', 'Embedding'] },
  { id: 3,  title: 'Chat with YouTube', category: '知识处理', description: '输入 YouTube 视频链接，AI 提取字幕并进行内容问答',           path: '/apps/youtube-chat',  icon: <VideoCameraOutlined />,   status: 'live',      tags: ['字幕', 'RAG', 'YouTube'] },
  { id: 4,  title: '对话持久记忆',    category: '对话Agent', description: 'AI 记住你说过的重要信息，跨对话持续引用，越聊越懂你',          path: '/apps/memory-chat',   icon: <ThunderboltOutlined />,   status: 'live',      tags: ['记忆', 'Ollama', 'MySQL'] },
  { id: 5,  title: 'Mixture of Agents', category: '推理模型', description: '同一问题发给多个本地模型，再由 DashScope 聚合出最优答案',    path: '/apps/mixture-agents', icon: <TeamOutlined />,         status: 'live',      tags: ['MoA', 'Ollama', '并发'] },
  { id: 6,  title: '简历职位匹配',    category: '数据分析',  description: '上传简历 PDF + 职位描述，AI 输出匹配分数、优势、差距和建议',  path: '/apps/resume-match',  icon: <FileTextOutlined />,      status: 'live',      tags: ['简历', 'PDF', '分析'] },
  { id: 7,  title: 'AI 新闻摘要',     category: '知识处理', description: '聚合多个科技/AI RSS 源，LLM 生成中文摘要和每日要闻总结',      path: '/apps/news-agent',    icon: <GlobalOutlined />,        status: 'live',      tags: ['RSS', '新闻', '摘要'] },
  { id: 8,  title: '网页智能提取',    category: '知识处理', description: '输入任意 URL，AI 抓取并提取结构化信息，支持自定义字段',       path: '/apps/web-scraper',   icon: <SearchOutlined />,        status: 'live',      tags: ['爬虫', '结构化', 'Newspaper'] },
  { id: 9,  title: 'AI 旅行规划',     category: '对话Agent', description: '输入目的地和天数，AI 生成完整旅行攻略，含景点/行程/预算/注意事项', path: '/apps/travel-planner', icon: <CompassOutlined />,     status: 'live',      tags: ['旅行', '规划', '攻略'] },
  { id: 10, title: 'AI 食谱规划',     category: '对话Agent', description: '输入食材和饮食偏好，AI 生成食谱、营养分析和购物清单',         path: '/apps/recipe-planner', icon: <ForkOutlined />,         status: 'live',      tags: ['食谱', '营养', '规划'] },
  { id: 11, title: 'AI 健康健身顾问', category: '对话Agent', description: '输入身体数据和目标，AI 生成个性化健身计划和饮食方案',          path: '/apps/health-advisor', icon: <HeartOutlined />,        status: 'live',      tags: ['健康', '健身', '饮食'] },
  { id: 12, title: 'AI 推理思考',     category: '推理模型', description: '使用 DeepSeek-R1 展示思考链过程，解决复杂推理和数学题',       path: '/apps/reasoning-agent', icon: <BulbOutlined />,        status: 'live',      tags: ['CoT', 'DeepSeek', 'Ollama'] },
  { id: 13, title: 'AI 演讲训练',     category: '多媒体处理', description: '上传演讲音频，AI 转录文字并分析语速、结构、用词，给出改进建议', path: '/apps/speech-trainer', icon: <AudioOutlined />,        status: 'live',      tags: ['演讲', 'Whisper', 'STT'] },
  { id: 14, title: '博客转播客',       category: '多媒体处理', description: '输入博客 URL，AI 生成播客脚本，edge-tts 转语音，支持下载',   path: '/apps/blog-podcast',   icon: <PlaySquareOutlined />,   status: 'live',      tags: ['TTS', '播客', '博客'] },
  { id: 15, title: 'AI 数据可视化',   category: '数据分析',  description: '上传 CSV，用自然语言描述想要的图表，AI 生成并返回图表图片',   path: '/apps/data-viz',       icon: <LineChartOutlined />,    status: 'live',      tags: ['图表', 'Matplotlib', 'CSV'] },
  { id: 16, title: 'Chat with PDF',   category: '知识处理', description: '上传任意 PDF，AI 建立向量索引，支持 RAG 问答',               path: '/apps/pdf-chat',       icon: <FilePdfOutlined />,      status: 'live',      tags: ['PDF', 'RAG', 'Qdrant'] },
  { id: 17, title: 'AI 财务教练',     category: '对话Agent', description: '输入收支和目标，AI 生成个性化财务规划、投资建议和储蓄策略',   path: '/apps/finance-coach',  icon: <DollarOutlined />,       status: 'live',      tags: ['财务', '理财', '规划'] },
  { id: 18, title: 'AI 心理健康助手', category: '对话Agent', description: 'AI 心理咨询助手，温暖共情，疏导情绪和压力（非医疗诊断）',     path: '/apps/mental-wellbeing', icon: <SmileOutlined />,      status: 'live',      tags: ['心理', '情绪', '支持'] },
  { id: 19, title: 'AI 象棋对弈',     category: '游戏娱乐', description: '与 AI 下象棋，python-chess 管理棋盘，LLM 决策走法',          path: '/apps/chess-game',     icon: <AppstoreOutlined />,     status: 'live',      tags: ['象棋', '棋盘', '游戏'] },
  { id: 20, title: 'AI 谈判模拟',     category: '游戏娱乐', description: '模拟商业谈判场景，用户对阵 AI，练习谈判技巧',               path: '/apps/negotiation',    icon: <SwapOutlined />,         status: 'live',      tags: ['谈判', '模拟', '角色扮演'] },
  { id: 21, title: '塔罗牌解读',       category: '娱乐体验', description: 'AI 扮演塔罗读者，随机抽牌，根据象征意义解读你的问题',        path: '/apps/tarot',          icon: <StarOutlined />,         status: 'live',      tags: ['塔罗', '占卜', '娱乐'] },
  { id: 22, title: 'Chat with ArXiv', category: '知识处理', description: '输入 ArXiv 论文 ID，AI 下载 PDF 建立索引，深度问答论文内容', path: '/apps/arxiv-chat',     icon: <ReadOutlined />,         status: 'live',      tags: ['论文', 'ArXiv', 'RAG'] },
  { id: 23, title: 'AI 创业分析',     category: '对话Agent', description: '输入创业想法，AI 分析市场趋势、竞争格局、机会和风险',        path: '/apps/startup-trend',  icon: <RocketOutlined />,       status: 'live',      tags: ['创业', '趋势', '分析'] },
  { id: 24, title: 'Gmail 智能助手',  category: '知识处理', description: '连接 Gmail，AI 读取邮件、生成摘要和智能回复草稿',            path: '/apps/gmail-assistant', icon: <MailOutlined />,        status: 'needs-api', tags: ['Gmail', 'OAuth', '邮件'] },
  { id: 25, title: 'AI 音乐生成',     category: '多媒体处理', description: '描述想要的音乐风格和情绪，AI 生成原创音乐',               path: '/apps/music-gen',      icon: <CustomerServiceOutlined />, status: 'needs-api', tags: ['音乐', 'Suno', '生成'] },
  { id: 26, title: 'MOSS TTS Nano',  category: '多媒体处理', description: '0.1B 轻量 TTS 模型，支持中英文等 20 语言，上传参考音频即可克隆声音，纯 CPU 可运行', path: '/apps/moss-tts', icon: <CustomerServiceOutlined />, status: 'live', tags: ['TTS', '声音克隆', 'MOSS', 'CPU'] },
  { id: 0,  title: '知识库 RAG',      category: '知识处理', description: '多格式文档知识库管理，向量检索 + 语义重排，完整 RAG 流水线',  path: '/skills/rag',            icon: <DatabaseOutlined />,     status: 'live',      tags: ['知识库', 'RAG', 'BM25'] },
]

// ─── Three.js teal particle background ────────────────────────────────────────
function useParticleBackground(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    let cancelled = false
    let cleanup: (() => void) | undefined

    ;(async () => {
      const THREE = await import('three')
      if (cancelled || !canvasRef.current) return
      const canvas = canvasRef.current

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(canvas.offsetWidth, canvas.offsetHeight)
      renderer.setClearColor(0x000000, 0)

      const scene  = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100)
      camera.position.z = 6

      const COUNT = 600
      const pos   = new Float32Array(COUNT * 3)
      for (let i = 0; i < COUNT; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * 28
        pos[i * 3 + 1] = (Math.random() - 0.5) * 28
        pos[i * 3 + 2] = (Math.random() - 0.5) * 10
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const mat = new THREE.PointsMaterial({ color: 0x00E5C8, size: 0.045, transparent: true, opacity: 0.35 })
      const pts = new THREE.Points(geo, mat)
      scene.add(pts)

      let animId: number
      const tick = () => {
        animId = requestAnimationFrame(tick)
        pts.rotation.y += 0.0003
        pts.rotation.x += 0.00015
        renderer.render(scene, camera)
      }
      tick()

      const onResize = () => {
        if (!canvas) return
        const w = canvas.offsetWidth, h = canvas.offsetHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', onResize)

      cleanup = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', onResize)
        geo.dispose(); mat.dispose(); renderer.dispose()
      }
    })()

    return () => { cancelled = true; cleanup?.() }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── App Card ──────────────────────────────────────────────────────────────────
function AppCard3D({ app, onNavigate }: { app: AppCard; onNavigate: (p: string) => void }) {
  const ref   = useRef<HTMLDivElement>(null)
  const [tilt, setTilt]   = useState({ rx: 0, ry: 0, scale: 1 })
  const [hover, setHover] = useState(false)
  const clickable = app.status !== 'planned'
  const catColor  = CAT_COLOR[app.category] || '#00E5C8'
  const st        = STATUS_CFG[app.status]

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current!.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width
    const ny = (e.clientY - r.top)  / r.height
    setTilt({ rx: (0.5 - ny) * 14, ry: (nx - 0.5) * 14, scale: 1.03 })
  }
  const handleLeave = () => { setTilt({ rx: 0, ry: 0, scale: 1 }); setHover(false) }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={handleLeave}
      onClick={() => clickable && onNavigate(app.path)}
      style={{
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilt.scale})`,
        transformStyle: 'preserve-3d',
        position: 'relative',
        background: hover
          ? `linear-gradient(105deg, ${catColor}09 0%, #0C1526 40%)`
          : '#0C1526',
        borderRadius: 12,
        border: `1px solid ${hover ? catColor + '30' : 'rgba(255,255,255,0.05)'}`,
        boxShadow: hover
          ? `0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px ${catColor}20`
          : '0 4px 16px rgba(0,0,0,0.35)',
        cursor: clickable ? 'pointer' : 'default',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 200,
        userSelect: 'none',
        transition: 'transform 0.18s ease-out, box-shadow 0.2s ease-out, background 0.2s ease-out, border-color 0.2s ease-out',
      }}
    >
      {/* Category left accent stripe — the signature element */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: hover ? 4 : 3,
        background: catColor,
        transition: 'width 0.2s ease',
        borderRadius: '12px 0 0 12px',
      }} />

      <div style={{ padding: '18px 18px 18px 22px', display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: `${catColor}15`,
            border: `1px solid ${catColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: catColor, fontSize: 18,
            transition: 'background 0.2s',
          }}>
            {app.icon}
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
            color: st.text,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              backgroundColor: st.dot,
              boxShadow: app.status === 'live' ? `0 0 6px ${st.dot}` : 'none',
              display: 'inline-block',
            }} />
            {st.label}
          </span>
        </div>

        {/* Title */}
        <div style={{
          fontFamily: '"Space Grotesk", -apple-system, sans-serif',
          color: '#C8DDF0', fontWeight: 600, fontSize: 14, lineHeight: 1.35,
        }}>
          {app.title}
        </div>

        {/* Description */}
        <div style={{
          color: '#526E8F', fontSize: 12, lineHeight: 1.65, flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } as React.CSSProperties}>
          {app.description}
        </div>

        {/* Tags */}
        {app.tags && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {app.tags.map(t => (
              <span key={t} style={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                padding: '1px 6px', borderRadius: 4, fontSize: 10,
                background: 'rgba(0,229,200,0.07)', color: '#3D7A74',
                border: '1px solid rgba(0,229,200,0.14)',
              }}>{t}</span>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={e => { e.stopPropagation(); clickable && onNavigate(app.path) }}
          disabled={!clickable}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8,
            border: clickable ? `1px solid ${catColor}40` : '1px solid rgba(255,255,255,0.05)',
            cursor: clickable ? 'pointer' : 'default',
            fontFamily: '"Space Grotesk", -apple-system, sans-serif',
            fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
            background: clickable
              ? (app.status === 'live' ? `${catColor}18` : 'rgba(251,176,66,0.1)')
              : 'rgba(255,255,255,0.03)',
            color: clickable
              ? (app.status === 'live' ? catColor : '#FBB042')
              : '#2A3A52',
            transition: 'background 0.15s, border-color 0.15s',
            marginTop: 4,
          }}
          onMouseEnter={e => clickable && (e.currentTarget.style.background = `${catColor}28`)}
          onMouseLeave={e => clickable && (e.currentTarget.style.background = app.status === 'live' ? `${catColor}18` : 'rgba(251,176,66,0.1)')}
        >
          {app.status === 'planned' ? 'Coming Soon' : 'Launch →'}
        </button>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function LegacyAppHub() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('全部')
  const [searchText, setSearchText]         = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useParticleBackground(canvasRef)

  const filtered = APPS.filter(app => {
    const matchCat    = activeCategory === '全部' || app.category === activeCategory
    const matchSearch = !searchText
      || app.title.includes(searchText)
      || app.description.includes(searchText)
      || app.tags?.some(t => t.includes(searchText))
    return matchCat && matchSearch
  })

  const liveCount = APPS.filter(a => a.status === 'live').length

  return (
    <div style={{ minHeight: '100%', overflow: 'auto', background: '#080E1C', padding: '28px 28px', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .apphub-canvas {
          position: fixed; top: 0; left: 0;
          width: 100%; height: 100%;
          pointer-events: none; z-index: 0; opacity: 0.6;
        }
        .apphub-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 1100px) { .apphub-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px)  { .apphub-grid { grid-template-columns: 1fr; } }

        .apphub-search-input {
          background: rgba(12,21,38,0.85) !important;
          color: #C8DDF0 !important;
          border: 1px solid rgba(0,229,200,0.2) !important;
          border-radius: 8px !important;
          padding: 7px 12px 7px 36px !important;
          font-size: 13px !important;
          font-family: 'Space Grotesk', -apple-system, sans-serif !important;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .apphub-search-input::placeholder { color: #3D5A80; }
        .apphub-search-input:focus { border-color: rgba(0,229,200,0.5) !important; box-shadow: 0 0 0 2px rgba(0,229,200,0.08) !important; }

        .cat-pill {
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-family: 'Space Grotesk', -apple-system, sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          border: 1px solid rgba(0,229,200,0.15);
          background: rgba(12,21,38,0.6);
          color: #526E8F;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .cat-pill:hover { color: #C8DDF0; border-color: rgba(0,229,200,0.3); }
        .cat-pill.active { background: rgba(0,229,200,0.12); color: #00E5C8; border-color: rgba(0,229,200,0.4); }
        .cat-pill .cat-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }
        .apphub-empty {
          text-align: center;
          padding: 80px 0;
          color: #2A3A52;
          font-family: 'Space Grotesk', -apple-system, sans-serif;
        }
        @media (prefers-reduced-motion: reduce) {
          .apphub-canvas { display: none; }
        }
      `}</style>

      {/* Particle background */}
      <canvas ref={canvasRef} className="apphub-canvas" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <div style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
                color: '#00E5C8', marginBottom: 6, textTransform: 'uppercase',
              }}>
                AI TECH LAB / APPS
              </div>
              <h1 style={{
                fontFamily: '"Space Grotesk", -apple-system, sans-serif',
                margin: 0, color: '#C8DDF0', fontSize: 24, fontWeight: 700,
                letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>
                大模型应用体验中心
              </h1>
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11, color: '#3D5A80',
              textAlign: 'right', lineHeight: 1.8,
            }}>
              <div><span style={{ color: '#0CF07A' }}>●</span> {liveCount} LIVE</div>
              <div style={{ color: '#2A3A52' }}>{APPS.length} TOTAL</div>
            </div>
          </div>
          <p style={{
            fontFamily: '-apple-system, sans-serif',
            margin: 0, color: '#3D5A80', fontSize: 13, lineHeight: 1.6,
          }}>
            基于 DashScope · Ollama · Qdrant 构建的 AI 应用集合
          </p>
        </div>

        {/* ── Search + filters ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
          {/* Search */}
          <div style={{ position: 'relative', width: 280, flexShrink: 0 }}>
            <SearchOutlined style={{
              position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
              color: '#3D5A80', fontSize: 13, zIndex: 1,
            }} />
            <input
              className="apphub-search-input"
              placeholder="搜索应用名称、标签..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const active = activeCategory === cat
              const color  = CAT_COLOR[cat] || '#00E5C8'
              const count  = cat === '全部' ? null : APPS.filter(a => a.category === cat).length
              return (
                <button
                  key={cat}
                  className={`cat-pill${active ? ' active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                  style={{ borderColor: active ? `${color}50` : undefined, color: active ? color : undefined, background: active ? `${color}12` : undefined }}
                >
                  {cat !== '全部' && (
                    <span className="cat-dot" style={{ backgroundColor: active ? color : '#2A3A52' }} />
                  )}
                  {cat}
                  {count !== null && (
                    <span style={{ fontSize: 10, opacity: 0.55, fontFamily: '"JetBrains Mono", monospace' }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Card grid ── */}
        {filtered.length > 0 ? (
          <div className="apphub-grid">
            {filtered.map(app => (
              <AppCard3D key={app.id} app={app} onNavigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="apphub-empty">
            <div style={{ fontSize: 32, marginBottom: 10 }}>◎</div>
            <div style={{ fontSize: 13 }}>未找到匹配的应用</div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 40, textAlign: 'center',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10, color: '#1E2D42', letterSpacing: '0.06em',
        }}>
          DASHSCOPE · OLLAMA · QDRANT · THREE.JS
        </div>
      </div>
    </div>
  )
}

export { default, filterApps } from './AppHubModern'
