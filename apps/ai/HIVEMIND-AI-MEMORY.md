# HiveMind 跨工具 AI 记忆共享说明

> 本文档记录本机 Hermes、Cursor、Codex、Claude Code 等 AI 助手通过 HiveMind 共享记忆的配置与使用方式。  
> 最后更新：2026-06-19

---

## 1. 结论

**Hermes 已与 Cursor、Codex、Claude Code 共享同一套云端 AI 记忆。**

所有工具通过 [HiveMind](https://github.com/activeloopai/hivemind)（Activeloop / Deeplake）接入，使用相同的组织（Org）与工作区（Workspace），在 session 开始时自动 recall 历史记忆，在对话过程中 capture 新内容。

---

## 2. 已接入工具一览

| 工具 | 配置路径 | 接入方式 | 状态 |
|------|----------|----------|------|
| **Hermes**（微信 Gateway） | `~/.hermes` | hooks + MCP | ✅ 已接入 |
| **Cursor** | `~/.cursor` | `hooks.json` | ✅ 已接入 |
| **Codex** | `~/.codex` | `hooks.json` | ✅ 已接入 |
| **Claude Code** | `~/.claude` | 插件 `hivemind@hivemind` | ✅ 已启用 |
| **OpenClaw** | `~/.openclaw` | HiveMind 检测 | ✅ 已检测 |

验证命令：

```bash
hivemind status
```

预期输出包含 `logged in: yes` 及上述 assistant 列表。

---

## 3. 云端账号信息

| 项 | 值 |
|----|-----|
| 凭证文件 | `~/.deeplake/credentials.json` |
| API | `https://api.deeplake.ai` |
| Org | `lihong0211yao's Organization` |
| Workspace | `default` |
| HiveMind CLI 版本 | `0.7.102`（2026-06-19 检测） |

所有工具读写同一 Org + Workspace，因此记忆在工具间互通。

---

## 4. 记忆架构

### 4.1 两套记忆，不要混淆

| 类型 | 存储位置 | 是否跨工具 | 说明 |
|------|----------|------------|------|
| **HiveMind 云端记忆** | Deeplake API | ✅ 共享 | 各工具 hooks 自动 capture / recall |
| **Hermes 本地记忆** | `~/.hermes/memories/USER.md` 等 | ❌ 仅 Hermes | Hermes 内置 profile，不自动同步到其他 IDE |

本地 `USER.md` 中的内容（代码根目录、Claude 命令习惯、代理等）只有出现在 Hermes 对话里时，才会经 capture 进入云端共享池。

### 4.2 数据流

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Hermes    │  │   Cursor    │  │    Codex    │  │ Claude Code │
│  (微信 Gateway)│  │             │  │             │  │             │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       └────────────────┴────────────────┴────────────────┘
                                │
                    HiveMind Hooks（各工具 bundle）
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        session-start      capture.js      session-end
        （注入记忆）        （捕获对话）      （归档 + graph）
              │                 │                 │
              └─────────────────┴─────────────────┘
                                │
                                ▼
                    Deeplake API（Org + Workspace）
```

---

## 5. 各工具 Hooks 配置

### 5.1 Hermes（`~/.hermes/config.yaml`）

| Hook | 脚本 | 作用 |
|------|------|------|
| `on_session_start` | `session-start.js` | 新对话开始时拉取相关记忆 |
| `pre_tool_call` | `pre-tool-use.js` | 终端命令前处理 |
| `pre_llm_call` | `capture.js` | LLM 调用前捕获 |
| `post_tool_call` | `capture.js` | 工具调用后捕获 |
| `post_llm_call` | `capture.js` | LLM 响应后捕获 |
| `on_session_end` | `session-end.js` + `graph-on-stop.js` | 会话结束归档 |

MCP 服务：`~/.hivemind/mcp/server.js`（可在 session 内主动搜索记忆）

Hermes 内置 memory（`memory.memory_enabled: true`）与 HiveMind 并行运行，互不替代。

### 5.2 Cursor（`~/.cursor/hooks.json`）

- `sessionStart` → session-start
- `beforeSubmitPrompt` / `postToolUse` / `afterAgentResponse` → capture
- `preToolUse`（Shell）→ pre-tool-use
- `stop` → stop + graph-on-stop

Bundle 路径：`~/.cursor/hivemind/bundle/`

### 5.3 Codex（`~/.codex/hooks.json`）

- `SessionStart` → session-start
- `UserPromptSubmit` / `PostToolUse` → capture
- `PreToolUse`（Bash）→ pre-tool-use
- `Stop` → stop + graph-on-stop

Bundle 路径：`~/.codex/hivemind/bundle/`

### 5.4 Claude Code

- 插件：`hivemind@hivemind`（`~/.claude/settings.json` 中 `enabled: true`）
- 冲突插件：`claude-mem@thedotmack` 已 **禁用**（避免与 HiveMind 重复 capture）
- Hooks 由插件提供：`~/.claude/plugins/cache/hivemind/hivemind/*/hooks/hooks.json`

---

## 6. 常用命令

```bash
# 查看接入状态
hivemind status

# 重新登录（凭证过期时）
hivemind login

# 仅给指定工具重装 HiveMind
hivemind install --only hermes,cursor,codex,claude

# 卸载
hivemind uninstall --only <platforms>
```

---

## 7. 跨工具记忆自测

1. 在 **Cursor** 新开对话，发送一句独特信息，例如：  
   `记住：我的测试暗号是 purple-elephant-2026`
2. 正常结束 session（关闭对话或等待 stop hook 执行）
3. 在 **Hermes 微信** 新开对话，询问：  
   `我的测试暗号是什么？`
4. 若 Hermes.to