
## **LCEL（LangChain Expression Language）**

LCEL 是 LangChain 的核心组件，它是一种声明式的方式来构建链（chains）。它让构建复杂应用变得简单直观。

### 主要特点：

- **声明式语法**：用 `|` 操作符连接组件
- **自动并行化**：优化执行效率
- **流式输出**：支持实时 token 流式传输
- **易于调试**：提供可视化工具
- **生产就绪**：内置重试、回退、日志等

### 基本示例：

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

# 创建链
chain = (
    ChatPromptTemplate.from_template("用中文回答：{question}") 
    | ChatOpenAI(model="gpt-3.5-turbo")
    | (lambda x: x.content)  # 提取内容
)

# 运行链
result = chain.invoke({"question": "什么是人工智能？"})
print(result)
```

## **常见使用场景**

### 1. **简单问答链**

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个专业的AI助手"),
    ("human", "{input}")
])

llm = ChatOpenAI(model="gpt-3.5-turbo")
chain = prompt | llm | (lambda x: x.content)
```

### 2. **带输出的链**

```python
from langchain_core.output_parsers import StrOutputParser

chain = prompt | llm | StrOutputParser()
```

### 3. **多个组件的链**

```python
from langchain_core.runnables import RunnablePassthrough

def length_function(text):
    return len(text)

chain = (
    {"text": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
    | length_function
)
```

### 4. **条件判断分支**

```python
from langchain_core.runnables import RunnableBranch

branch = RunnableBranch(
    (lambda x: "你好" in x, lambda x: "欢迎！"),
    (lambda x: "谢谢" in x, lambda x: "不客气！"),
    lambda x: "我不确定如何回答"
)
```

## **高级功能**

### 流式输出

```python
for chunk in chain.stream({"question": "请介绍一下你自己"}):
    print(chunk, end="", flush=True)
```

### 批量处理

```python
results = chain.batch([
    {"question": "问题1"},
    {"question": "问题2"}
])
```

### 异步支持

```python
async def process():
    result = await chain.ainvoke({"question": "异步问题"})
```

## **最佳实践**

1. **模块化设计**：将复杂链拆分为小模块
2. **错误处理**：使用 `with_fallbacks()` 添加回退
3. **调试**：使用 `chain.get_graph().print_ascii()` 可视化
4. **配置管理**：使用 `with_config()` 管理运行时配置

## **学习建议**

1. **从简单开始**：先掌握 `|` 操作符的基本用法
2. **理解组件**：熟悉 Prompt、LLM、OutputParser 等核心组件
3. **实践项目**：从简单的聊天机器人开始
4. **参考官方文档**：LangChain 文档有丰富的示例

需要我详细解释某个特定方面，或者帮你解决具体问题吗？
