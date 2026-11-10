import SingleAgentApp from '../../../components/SingleAgentApp'
import { DEFAULT_INPUTS } from '../../../service/agent'

const EXAMPLE_QUERIES = ['新能源汽车行业投资机会', '人工智能产业链投资机会', '半导体行业近期走势分析']

export default function ResearchAgent() {
  return (
    <SingleAgentApp
      agentId="research_agent"
      icon="📊"
      title="智能投研助手"
      description="深思熟虑型智能体，多步骤分析和推理，生成投资观点和研究报告"
      defaultInput={DEFAULT_INPUTS.research_agent?.research_topic as string ?? ''}
      placeholder="输入研究主题，如：新能源汽车行业投资机会"
      exampleQueries={EXAMPLE_QUERIES}
      buildInput={(query) => ({ ...DEFAULT_INPUTS.research_agent, research_topic: query })}
    />
  )
}
