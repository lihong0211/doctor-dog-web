
### 1. 什么是 LangChain？

**核心定义：**
LangChain 是一个用于开发由大语言模型驱动的应用程序的**框架**。它并不是一个提供现成应用的产品，而是一个“工具箱”和“脚手架”，旨在将LLM（如GPT-4、ChatGLM、文心一言等）与外部数据源和计算环境连接起来，从而构建功能强大、可定制的应用。

**要解决的问题：**
原始的LLM API（如OpenAI API）功能相对单一，存在几个核心痛点：

1. **无状态性：** 模型不记得你之前说过什么（每次对话都是独立的）。
2. **知识滞后：** 模型的训练数据有截止日期，无法获取最新信息或内部知识。
3. **缺乏行动能力：** 模型只能生成文本，不能执行代码、查询数据库或调用API。
4. **处理长文本困难：** 模型的输入长度（上下文窗口）有限。

LangChain 通过提供一系列标准化的、可互操作的组件，优雅地解决了这些问题。

### 2. LangChain 的核心概念与组件

我们可以将 LangChain 的架构想象成一个处理信息和执行任务的流水线。其核心组件如下：

#### 2.1 Model I/O（核心接口）

这是与LLM交互的最基础层。

* **LLMs（大语言模型）：** 接收文本输入并返回文本输出的模型，如 `GPT-3.5-turbo`。
* **Chat Models（聊天模型）：** 通常基于LLMs，但针对聊天对话进行了优化，输入和输出通常是“消息”（`HumanMessage`, `AIMessage`, `SystemMessage`）格式。
* **Prompts（提示模板）：** 可复用的文本模板，用于动态生成高质量的提示词。

**举例：基本模型调用与提示模板**

```python
from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage

# 1. 使用 LLM
llm = OpenAI(model_name="gpt-3.5-turbo-instruct") # 注意：这是补全模型
text = "给我讲一个笑话"
print(llm.invoke(text))

# 2. 使用 Chat Model (更推荐)
chat_model = ChatOpenAI(model="gpt-3.5-turbo")
messages = [HumanMessage(content="给我讲一个笑话")]
print(chat_model.invoke(messages))

# 3. 使用 Prompt Template
prompt_template = PromptTemplate.from_template(
    “你是一个专业的{profession}。请用{style}的风格，写一篇关于{topic}的简短文章。”
)
# 动态填充模板
filled_prompt = prompt_template.format(profession="厨师", style="幽默", topic="西红柿炒鸡蛋")
print(f"生成的提示词：{filled_prompt}")

# 将填充好的提示词发送给模型
result = chat_model.invoke([HumanMessage(content=filled_prompt)])
print(result.content)
```

#### 2.2 Chains（链）

Chain是LangChain的灵魂，它将多个组件“链式”组合在一起，形成一个复杂的工作流。一个链可以包含多个其他链。

**举例：一个简单的 LLMChain**

```python
from langchain.chains import LLMChain

# 结合上面定义的 chat_model 和 prompt_template
chain = LLMChain(llm=chat_model, prompt=prompt_template)

# 一键运行，无需手动格式化和调用模型
result = chain.run({
    "profession": "旅行作家",
    "style": "抒情",
    "topic": "冬日里的长城"
})
print(result)
```

**举例：更复杂的 SequentialChain（顺序链）**

假设你想先总结一篇文章，然后基于总结翻译成法语。

```python
from langchain.chains import SimpleSequentialChain

# 第一个链：总结
summary_template = PromptTemplate.from_template("请用一句话总结以下文本：\n\n{text}")
summary_chain = LLMChain(llm=chat_model, prompt=summary_template)

# 第二个链：翻译
translation_template = PromptTemplate.from_template("将以下中文文本翻译成法语：\n\n{text}")
translation_chain = LLMChain(llm=chat_model, prompt=translation_template)

# 组合成顺序链
overall_chain = SimpleSequentialChain(chains=[summary_chain, translation_chain], verbose=True)

# 运行
article_text = """
人工智能是研究、开发用于模拟、延伸和扩展人的智能的理论、方法、技术及应用系统的一门新的技术科学。
它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。
"""
final_result = overall_chain.run(article_text)
print(f"\n最终结果：{final_result}")
```

运行时会清晰地看到第一步的总结和第二步的翻译。

#### 2.3 Agents（代理）

Agent是更高级的“链”，它赋予LLM**推理和行动**的能力。Agent可以访问一套工具（如搜索、计算、数据库查询），并根据用户目标**自主决定**使用哪个工具、以什么顺序使用。

**核心概念：**

* **Tool（工具）：** Agent可以使用的函数，如Google搜索、Python REPL（代码执行）、数据库查询等。
* **ReAct框架：** Agent内部遵循 `Thought -> Action -> Observation` 的循环，直到得出最终答案。

**举例：一个使用搜索引擎和计算器的代理**

