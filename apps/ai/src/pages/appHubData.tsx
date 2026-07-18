import type { ReactNode } from 'react'
import {
  AppstoreOutlined,
  AudioOutlined,
  BarChartOutlined,
  BulbOutlined,
  CompassOutlined,
  CustomerServiceOutlined,
  DatabaseOutlined,
  DollarOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  ForkOutlined,
  GithubOutlined,
  GlobalOutlined,
  HeartOutlined,
  LineChartOutlined,
  MailOutlined,
  PlaySquareOutlined,
  ReadOutlined,
  RocketOutlined,
  SearchOutlined,
  SmileOutlined,
  StarOutlined,
  SwapOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'

export interface AppCard {
  id: number
  title: string
  description: string
  category: string
  path: string
  icon: ReactNode
  status: 'live' | 'planned' | 'needs-api'
  tags?: string[]
}

export const CATEGORIES = ['全部', '对话Agent', '知识处理', '数据分析', '多媒体处理', '游戏娱乐', '娱乐体验', '推理模型']

export const APPS: AppCard[] = [
  { id: 1, title: 'AI 数据分析', category: '数据分析', description: '上传 CSV/Excel，用自然语言提问，AI 自动生成 SQL 并返回结果', path: '/apps/data-analysis', icon: <BarChartOutlined />, status: 'live', tags: ['CSV', 'DuckDB', 'Text2SQL'] },
  { id: 2, title: 'Chat with GitHub', category: '知识处理', description: '输入 GitHub 仓库 URL，AI 为代码建立向量索引，支持 RAG 问答', path: '/apps/github-chat', icon: <GithubOutlined />, status: 'live', tags: ['RAG', 'Qdrant', 'Embedding'] },
  { id: 3, title: 'Chat with YouTube', category: '知识处理', description: '输入 YouTube 视频链接，AI 提取字幕并进行内容问答', path: '/apps/youtube-chat', icon: <VideoCameraOutlined />, status: 'live', tags: ['字幕', 'RAG', 'YouTube'] },
  { id: 4, title: '对话持久记忆', category: '对话Agent', description: 'AI 记住你说过的重要信息，跨对话持续引用，越聊越懂你', path: '/apps/memory-chat', icon: <ThunderboltOutlined />, status: 'live', tags: ['记忆', 'Ollama', 'MySQL'] },
  { id: 5, title: 'Mixture of Agents', category: '推理模型', description: '同一问题发给多个本地模型，再由 DashScope 聚合出最优答案', path: '/apps/mixture-agents', icon: <TeamOutlined />, status: 'live', tags: ['MoA', 'Ollama', '并发'] },
  { id: 6, title: '简历职位匹配', category: '数据分析', description: '上传简历 PDF + 职位描述，AI 输出匹配分数、优势、差距和建议', path: '/apps/resume-match', icon: <FileTextOutlined />, status: 'live', tags: ['简历', 'PDF', '分析'] },
  { id: 7, title: 'AI 新闻摘要', category: '知识处理', description: '聚合多个科技/AI RSS 源，LLM 生成中文摘要和每日要闻总结', path: '/apps/news-agent', icon: <GlobalOutlined />, status: 'live', tags: ['RSS', '新闻', '摘要'] },
  { id: 8, title: '网页智能提取', category: '知识处理', description: '输入任意 URL，AI 抓取并提取结构化信息，支持自定义字段', path: '/apps/web-scraper', icon: <SearchOutlined />, status: 'live', tags: ['爬虫', '结构化', 'Newspaper'] },
  { id: 9, title: 'AI 旅行规划', category: '对话Agent', description: '输入目的地和天数，AI 生成完整旅行攻略，含景点/行程/预算/注意事项', path: '/apps/travel-planner', icon: <CompassOutlined />, status: 'live', tags: ['旅行', '规划', '攻略'] },
  { id: 10, title: 'AI 食谱规划', category: '对话Agent', description: '输入食材和饮食偏好，AI 生成食谱、营养分析和购物清单', path: '/apps/recipe-planner', icon: <ForkOutlined />, status: 'live', tags: ['食谱', '营养', '规划'] },
  { id: 11, title: 'AI 健康健身顾问', category: '对话Agent', description: '输入身体数据和目标，AI 生成个性化健身计划和饮食方案', path: '/apps/health-advisor', icon: <HeartOutlined />, status: 'live', tags: ['健康', '健身', '饮食'] },
  { id: 12, title: 'AI 推理思考', category: '推理模型', description: '使用 DeepSeek-R1 展示思考链过程，解决复杂推理和数学题', path: '/apps/reasoning-agent', icon: <BulbOutlined />, status: 'live', tags: ['CoT', 'DeepSeek', 'Ollama'] },
  { id: 13, title: 'AI 演讲训练', category: '多媒体处理', description: '上传演讲音频，AI 转录文字并分析语速、结构、用词，给出改进建议', path: '/apps/speech-trainer', icon: <AudioOutlined />, status: 'live', tags: ['演讲', 'Whisper', 'STT'] },
  { id: 14, title: '博客转播客', category: '多媒体处理', description: '输入博客 URL，AI 生成播客脚本，edge-tts 转语音，支持下载', path: '/apps/blog-podcast', icon: <PlaySquareOutlined />, status: 'live', tags: ['TTS', '播客', '博客'] },
  { id: 15, title: 'AI 数据可视化', category: '数据分析', description: '上传 CSV，用自然语言描述想要的图表，AI 生成并返回图表图片', path: '/apps/data-viz', icon: <LineChartOutlined />, status: 'live', tags: ['图表', 'Matplotlib', 'CSV'] },
  { id: 16, title: 'Chat with PDF', category: '知识处理', description: '上传任意 PDF，AI 建立向量索引，支持 RAG 问答', path: '/apps/pdf-chat', icon: <FilePdfOutlined />, status: 'live', tags: ['PDF', 'RAG', 'Qdrant'] },
  { id: 17, title: 'AI 财务教练', category: '对话Agent', description: '输入收支和目标，AI 生成个性化财务规划、投资建议和储蓄策略', path: '/apps/finance-coach', icon: <DollarOutlined />, status: 'live', tags: ['财务', '理财', '规划'] },
  { id: 18, title: 'AI 心理健康助手', category: '对话Agent', description: 'AI 心理咨询助手，温暖共情，疏导情绪和压力（非医疗诊断）', path: '/apps/mental-wellbeing', icon: <SmileOutlined />, status: 'live', tags: ['心理', '情绪', '支持'] },
  { id: 19, title: 'AI 象棋对弈', category: '游戏娱乐', description: '与 AI 下象棋，python-chess 管理棋盘，LLM 决策走法', path: '/apps/chess-game', icon: <AppstoreOutlined />, status: 'live', tags: ['象棋', '棋盘', '游戏'] },
  { id: 20, title: 'AI 谈判模拟', category: '游戏娱乐', description: '模拟商业谈判场景，用户对阵 AI，练习谈判技巧', path: '/apps/negotiation', icon: <SwapOutlined />, status: 'live', tags: ['谈判', '模拟', '角色扮演'] },
  { id: 21, title: '塔罗牌解读', category: '娱乐体验', description: 'AI 扮演塔罗读者，随机抽牌，根据象征意义解读你的问题', path: '/apps/tarot', icon: <StarOutlined />, status: 'live', tags: ['塔罗', '占卜', '娱乐'] },
  { id: 22, title: 'Chat with ArXiv', category: '知识处理', description: '输入 ArXiv 论文 ID，AI 下载 PDF 建立索引，深度问答论文内容', path: '/apps/arxiv-chat', icon: <ReadOutlined />, status: 'live', tags: ['论文', 'ArXiv', 'RAG'] },
  { id: 23, title: 'AI 创业分析', category: '对话Agent', description: '输入创业想法，AI 分析市场趋势、竞争格局、机会和风险', path: '/apps/startup-trend', icon: <RocketOutlined />, status: 'live', tags: ['创业', '趋势', '分析'] },
  { id: 24, title: 'Gmail 智能助手', category: '知识处理', description: '连接 Gmail，AI 读取邮件、生成摘要和智能回复草稿', path: '/apps/gmail-assistant', icon: <MailOutlined />, status: 'needs-api', tags: ['Gmail', 'OAuth', '邮件'] },
  { id: 25, title: 'AI 音乐生成', category: '多媒体处理', description: '描述想要的音乐风格和情绪，AI 生成原创音乐', path: '/apps/music-gen', icon: <CustomerServiceOutlined />, status: 'needs-api', tags: ['音乐', 'Suno', '生成'] },
  { id: 26, title: 'MOSS TTS Nano', category: '多媒体处理', description: '0.1B 轻量 TTS 模型，支持中英文等 20 语言，上传参考音频即可克隆声音，纯 CPU 可运行', path: '/apps/moss-tts', icon: <CustomerServiceOutlined />, status: 'live', tags: ['TTS', '声音克隆', 'MOSS', 'CPU'] },
  { id: 0, title: '知识库 RAG', category: '知识处理', description: '多格式文档知识库管理，向量检索 + 语义重排，完整 RAG 流水线', path: '/skills/rag', icon: <DatabaseOutlined />, status: 'live', tags: ['知识库', 'RAG', 'BM25'] },
]
