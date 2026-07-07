# RAG 接口文档

基于知识库的检索与问答（RAG），支持可选 **Query 改写**（CASEA）与 **Rerank**（DashScope），并返回前后状态供前端展示。

---

## 1. RAG 问答

在指定知识库中检索相关文档，调用大模型生成答案，并返回引用来源。可选开启 Query 改写、Rerank，响应中会包含改写前后、重排前后的状态。

### 请求

| 方法 | 路径            |
| ---- | --------------- |
| POST | `/ai/rag/ask` |

**请求体（JSON）**

| 参数                 | 类型           | 必填   | 说明                                  |
| -------------------- | -------------- | ------ | ------------------------------------- |
| knowledge_base_id    | int            | 二选一 | 知识库 ID（与 kb_name 二选一）        |
| kb_id                | int            | 同上   | 同上                                  |
| knowledge_base_name  | string         | 二选一 | 知识库名称                            |
| kb_name              | string         | 同上   | 同上                                  |
| question             | string         | 是     | 用户问题（与 query 二选一）           |
| query                | string         | 同上   | 同上                                  |
| top_k                | int            | 否     | 检索条数，默认 5，范围 1–20          |
| model                | string         | 否     | 生成答案所用模型，默认 `qwen-turbo` |
| enable_query_rewrite | bool           | 否     | 是否启用 Query 改写，默认 false       |
| enable_rerank        | bool           | 否     | 是否启用 Rerank，默认 false           |
| conversation_history | string\| array | 否     | 对话历史，供 Query 改写使用           |

**参数别名（任选其一即可）**

- 知识库：`knowledge_base_id` / `kb_id` / `db_id`
- 知识库名称：`knowledge_base_name` / `kb_name` / `db_name` / `db` / `name` / `kb`
- 问题：`question` / `query`

### 响应

