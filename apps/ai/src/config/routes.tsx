import type { ComponentType } from 'react'
import Chat from '../pages/legacy-models/Chat'
import OCR from '../pages/legacy-models/OCR'
import STT from '../pages/legacy-models/STT'
import TTS from '../pages/legacy-models/TTS'
import ImageGenerate from '../pages/legacy-models/ImageGenerate'
import VideoUnderstand from '../pages/legacy-models/VideoUnderstand'
import VectorDb from '../pages/skills/VectorDb'
import KnowledgeBase from '../pages/skills/KnowledgeBase'
import KnowledgeBaseNew from '../pages/skills/KnowledgeBaseNew'
import PlaceholderPage from '../pages/PlaceholderPage'
import FunctionCall from '../pages/skills/FunctionCall'
import A2A from '../pages/skills/A2A'
import RAG from '../pages/skills/RAG'
import RagEvaluate from '../pages/skills/RagEvaluate'
import Text2SQL from '../pages/skills/Text2SQL'
import LangChain from '../pages/skills/LangChain'
import AgentHitl from '../pages/skills/AgentHitl'
import AgentReviewList from '../pages/skills/AgentReviewList'
import AgentTraces from '../pages/skills/AgentTraces'
import AgentBadCases from '../pages/skills/AgentBadCases'
import AgentSagaDemo from '../pages/skills/AgentSagaDemo'
import MCP from '../pages/skills/MCP'
import MCPManager from '../pages/skills/MCPManager'
import FineTuning from '../pages/skills/FineTuning'
import DataAnalysis from '../pages/experience/data-analysis/DataAnalysis'
import GitHubChat from '../pages/experience/knowledge/GitHubChat'
import YouTubeChat from '../pages/experience/knowledge/YouTubeChat'
import MemoryChat from '../pages/experience/other/MemoryChat'
import MixtureAgents from '../pages/experience/other/MixtureAgents'
import ResumeMatcher from '../pages/experience/other/ResumeMatcher'
import NewsAgent from '../pages/experience/knowledge/NewsAgent'
import WebScraper from '../pages/experience/knowledge/WebScraper'
import TravelPlanner from '../pages/experience/agents/TravelPlanner'
import RecipePlanner from '../pages/experience/other/RecipePlanner'
import HealthFitnessAdvisor from '../pages/experience/other/HealthFitnessAdvisor'
import ReasoningAgent from '../pages/experience/other/ReasoningAgent'
import SpeechTrainer from '../pages/experience/media/SpeechTrainer'
import BlogPodcast from '../pages/experience/media/BlogPodcast'
import DataVisualization from '../pages/experience/data-analysis/DataVisualization'
import PDFChat from '../pages/experience/other/PDFChat'
import FinanceCoach from '../pages/experience/other/FinanceCoach'
import MentalWellbeing from '../pages/experience/agents/MentalWellbeing'
import ChessGame from '../pages/experience/other/ChessGame'
import NegotiationSimulator from '../pages/experience/other/NegotiationSimulator'
import TarotReading from '../pages/experience/other/TarotReading'
import ArxivChat from '../pages/experience/other/ArxivChat'
import StartupTrend from '../pages/experience/agents/StartupTrend'
import GmailAssistant from '../pages/experience/other/GmailAssistant'
import MusicGenerator from '../pages/experience/other/MusicGenerator'
import MossTTS from '../pages/experience/media/MossTTS'
import StockAnalysis from '../pages/experience/data-analysis/StockAnalysis'
import DoctorAgent from '../pages/experience/agents/DoctorAgent'
import ResearchAgent from '../pages/experience/agents/ResearchAgent'
import DisneyServiceAgent from '../pages/experience/agents/DisneyServiceAgent'
import WealthAdvisorAgent from '../pages/experience/agents/WealthAdvisorAgent'

export interface RouteItem {
  path: string
  component: ComponentType
  label: string
}

/** 体验中心：每个 path 对应一个独立页面 */
export const experienceRoutes: RouteItem[] = [
  { path: 'llm', component: Chat, label: '语言模型' },
  { path: 'orc', component: OCR, label: 'OCR' },
  { path: 'tts', component: TTS, label: 'TTS' },
  { path: 'stt', component: STT, label: 'STT' },
  { path: 'image_generation', component: ImageGenerate, label: '图片生成' },
  { path: 'video_understanding', component: VideoUnderstand, label: '视频理解' },
]

