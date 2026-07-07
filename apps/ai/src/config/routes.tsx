import type { ComponentType } from 'react'
import Chat from '../pages/Chat'
import OCR from '../pages/OCR'
import STT from '../pages/STT'
import TTS from '../pages/TTS'
import ImageGenerate from '../pages/ImageGenerate'
import VideoUnderstand from '../pages/VideoUnderstand'
import VectorDb from '../pages/VectorDb'
import KnowledgeBase from '../pages/KnowledgeBase'
import KnowledgeBaseNew from '../pages/KnowledgeBaseNew'
import PlaceholderPage from '../pages/PlaceholderPage'
import FunctionCall from '../pages/FunctionCall'
import A2A from '../pages/A2A'
import RAG from '../pages/RAG'
import Text2SQL from '../pages/Text2SQL'
import LangChain from '../pages/LangChain'
import MCP from '../pages/MCP'
import Agent from '../pages/Agent'
import FineTuning from '../pages/FineTuning'
import DataAnalysis from '../pages/DataAnalysis'
import GitHubChat from '../pages/GitHubChat'
import YouTubeChat from '../pages/YouTubeChat'
import MemoryChat from '../pages/MemoryChat'
import MixtureAgents from '../pages/MixtureAgents'
import ResumeMatcher from '../pages/ResumeMatcher'
import NewsAgent from '../pages/NewsAgent'
import WebScraper from '../pages/WebScraper'
import TravelPlanner from '../pages/TravelPlanner'
import RecipePlanner from '../pages/RecipePlanner'
import HealthFitnessAdvisor from '../pages/HealthFitnessAdvisor'
import ReasoningAgent from '../pages/ReasoningAgent'
import SpeechTrainer from '../pages/SpeechTrainer'
import BlogPodcast from '../pages/BlogPodcast'
import DataVisualization from '../pages/DataVisualization'
import PDFChat from '../pages/PDFChat'
import FinanceCoach from '../pages/FinanceCoach'
import MentalWellbeing from '../pages/MentalWellbeing'
import ChessGame from '../pages/ChessGame'
import NegotiationSimulator from '../pages/NegotiationSimulator'
import TarotReading from '../pages/TarotReading'
import ArxivChat from '../pages/ArxivChat'
import StartupTrend from '../pages/StartupTrend'
import GmailAssistant from '../pages/GmailAssistant'
import MusicGenerator from '../pages/MusicGenerator'
import MossTTS from '../pages/MossTTS'

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
  { path: 'text2sql', component: Text2SQL, label: 'Text2SQL' },
  { path: 'langchain', component: LangChain, label: 'LangChain' },
  { path: 'function-call', component: FunctionCall, label: 'Function Call' },
  { path: 'mcp', component: MCP, label: 'MCP 助手' },
  { path: 'a2a', component: A2A, label: 'A2A' },
  { path: 'agent', component: Agent, label: 'Agent' },
  { path: 'fine-tuning', component: FineTuning, label: 'Fine Tuning' },
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
  { path: 'coze', component: () => <PlaceholderPage title="Coze" />, label: 'Coze' },
  { path: 'dify', component: () => <PlaceholderPage title="Dify" />, label: 'Dify' },
  { path: 'skills', component: () => <PlaceholderPage title="Skills" />, label: 'Skills' },
]
