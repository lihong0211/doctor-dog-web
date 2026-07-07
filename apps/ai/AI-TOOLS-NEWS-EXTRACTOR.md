# DeepSeek vs Claude：今日头条抓取能力说明

> 更新时间：2026-06-10  
> 适用环境：lihong 本机（Claude Code / Cursor / Codex / Hermes Gateway）

---

## 结论（一句话）

**DeepSeek 说的是「世界上存在这个工具」；Claude（Hermes）说的是「你这台机器上没装」。两边都对，不矛盾。**

| 来源 | 说法 | 准确性 |
|------|------|--------|
| DeepSeek | 存在第三方 `news-extractor` 技能，支持今日头条 | ✅ 属实（GitHub 开源项目） |
| Claude / Hermes | 当前环境技能列表里没有 `news-extractor` | ✅ 属实（本机未安装） |

DeepSeek 基于网络检索，容易把「别人仓库里有的技能」说成「你本地已经能用」。  
Hermes 微信 Gateway 只能调用**已安装、已注册**的技能，所以它会如实说「没有」。

---

## `news-extractor` 是什么

- **性质**：第三方 Claude Code Skill，**非 Anthropic 官方**
- **仓库**：[NanmiCoder/claude-code-skills](https://github.com/NanmiCoder/claude-code-skills)
- **支持平台**：微信公众号、今日头条、网易、搜狐、腾讯新闻
- **输出**：结构化 JSON + Markdown
- **原理**：本地 Python 爬虫（`curl_cffi` 模拟浏览器 + XPath 解析），不是 Claude 内置「读网页」

---

## 本机当前状态（2026-06-10 核查）

### 已安装的相关能力

| 工具 | 新闻提取 | 说明 |
|------|----------|------|
| Claude Code | ❌ 无 news-extractor | 已装 superpowers、frontend-design、hivemind 等 |
| Cursor | ❌ 无 news-extractor | 有 MCP 浏览器、WebFetch，但对头条 JS/登录页不稳定 |
| Codex | ❌ 无 news-extractor | 浏览器抓取头条曾超时 |
| Hermes Gateway | ❌ 无 news-extractor | `web.extract_backend` 为空，无专用头条爬虫 |

### 为什么通用网页工具搞不定头条

1. **JS 渲染**：正文不在首屏 HTML 里
2. **反爬 / 登录**：未登录 Cookie 常被重定向或返回空壳
3. **地区与网络**：需稳定国内网络；代理配置不当会失败
4. **页面结构变化**：通用 extract 工具没有 toutiao 专用解析逻辑

---

## 推荐处理方式（按场景）

### 方案 A：最稳 — 手动粘贴正文

适合：偶尔读一两篇文章、Hermes 微信里快速分析。

```
你复制头条正文 → 粘贴给 Claude / Codex / Hermes → 直接分析
```

Claude 在终端里给的建议（「别换抓取工具，直接贴正文」）对**单次阅读**是最省事的。

---

### 方案 B：安装 `news-extractor`（Claude Code 专用）

适合：经常批量抓中文新闻、要在终端里自动化。

#### 1. 安装 Skill

```bash
# 方式一：skillfish（文档常见）
npx skillfish add nanmicoder/claude-code-skills news-extractor

# 方式二：手动克隆到 Claude skills 目录
git clone https://github.com/NanmiCoder/claude-code-skills.git /tmp/claude-code-skills
cp -r /tmp/claude-code-skills/plugins/news-extractor/skills/news-extractor \
  ~/.claude/skills/news-extractor
```

#### 2. 安装依赖

```bash
cd ~/.claude/skills/news-extractor
uv sync   # 需要已安装 uv；若无：brew install uv
```

#### 3. 提取今日头条

```bash
cd /Users/lihong/Desktop/personal/code   # 或任意工作目录

uv run ~/.claude/skills/news-extractor/scripts/extract_news.py \
  "https://www.toutiao.com/article/7652158591649972776/" \
  --output ./output
```

成功后会生成 `./output/{news_id}.json` 和 `.md`。

#### 4. 在 Claude Code 里使用

新开 Claude Code session，说：

```
用 news-extractor 提取这篇头条文章并总结要点：
https://www.toutiao.com/article/7652158591649972776/
```

Skill 的 `description` 会触发 Claude 自动跑上述脚本。

> ⚠️ 此方案**不会**自动出现在 Hermes 微信 Gateway 的技能列表里，除非单独给 Hermes 配置等价 hook/脚本。

---

### 方案 C：Hermes 里用终端命令（间接）

在 WeChat 里让 Hermes 执行（需 Gateway 允许 Bash）：

```bash
uv run ~/.claude/skills/news-extractor/scripts/extract_news.py "URL" --format markdown
```

前提：先按方案 B 装好 skill 和 `uv`。  
Hermes 本身没有 `news-extractor` 技能名，但可以通过 **terminal 工具** 跑脚本。

---

### 方案 D：Cursor MCP 浏览器（备选）

Cursor 有 `cursor-ide-browser` MCP，可打开头条页面。但：

- 可能需要手动登录头条
- 动态加载慢，容易超时
- 不如专用爬虫稳定

仅作「肉眼确认页面能开」时使用，不建议作为批量方案。

---

## 如何判断「谁说得对」

遇到 DeepSeek / 搜索 vs 本地 AI 说法不一致时：

```
1. 搜索到的工具 → 查 GitHub / 官方文档，确认是否真实存在
2. 本机核查     → claude plugin list、ls ~/.claude/skills、Hermes 技能列表
3. 未安装       → 搜索说的是「可选能力」，本地 AI 说的是「当前状态」
4. 需要再用     → 按文档安装，装完再让 Claude 试
```

**不要**因为 DeepSeek 说有，就认为 Hermes 微信里已经能用。  
**也不要**因为 Hermes 说没有，就认为全网都不存在——只是你还没装。

---

## 关于那篇头条文章（Codex + Superpowers + gstack + 阿里云）

若目标是**读懂文章内容、评估方案是否靠谱**，与安装 news-extractor 无关，任选其一：

1. 浏览器打开 → 复制正文 → 发给任意 AI 分析  
2. 装好 news-extractor → 提取 Markdown → 再分析  
3. 若文章在其他平台有转载（知乎、公众号镜像），有时镜像站更容易抓取

---

## 快速决策树

```
需要读头条文章？
├─ 只读一篇 → 复制粘贴正文（最快）
├─ 经常批量抓 → 安装 news-extractor 到 ~/.claude/skills（Claude Code）
├─ 必须在微信远程 → Hermes 跑 uv run extract_news.py（先装 B）
└─ 想全自动进记忆 → 提取后粘贴给 Cursor/Claude，HiveMind 会 capture 共享
```

---

## 参考链接

- news-extractor Skill 源码：<https://github.com/NanmiCoder/claude-code-skills/tree/main/plugins/news-extractor>
- Playbooks 说明：<https://playbooks.com/skills/nanmicoder/claude-code-skills/news-extractor>
- 本机 Claude 插件：`claude plugin list`
- 本机 Hermes 配置：`~/.hermes/config.yaml`