/** 技能 / Skills：每个 path 对应一个独立页面，带 :id 的为详情/编辑页 */
export const skillsRoutes: RouteItem[] = [
  { path: 'vector-db', component: VectorDb, label: 'VectorDb' },
  { path: 'vector-db/:id', component: VectorDb, label: 'VectorDb' },
  { path: 'knowledge-base', component: KnowledgeBase, label: 'KnowledgeBase' },
  { path: 'knowledge-base/new', component: KnowledgeBaseNew, label: '新增知识库' },
  { path: 'knowledge-base/:id', component: KnowledgeBase, label: 'KnowledgeBase' },
  { path: 'rag', component: RAG, label: 'RAG' },
  { path: 'rag-evaluate', component: RagEvaluate, label: 'RAG 评测' },
  { path: 'text2sql', component: Text2SQL, label: 'Text2SQL' },
  { path: 'langchain', component: LangChain, label: 'LangChain' },
  { path: 'agent-hitl', component: AgentHitl, label: 'Agent 人工审核' },
  { path: 'agent-review', component: AgentReviewList, label: '审核列表' },
  { path: 'agent-traces', component: AgentTraces, label: '执行记录' },
  { path: 'agent-bad-cases', component: AgentBadCases, label: '飞轮埋点' },
  { path: 'agent-saga-demo', component: AgentSagaDemo, label: '副作用回滚演示' },
  { path: 'function-call', component: FunctionCall, label: 'Function Call' },
  { path: 'mcp', component: MCP, label: 'MCP 助手' },
  { path: 'mcp-manager', component: MCPManager, label: 'MCP 服务管理' },
  { path: 'a2a', component: A2A, label: 'A2A' },
  { path: 'fine-tuning', component: FineTuning, label: 'Fine Tuning' },
  { path: 'coze', component: () => <PlaceholderPage title="Coze" />, label: 'Coze' },
  { path: 'dify', component: () => <PlaceholderPage title="Dify" />, label: 'Dify' },
  { path: 'skills', component: () => <PlaceholderPage title="Skills" />, label: 'Skills' },
]

/** 应用广场 / Apps：从体验中心（Hub）卡片启动的独立应用页面 */
export const appRoutes: RouteItem[] = [
  { path: 'data-analysis', component: DataAnalysis, label: 'Data Analysis' },
  { path: 'github-chat', component: GitHubChat, label: 'GitHub Chat' },
  { path: 'youtube-chat', component: YouTubeChat, label: 'YouTube Chat' },
  { path: 'memory-chat', component: MemoryChat, label: '对话记忆' },
  { path: 'mixture-agents', component: MixtureAgents, label: 'Mixture of Agents' },
  { path: 'resume-match', component: ResumeMatcher, label: '简历匹配' },
  { path: 'news-agent', component: NewsAgent, label: 'AI 新闻' },
  { path: 'web-scraper', component: WebScraper, label: '网页提取' },
  { path: 'travel-planner', component: TravelPlanner, label: 'AI旅行规划' },
  { path: 'recipe-planner', component: RecipePlanner, label: 'AI食谱规划' },
  { path: 'health-advisor', component: HealthFitnessAdvisor, label: '健康健身顾问' },
  { path: 'reasoning-agent', component: ReasoningAgent, label: 'AI推理思考' },
  { path: 'speech-trainer', component: SpeechTrainer, label: 'AI演讲训练' },
  { path: 'blog-podcast', component: BlogPodcast, label: '博客转播客' },
  { path: 'data-viz', component: DataVisualization, label: '数据可视化' },
  { path: 'pdf-chat', component: PDFChat, label: 'Chat with PDF' },
  { path: 'finance-coach', component: FinanceCoach, label: 'AI财务教练' },
  { path: 'mental-wellbeing', component: MentalWellbeing, label: '心理健康助手' },
  { path: 'chess-game', component: ChessGame, label: 'AI象棋对弈' },
  { path: 'negotiation', component: NegotiationSimulator, label: '谈判模拟器' },
  { path: 'tarot', component: TarotReading, label: '塔罗牌解读' },
  { path: 'arxiv-chat', component: ArxivChat, label: 'Chat with ArXiv' },
  { path: 'startup-trend', component: StartupTrend, label: 'AI创业分析' },
  { path: 'gmail-assistant', component: GmailAssistant, label: 'Gmail助手' },
  { path: 'music-gen', component: MusicGenerator, label: 'AI音乐生成' },
  { path: 'moss-tts', component: MossTTS, label: 'MOSS TTS Nano' },
  { path: 'doctor-agent', component: DoctorAgent, label: '全科医生智能体' },
  { path: 'research-agent', component: ResearchAgent, label: '智能投研助手' },
  { path: 'disney-service-agent', component: DisneyServiceAgent, label: '迪士尼客服助手' },
  { path: 'wealth-advisor-agent', component: WealthAdvisorAgent, label: '财富管理投顾助手' },
  { path: 'stock-analysis', component: StockAnalysis, label: 'AI 股票分析' },
]
