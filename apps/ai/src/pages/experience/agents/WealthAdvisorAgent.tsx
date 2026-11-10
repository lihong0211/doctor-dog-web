import SingleAgentApp from '../../../components/SingleAgentApp'
import { DEFAULT_INPUTS } from '../../../service/agent'

const EXAMPLE_QUERIES = [
  '根据当前市场情况，我应该如何调整投资组合以应对可能的经济衰退？',
  '我想为子女准备教育金，请帮我设计一个10年期的投资计划。',
]

export default function WealthAdvisorAgent() {
  return (
    <SingleAgentApp
      agentId="wealth_advisor_agent"
      icon="💰"
      title="财富管理投顾助手"
      description="混合型智能体，结合反应式与深思熟虑，提供财富管理咨询服务"
      defaultInput={DEFAULT_INPUTS.wealth_advisor_agent?.user_query as string ?? ''}
      placeholder="输入咨询问题，如：如何调整投资组合？"
      exampleQueries={EXAMPLE_QUERIES}
      buildInput={(query) => ({ ...DEFAULT_INPUTS.wealth_advisor_agent, user_query: query })}
    />
  )
}