**成功：HTTP 200**

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "answer": "根据资料，……",
    "sources": [
      {
        "doc_id": 1,
        "text": "文档内容摘要（前 200 字）...",
        "category": "分类名",
        "rank": 1,
        "distance": 0.12,
        "relevance_score": null
      }
    ],
    "model": "qwen-turbo",
    "query_rewrite": null,
    "rewritten_query": null,
    "rerank": null
  }
}
```

**`data` 字段说明**

| 字段            | 类型          | 说明                                                                                                  |
| --------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| answer          | string        | 大模型生成的答案                                                                                      |
| sources         | array         | 参与生成答案的文档来源（摘要、rank、distance 或 relevance_score）                                     |
| model           | string        | 实际使用的生成模型                                                                                    |
| query_rewrite   | object\| null | 仅当 `enable_query_rewrite=true` 时有值，含原始/改写后 query 等，见下方                             |
| rewritten_query | string\| null | 仅当启用 Query 改写时有值，即改写后用于检索的问题（顶层便于前端展示）                                 |
| rerank          | object\| null | 仅当 `enable_rerank=true` 时有值，**始终包含重排前/重排后结果** `before`、`after`，见下方 |

**`query_rewrite`（启用改写时）**

用于前端展示「原始问题 vs 改写后问题」。

```json
{
  "original_query": "还有没有别的注意事项？",
  "rewritten_query": "迪士尼乐园游玩的其它注意事项有哪些？",
  "query_type": "上下文依赖型",
  "confidence": 0.85
}
```

| 字段            | 说明                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| original_query  | 用户原始问题                                                              |
| rewritten_query | 改写后用于检索的问题                                                      |
| query_type      | 识别类型：上下文依赖型、对比型、模糊指代型、多意图型、反问型、无需改写 等 |
| confidence      | 置信度 0–1                                                               |

**`rerank`（启用 Rerank 时）**

启用 Rerank 时**一定会返回**重排前后的结果，供前端展示「重排前 vs 重排后」的顺序与分数。`before` 为向量检索原始顺序（含 `rank`、`distance`），`after` 为重排后顺序（含 `rank`、`relevance_score`）。即使仅 1 条结果也会返回 before/after。

```json
{
  "before": [
    {
      "doc_id": 1,
      "text": "…",
      "category": "…",
      "rank": 1,
      "distance": 0.12,
      "relevance_score": null
    }
  ],
  "after": [
    {
      "doc_id": 2,
      "text": "…",
      "category": "…",
      "rank": 1,
      "distance": null,
      "relevance_score": 0.92
    }
  ],
  "model": "qwen3-rerank"
}
```

| 字段   | 说明                                                  |
| ------ | ----------------------------------------------------- |
| before | 向量检索原始顺序，每项含 `rank`、`distance`       |
| after  | Rerank 后的顺序，每项含 `rank`、`relevance_score` |
| model  | 使用的 Rerank 模型                                    |
| error  | 可选，Rerank 调用失败时的错误信息                     |

### 请求示例

**仅检索 + 生成（默认）**

```json
POST /ai/rag/ask
{
  "knowledge_base_id": 10,
  "question": "迪士尼入园需要带什么？",
  "top_k": 5
}
```

**启用 Query 改写 + Rerank，并带对话历史**

```json
POST /ai/rag/ask
{
  "kb_id": 10,
  "question": "还有没有别的注意事项？",
  "top_k": 5,
  "enable_query_rewrite": true,
  "enable_rerank": true,
  "conversation_history": "用户：迪士尼入园要带什么？\n助手：请携带身份证、门票……"
}
```

### 错误

| 情况                     | HTTP | 说明                                            |
| ------------------------ | ---- | ----------------------------------------------- |
| 缺少 question/query      | 400  | 请提供 question 或 query                        |
| 未指定知识库             | 400  | 请提供 knowledge_base_id 或 knowledge_base_name |
| knowledge_base_id 非数字 | 400  | knowledge_base_id 必须为数字                    |
| 知识库不存在             | 404  | FileNotFoundError：知识库不存在                 |

---

## 2. RAG 检索（仅向量检索）

在指定知识库中做向量检索，不调用大模型，只返回检索结果。用于调试或仅需“查相似文档”的场景。

### 请求

| 方法 | 路径               |
| ---- | ------------------ |
| POST | `/ai/rag/search` |

**请求体（JSON）**

| 参数                          | 类型   | 必填   | 说明                                    |
| ----------------------------- | ------ | ------ | --------------------------------------- |
| knowledge_base_id             | int    | 二选一 | 知识库 ID                               |
| kb_id                         | int    | 同上   | 同上                                    |
| knowledge_base_name           | string | 二选一 | 知识库名称（传 kb_id 时会自动解析名称） |
| kb_name / db_name / db / name | string | 同上   | 同上                                    |
| query                         | string | 是     | 检索 query                              |
| top_k                         | int    | 否     | 返回条数，默认 3，范围 1–20            |

### 响应

**成功：HTTP 200**

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "knowledge_base": "kb_10",
    "query": "入园须知",
    "results": [
      {
        "rank": 1,
        "distance": 0.15,
        "doc": {
          "id": 1,
          "text": "文档全文或片段…",
          "category": "分类",
          "metadata": {}
        }
      }
    ]
  }
}
```

| 字段           | 说明                                                           |
| -------------- | -------------------------------------------------------------- |
| knowledge_base | 实际使用的知识库名称                                           |
| query          | 检索 query                                                     |
| results        | 按相似度排序的文档列表，每项含 `rank`、`distance`、`doc` |

### 错误

| 情况           | HTTP | 说明                                              |
| -------------- | ---- | ------------------------------------------------- |
| 缺少知识库标识 | 400  | 缺少参数 knowledge_base_id 或 knowledge_base_name |
| 缺少 query     | 400  | 缺少参数 query                                    |
| 知识库不存在   | 404  | 知识库不存在                                      |
| 检索超时       | 504  | 检索超时，请稍后重试                              |

---

## 依赖与配置

- **Query 改写 / Rerank**：依赖阿里云 DashScope（需配置 `DASHSCOPE_API_KEY`）。
- **生成答案**：使用当前项目配置的 OpenAI 兼容接口（如 DashScope 等），见 `service/ai/vector_db.py` 中 `client` 的配置。
