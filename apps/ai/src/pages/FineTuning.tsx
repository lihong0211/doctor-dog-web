import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Tag, Spin, Card } from 'antd'
import {
  finetuningChat,
  finetuningChatStreamCompare,
  type FinetuningMessage,
  type FinetuningOptions,
} from '../service/finetuning'
import AskInput from '../components/AskInput'
import './MCP/MCPGaode.css'

/** 用于展示的消息：助手消息可带 base / lora 以两栏展示 */
type DisplayMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; base?: string; lora?: string }

interface LoraModel {
  id: string
  name: string
  icon: string
  tag: string
  tagColor: string
  description: string
  placeholder: string
}

const BASE_MODEL = {
  name: 'Qwen2.5-7B',
  icon: '🧠',
  description: '通用对话能力，Qwen2.5 系列基础语言模型，未经任何领域微调。',
}

const LORA_MODELS: LoraModel[] = [
  {
    id: 'medical',
    name: '医疗问诊 LoRA',
    icon: '🩺',
    tag: '医疗',
    tagColor: 'red',
    description: '专注医疗诊断与健康咨询，微调自 Qwen2.5-7B，适用于医患对话场景。',
    placeholder: '请描述您的症状或健康问题…',
  },
  {
    id: 'legal',
    name: '法律咨询 LoRA',
    icon: '⚖️',
    tag: '法律',
    tagColor: 'orange',
    description: '专注法律条文解读与合规建议，适用于常见法律咨询场景。',
    placeholder: '请描述您的法律问题…',
  },
]

/** 各 LoRA 对应的数据集来源说明 */
const DATASET_SOURCES: Record<string, { title: string; items: { name: string; source: string; content: string; scale: string; format: string }[] }> = {
  medical: {
    title: '华驼 · 医疗',
    items: [
      {
        name: 'HuatuoGPT-SFT-v1',
        source: '香港中文大学（深圳）发布，FreedomIntelligence/HuatuoGPT',
        content: '真实医患问答对话，涵盖内科、外科、妇科、儿科等常见科室',
        scale: '226,042 条',
        format: '多轮问答（问/答交替），取第一对',
      },
      {
        name: 'Huatuo Encyclopedia QA',
        source: '同一团队发布，FreedomIntelligence/huatuo_encyclopedia_qa',
        content: '中文医学百科知识库，覆盖疾病介绍、症状、用药、治疗方案等结构化知识',
        scale: '362,420 条',
        format: '问题 + 医学百科答案，取最长答案',
      },
    ],
  },
  legal: {
    title: 'DISC-Law · 法律',
    items: [
      {
        name: 'DISC-Law-SFT（Pair-QA）',
        source: '复旦大学发布，ShengbinYue/DISC-Law-SFT',
        content: '法律咨询问答对，覆盖劳动纠纷、婚姻家庭、合同纠纷、刑事、交通事故等常见法律场景',
        scale: '79,692 条',
        format: '单轮问答（input/output）',
      },
      {
        name: 'DISC-Law-SFT（Triplet-QA）',
        source: '同一数据集，Triplet 子集',
        content: '在 Pair-QA 基础上额外附带相关法律条文引用（如《民法典》第XX条），答案质量更高',
        scale: '23,331 条',
        format: '法律条文参考 + 问题 + 答案，直接使用 input/output 两字段',
      },
    ],
  },
}

/** 各 LoRA 的示例问题，点击即发送 */
const LORA_EXAMPLES: Record<string, string[]> = {
  medical: [
    '最近总是头痛，偶尔会恶心，需要做哪些检查？',
    '体检报告里尿酸偏高，饮食上要注意什么？',
    '感冒发烧 38.5°C，可以吃哪种退烧药？',
    '高血压患者日常有哪些禁忌？',
  ],
  legal: [
    '劳动合同试用期最长可以约定多久？',
    '租房合同里押金条款怎么写才合法？',
    '民间借贷利息超过多少不受法律保护？',
    '离婚时子女抚养权一般如何判定？',
  ],
}

function getLoraExamples(loraId: string): string[] {
  return LORA_EXAMPLES[loraId] ?? []
}

const options: FinetuningOptions = {
  temperature: 0.7,
  num_predict: 512,
  top_p: 0.9,
  repeat_penalty: 1.1,
}

