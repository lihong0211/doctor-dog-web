import SingleAgentApp from '../../../components/SingleAgentApp'

const EXAMPLE_QUERIES = ['上海迪士尼乐园的开放时间是多少？']

export default function DisneyServiceAgent() {
  return (
    <SingleAgentApp
      agentId="fund_qa_agent"
      icon="🏰"
      title="迪士尼客服助手"
      description="反应式智能体，回答关于迪士尼乐园、电影、角色、门票、园区等问题"
      defaultInput={EXAMPLE_QUERIES[0]}
      placeholder="输入问题，如：上海迪士尼乐园的开放时间是多少？"
      exampleQueries={EXAMPLE_QUERIES}
      buildInput={(query) => ({ messages: [{ role: 'user', content: query }] })}
    />
  )
}