```python
from langchain.agents import load_tools, initialize_agent, AgentType
from langchain.agents import Tool
from langchain.utilities import SerpAPIWrapper, WikipediaAPIWrapper

# 初始化模型
llm_for_agent = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

# 加载一些内置工具（需要申请对应API Key）
# tools = load_tools(["serpapi", "llm-math"], llm=llm_for_agent)

# 或者自定义工具
def custom_length_function(text: str) -> str:
    “”“计算文本的长度。”“”
    return f"文本的长度是 {len(text)} 个字符。"

custom_tool = Tool(
    name="Text Length Calculator",
    func=custom_length_function,
    description="当你需要计算一段文本的字符数量时非常有用。"
)

# 假设我们只有自定义工具
tools = [custom_tool]

# 初始化代理
agent = initialize_agent(
    tools,
    llm_for_agent,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION, # 一种代理类型
    verbose=True, # 打印详细思考过程
    handle_parsing_errors=True
)

# 运行！模型会自己决定是否需要使用工具。
result = agent.run("“Hello, World!” 这句话的长度是多少？")
print(result)
```

运行此代码，你会看到类似以下的输出：

```
> Entering new AgentExecutor chain...
我需要找出“Hello, World!”这句话的字符长度。我有一个工具可以计算文本长度。
Action: Text Length Calculator
Action Input: "Hello, World!"
Observation: 文本的长度是 13 个字符。
我现在知道最终答案了。
Final Answer: “Hello, World!” 这句话的长度是 13 个字符。
```

#### 2.4 Memory（记忆）

Memory组件用于在多次交互中持久化状态/记忆，解决LLM的无状态问题。

**举例：ConversationBufferMemory**

```python
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain

# 创建带有记忆的对话链
memory = ConversationBufferMemory()
conversation = ConversationChain(
    llm=chat_model,
    memory=memory,
    verbose=True # 打印出记忆内容
)

print(conversation.run("我叫小明。"))
print(conversation.run("我最喜欢的水果是苹果。"))
print(conversation.run("你还记得我的名字和我喜欢什么水果吗？"))
```

在第三次提问时，模型会因为Memory的存在而正确回答出“小明”和“苹果”。

#### 2.5 Retrieval（检索）

这是LangChain最强大的功能之一，用于让LLM访问外部知识库（你自己的文档、数据库等）。核心是 **RAG（Retrieval-Augmented Generation）** 架构。

**工作流程：**

1. **加载文档：** 从各种源（PDF、TXT、网页）加载数据。
2. **分割文档：** 将长文档切分成小块，以适应模型的上下文窗口。
3. **向量化嵌入：** 使用嵌入模型将文本块转换为数值向量。
4. **存储向量：** 将向量存入向量数据库（如Chroma, Pinecone）。
5. **检索：** 当用户提问时，将问题也转换为向量，并从向量数据库中检索最相关的文本块。
6. **增强生成：** 将检索到的文本块作为上下文，与原始问题一起交给LLM生成答案。

**举例：一个简单的本地文档问答系统**

```python
from langchain.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA

# 1. 加载文档 (假设有一个 ‘state_of_the_union.txt’ 文件)
loader = TextLoader('./state_of_the_union.txt')
documents = loader.load()

# 2. 分割文档
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
texts = text_splitter.split_documents(documents)

# 3. 创建向量存储
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(texts, embeddings)

# 4. 创建检索式QA链
qa_chain = RetrievalQA.from_chain_type(
    llm=chat_model,
    chain_type="stuff", # 一种简单的处理检索结果的方式
    retriever=vectorstore.as_retriever()
)

# 5. 提问！
query = "总统在演讲中主要谈了什么问题？"
result = qa_chain.run(query)
print(result)
```

### 3. 总结与类比

| LangChain 组件      | 现实世界类比         | 功能                                           |
| :------------------ | :------------------- | :--------------------------------------------- |
| **Model I/O** | 一个博学但健忘的专家 | 提供核心的文本理解和生成能力。                 |
| **Prompts**   | 给专家的工作指令单   | 标准化、优化与专家的沟通方式。                 |
| **Chains**    | 生产线或工作流程     | 将简单任务串联成复杂的多步工作流。             |
| **Agents**    | 项目经理/CEO         | 具备规划和决策能力，可以调用各种工具完成任务。 |
| **Memory**    | 会议纪要或备忘录     | 记录对话历史，实现连贯的上下文交流。           |
| **Retrieval** | 公司的档案库或数据库 | 让专家能够查阅外部知识，给出基于事实的答案。   |

### 何时使用 LangChain？

* **构建复杂的LLM应用：** 需要多步推理、工具调用或访问私有数据。
* **快速原型开发：** 利用其标准化组件快速验证想法。
* **生产环境部署：** 需要稳定的、可维护的LLM应用架构。