export default function FineTuning() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [selectedLoraId, setSelectedLoraId] = useState<string>(LORA_MODELS[0].id)
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingBase, setStreamingBase] = useState('')
  const [streamingLora, setStreamingLora] = useState('')
  const [lastBase, setLastBase] = useState<string | null>(null)
  const [lastLora, setLastLora] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedLora = LORA_MODELS.find((m) => m.id === selectedLoraId) ?? LORA_MODELS[0]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, streamingBase, streamingLora, loading])

  const handleSelectLora = (id: string) => {
    if (loading) return
    setSelectedLoraId(id)
    setMessages([])
    setStreamingBase('')
    setStreamingLora('')
    setLastBase(null)
    setLastLora(null)
  }

  const handleSend = async (overrideMessage?: string) => {
    const prompt = (typeof overrideMessage === 'string' ? overrideMessage : message).trim()
    if (!prompt || loading) return

    setLoading(true)
    setMessage('')
    setStreamingContent('')
    setStreamingBase('')
    setStreamingLora('')
    setLastBase(null)
    setLastLora(null)

    const userMsg: DisplayMessage = { role: 'user', content: prompt }
    const history: DisplayMessage[] = [...messages, userMsg]
    setMessages(history)

    const payload = {
      messages: history.map((m) => ({ role: m.role, content: m.content })) as FinetuningMessage[],
      options,
      lora_id: selectedLoraId,
    }

    try {
      let baseContent = ''
      let loraContent = ''
      await finetuningChatStreamCompare(payload, {
        onBaseChunk(c) {
          baseContent += c
          setStreamingBase(baseContent)
        },
        onLoraChunk(c) {
          loraContent += c
          setStreamingLora(loraContent)
        },
        onDone() {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: loraContent || baseContent, base: baseContent, lora: loraContent },
          ])
          setLastBase(baseContent)
          setLastLora(loraContent)
          setStreamingBase('')
          setStreamingLora('')
          setLoading(false)
        },
        onError(err) {
          setMessages((prev) => [...prev, { role: 'assistant', content: `错误: ${err}` }] as DisplayMessage[])
          setStreamingBase('')
          setStreamingLora('')
          setLoading(false)
        },
      })
    } catch (e) {
      // fallback to non-stream
      try {
        const res = await finetuningChat({ messages: payload.messages, options })
        const content = res.lora ?? res.base ?? res.message?.content ?? ''
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content, base: res.base, lora: res.lora },
        ] as DisplayMessage[])
      } catch (e2) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `错误: ${(e2 as Error).message}` },
        ] as DisplayMessage[])
      }
      setLoading(false)
    }
  }

  return (
    <div className="mcp-gaode">
      {/* 左侧侧栏 */}
      <aside className="mcp-gaode-sidebar">
        {/* 基座模型信息 */}
        <div className="mcp-gaode-sidebar-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div
              className="mcp-gaode-logo"
              style={{ width: 44, height: 44, fontSize: 22, marginBottom: 0, flexShrink: 0 }}
            >
              {BASE_MODEL.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 className="mcp-gaode-title" style={{ fontSize: 15, margin: '0 0 4px 0' }}>
                {BASE_MODEL.name}
              </h1>
              <Tag color="default" style={{ margin: 0 }}>基座模型</Tag>
            </div>
          </div>
          <p className="mcp-gaode-desc">{BASE_MODEL.description}</p>
        </div>

        {/* LoRA 模型选择 */}
        <div className="mcp-gaode-sidebar-card">
          <h2 className="mcp-gaode-sidebar-heading">选择 LoRA 模型</h2>
          <ul className="mcp-gaode-recommended">
            {LORA_MODELS.map((lora) => {
              const isSelected = selectedLoraId === lora.id
              return (
                <li key={lora.id}>
                  <button
                    type="button"
                    className="mcp-gaode-recommended-btn"
                    onClick={() => handleSelectLora(lora.id)}
                    disabled={loading}
                    style={isSelected ? {
                      borderColor: 'var(--ds-primary)',
                      background: 'linear-gradient(to right, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 100%)',
                      fontWeight: 600,
                      color: '#1e293b',
                    } : undefined}
                  >
                    <span style={{ marginRight: 6 }}>{lora.icon}</span>
                    {lora.name}
                    <Tag
                      color={lora.tagColor}
                      style={{ marginLeft: 6, fontSize: 10, padding: '0 5px', lineHeight: '18px' }}
                    >
                      {lora.tag}
                    </Tag>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* 数据集来源 */}
        {DATASET_SOURCES[selectedLoraId] && (
          <div className="mcp-gaode-sidebar-card">
            <h2 className="mcp-gaode-sidebar-heading">数据集来源</h2>
            <p className="mcp-gaode-desc" style={{ marginBottom: 10, fontSize: 12 }}>
              {selectedLoraId === 'medical'
                ? '来自「华驼」项目，是目前中文医疗 LLM 微调领域质量较高的公开数据集。'
                : '来自 DISC-LawLLM 项目（复旦大学数据智能与知识计算实验室），是目前中文法律 SFT 领域覆盖最广、质量最高的公开数据集之一。'}
            </p>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.6 }}>
              {DATASET_SOURCES[selectedLoraId].items.map((ds, idx) => (
                <li key={idx} style={{ marginBottom: 10 }}>
                  <strong style={{ color: 'var(--ds-text)' }}>{ds.name}</strong>
                  <br />
                  <span style={{ fontSize: 11 }}>来源：{ds.source}</span>
                  <br />
                  <span>{ds.content}</span>
                  <br />
                  <span style={{ fontSize: 11 }}>规模：{ds.scale} · 格式：{ds.format}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* 右侧主区 */}
      <main className="mcp-gaode-main">
        {/* 对话消息区 */}
        <div className="mcp-gaode-messages">
          {messages.length === 0 && (
            <div className="mcp-gaode-empty">
              <div className="mcp-gaode-empty-row">
                <span style={{ fontSize: 36 }}>{selectedLora.icon}</span>
                <span className="mcp-gaode-empty-text">基座 vs {selectedLora.name}</span>
              </div>
              <p className="mcp-gaode-empty-hint">发送消息后，将同时对比基座模型与 LoRA 模型的回答</p>
            </div>
          )}

          {messages.map((m, i) => {
            const isLastAssistant = m.role === 'assistant' && i === messages.length - 1
            const showAsStreaming = isLastAssistant && (streamingBase || streamingLora)
            const hasCompare = m.role === 'assistant' && 'base' in m && (m.base != null || m.lora != null)

            if (m.role === 'user') {
              return (
                <div key={i} className="mcp-gaode-row mcp-gaode-row-user">
                  <div className="mcp-gaode-bubble mcp-gaode-bubble-user mcp-gaode-bubble-text">
                    {m.content}
                  </div>
                </div>
              )
            }

            if (m.role === 'assistant' && hasCompare && !showAsStreaming) {
              // 流式输出进行中时跳过（避免与流式块重复渲染），流结束后正常展示
              if (isLastAssistant && (streamingBase || streamingLora)) return null
              return (
                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', padding: '0 40px' }}>
                  <Card size="small" title={`🧠 基座模型`} style={{ flex: 1, minWidth: 280 }}>
                    <div className="markdown-body" style={{ lineHeight: 1.65, color: 'var(--ds-text)' }}>
                      <ReactMarkdown>{m.base ?? '—'}</ReactMarkdown>
                    </div>
                  </Card>
                  <Card
                    size="small"
                    title={<span>{selectedLora.icon} {selectedLora.name}</span>}
                    style={{ flex: 1, minWidth: 280 }}
                    styles={{ header: { borderBottom: '2px solid var(--ds-primary)' } }}
                  >
                    <div className="markdown-body" style={{ lineHeight: 1.65, color: 'var(--ds-text)' }}>
                      <ReactMarkdown>{m.lora ?? '—'}</ReactMarkdown>
                    </div>
                  </Card>
                </div>
              )
            }

            return (
              <div key={i} className="mcp-gaode-row mcp-gaode-row-assistant">
                <div className="mcp-gaode-bubble mcp-gaode-bubble-assistant mcp-gaode-bubble-text markdown-body">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            )
          })}

          {/* 加载中 */}
          {loading && !streamingContent && !streamingBase && !streamingLora && (
            <div className="mcp-gaode-row mcp-gaode-row-assistant">
              <div className="mcp-gaode-bubble mcp-gaode-bubble-assistant mcp-gaode-typing">
                <span className="mcp-gaode-typing-label">生成中</span>
                <span className="mcp-gaode-typing-dots"><i /><i /><i /></span>
              </div>
            </div>
          )}

          {/* 流式对比输出 */}
          {(streamingBase || streamingLora || (loading && (lastBase != null || lastLora != null))) && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', padding: '0 40px' }}>
              <Card size="small" title="🧠 基座模型" style={{ flex: 1, minWidth: 280 }}>
                <div className="markdown-body" style={{ lineHeight: 1.65, color: 'var(--ds-text)' }}>
                  <ReactMarkdown>{(streamingBase || lastBase) ?? '—'}</ReactMarkdown>
                </div>
              </Card>
              <Card
                size="small"
                title={<span>{selectedLora.icon} {selectedLora.name}</span>}
                style={{ flex: 1, minWidth: 280 }}
                styles={{ header: { borderBottom: '2px solid var(--ds-primary)' } }}
              >
                <div className="markdown-body" style={{ lineHeight: 1.65, color: 'var(--ds-text)' }}>
                  {streamingLora || lastLora
                    ? <ReactMarkdown>{(streamingLora || lastLora)!}</ReactMarkdown>
                    : <Spin size="small" />
                  }
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 底部输入区：示例问题放在输入框内 */}
        <AskInput
          value={message}
          onChange={setMessage}
          onSend={() => handleSend()}
          innerTopSlot={
            getLoraExamples(selectedLoraId).length > 0 ? (
              <>
                {getLoraExamples(selectedLoraId).map((q) => (
                  <Tag
                    key={q}
                    style={{ cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 12, padding: '2px 10px', fontSize: 12, margin: 0 }}
                    onClick={() => !loading && handleSend(q)}
                  >
                    {q}
                  </Tag>
                ))}
              </>
            ) : undefined
          }
          placeholder={selectedLora.placeholder}
          loading={loading}
          maxRows={3}
        />
      </main>
    </div>
  )
}
