# AI Tech Lab UI 改造实施计划

> **供 Agent 执行：** 必须使用 `superpowers:executing-plans` 按任务顺序实施。每个步骤使用复选框追踪。

**目标：** 将 AI Tech Lab 的共用框架和应用广场统一改造为克制的暗色技术工作台，同时保持现有路由和业务行为。

**架构：** 使用 `src/theme/` 集中定义项目设计令牌和 Ant Design 主题，以 `ConfigProvider` 作为唯一主题入口。`MainLayout` 和 `AppHub` 保留行为逻辑，将视觉样式分别迁移到独立 CSS；应用筛选逻辑抽成纯函数，以便自动测试。

**技术栈：** React 18、TypeScript 5.6、Vite 5、Ant Design 6.2、React Router 6、Vitest、Testing Library。

## 全局约束

- 保留现有全部路由、功能、中文文案和交互行为。
- 不增加仅用于运行时样式的新依赖。
- 不使用 Linear 或 VoltAgent 的品牌素材和专有字体。
- 主要强调色固定为 `#00C98D`。
- 桌面、平板和移动端分别验证 1440×1024、1024×768、390×844。
- 390px 宽度下不得出现横向滚动。
- 必须支持键盘焦点和 `prefers-reduced-motion`。

---

### 任务 1：建立主题令牌与自动测试基础

**文件：**

- 新建：`apps/ai/src/theme/tokens.ts`
- 新建：`apps/ai/src/theme/antdTheme.ts`
- 新建：`apps/ai/src/theme/theme.test.ts`
- 新建：`apps/ai/src/test/setup.ts`
- 修改：`apps/ai/package.json`
- 修改：`apps/ai/vite.config.ts`
- 修改：`apps/ai/src/main.tsx`
- 修改：`apps/ai/src/index.css`
- 新建：`apps/ai/DESIGN.md`

**接口：**

- 产出：`aiTokens` 常量和 `AiTokenName` 类型。
- 产出：`aiTheme: ThemeConfig`。
- 后续任务通过 CSS 变量和 `aiTheme` 使用统一设计系统。

- [ ] **步骤 1：加入测试依赖和脚本**

在 `devDependencies` 加入与当前 Vite 5 兼容的 `vitest`、`jsdom`、`@testing-library/react`、`@testing-library/jest-dom`、`@testing-library/user-event`，新增：

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **步骤 2：配置 Vitest**

在 `vite.config.ts` 使用 `defineConfig` 的测试配置，设置：

```ts
test: {
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
  css: true,
}
```

`setup.ts` 导入 `@testing-library/jest-dom/vitest`。

- [ ] **步骤 3：先写失败的主题测试**

`theme.test.ts` 必须断言：

```ts
expect(aiTokens.primary).toBe('#00C98D')
expect(aiTokens.canvas).toBe('#07090D')
expect(aiTheme.token?.colorPrimary).toBe(aiTokens.primary)
expect(aiTheme.token?.colorBgBase).toBe(aiTokens.canvas)
expect(aiTheme.token?.borderRadius).toBe(8)
expect(aiTheme.components?.Menu).toBeDefined()
expect(aiTheme.components?.Table).toBeDefined()
```

- [ ] **步骤 4：运行单测并确认因模块不存在而失败**

运行：

```bash
pnpm --dir apps/ai test -- src/theme/theme.test.ts
```

预期：失败，错误明确指向 `tokens` 或 `antdTheme` 模块不存在。

- [ ] **步骤 5：实现最小主题令牌和 Ant Design 映射**

`tokens.ts` 导出规格中的全部语义颜色、间距、圆角和字体栈。`antdTheme.ts` 使用 Ant Design 当前的暗色算法和 `ThemeConfig`，映射全局令牌并覆盖 `Layout`、`Menu`、`Tabs`、`Button`、`Input`、`Card`、`Tag`、`Modal`、`Table`、`Tooltip`。

- [ ] **步骤 6：接入主题和全局 CSS**

`main.tsx` 将 `aiTheme` 传给 `ConfigProvider`。`index.css` 定义对应 CSS 变量，移除旧 `--ds-*` 主题值并保留 Markdown、滚动条和功能页必要规则。

- [ ] **步骤 7：写入项目 `DESIGN.md`**

把已批准规格中的颜色、字体、间距、组件和响应式规则整理为 Agent 可直接消费的项目设计规范。

- [ ] **步骤 8：运行主题测试和构建**

运行：

```bash
pnpm --dir apps/ai test -- src/theme/theme.test.ts
pnpm --dir apps/ai build
```

预期：测试通过，TypeScript 和 Vite 构建成功。

- [ ] **步骤 9：提交**

```bash
git add apps/ai/package.json apps/ai/vite.config.ts apps/ai/src/test apps/ai/src/theme apps/ai/src/main.tsx apps/ai/src/index.css apps/ai/DESIGN.md pnpm-lock.yaml
git commit -m "feat(ai): add unified dark design system"
```

### 任务 2：改造共用应用框架

**文件：**

- 新建：`apps/ai/src/layouts/MainLayout.css`
- 新建：`apps/ai/src/layouts/MainLayout.test.tsx`
- 修改：`apps/ai/src/layouts/MainLayout.tsx`

**接口：**

- 保持默认导出 `MainLayout()`。
- 继续通过 `Outlet` 渲染路由内容。
- 保持 `/hub`、`/skills/*` 和 `/portal` 的现有导航语义。

- [ ] **步骤 1：先写失败的布局测试**

使用 `MemoryRouter` 和测试路由断言：

```ts
expect(screen.getByText('AI Tech Lab')).toBeVisible()
expect(screen.getByRole('tab', { name: '技能中心' })).toHaveAttribute('aria-selected', 'true')
expect(screen.getByRole('navigation', { name: '技能导航' })).toBeVisible()
```

另一个 `/hub` 用例断言 `体验中心` 选中和 `应用广场` 当前项。

- [ ] **步骤 2：运行测试并确认语义断言失败**

运行：

```bash
pnpm --dir apps/ai test -- src/layouts/MainLayout.test.tsx
```

预期：因缺少规范化 tab/navigation 语义或新类名而失败。

- [ ] **步骤 3：重构框架结构**

保留路由判断和菜单数据，替换大量内联样式：

- 56px 暗色顶栏；
- 216px 桌面侧边栏；
- 翠绿色当前标签指示；
- 语义化导航标签；
- 小于 768px 使用 Ant Design `Drawer`；
- 图标按钮包含 `aria-label="打开技能导航"`。

- [ ] **步骤 4：实现响应式 CSS**

`MainLayout.css` 必须包含 1100px 和 768px 断点、可见 `:focus-visible`、暗色菜单状态、移动端内容内边距和 reduced-motion 规则。

- [ ] **步骤 5：运行测试和构建**

```bash
pnpm --dir apps/ai test -- src/layouts/MainLayout.test.tsx
pnpm --dir apps/ai build
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add apps/ai/src/layouts
git commit -m "feat(ai): redesign shared application shell"
```

### 任务 3：改造应用广场

**文件：**

- 新建：`apps/ai/src/pages/AppHub.css`
- 新建：`apps/ai/src/pages/AppHub.test.tsx`
- 修改：`apps/ai/src/pages/AppHub.tsx`

**接口：**

- 产出：`filterApps(apps, category, searchText)` 纯函数。
- 保持默认导出 `AppHub()`。
- 保持现有应用数据、分类、状态和路由目标。

- [ ] **步骤 1：先写失败的筛选和交互测试**

覆盖以下行为：

```ts
expect(filterApps(apps, '全部', 'GitHub')).toHaveLength(1)
expect(filterApps(apps, '知识处理', '')).toEqual(
  expect.arrayContaining([expect.objectContaining({ title: 'Chat with GitHub' })]),
)
```

渲染测试断言搜索后只显示匹配卡片、分类按钮具有 `aria-pressed`、空结果显示 `没有找到匹配的应用`。

- [ ] **步骤 2：运行测试并确认失败**

```bash
pnpm --dir apps/ai test -- src/pages/AppHub.test.tsx
```

预期：`filterApps` 尚未导出，或新可访问语义尚不存在。

- [ ] **步骤 3：移除粒子与 3D 卡片逻辑**

删除 `useParticleBackground`、Three.js 动态导入、卡片倾斜状态和 Canvas。保留普通卡片点击与按钮点击导航。

- [ ] **步骤 4：实现克制的应用广场结构**

应用广场包含：

- 双栏标题和在线/总数统计；
- 40px 搜索框；
- 带 `aria-pressed` 的分类筛选；
- 三/二/一列响应式卡片；
- 图标、状态、标题、描述、标签和启动提示；
- Ant Design `Empty` 空状态。

- [ ] **步骤 5：实现应用广场 CSS**

所有主题颜色引用 `--ai-*` 变量。卡片只允许 2px 以内上移，不使用渐变、光晕、3D 或厚阴影。

- [ ] **步骤 6：运行测试和构建**

```bash
pnpm --dir apps/ai test -- src/pages/AppHub.test.tsx
pnpm --dir apps/ai build
```

预期：全部通过，构建中 AppHub 不再动态加载 Three.js。

- [ ] **步骤 7：提交**

```bash
git add apps/ai/src/pages/AppHub.tsx apps/ai/src/pages/AppHub.css apps/ai/src/pages/AppHub.test.tsx
git commit -m "feat(ai): redesign application hub"
```

### 任务 4：全量验证与视觉检查

**文件：**

- 仅在发现问题时修改任务 1–3 涉及的文件。

**接口：**

- 不产生新产品接口。
- 验证设计规格的最终验收条件。

- [ ] **步骤 1：运行完整自动验证**

```bash
pnpm --dir apps/ai test
pnpm --dir apps/ai build
```

预期：测试和构建均成功，输出无错误。

- [ ] **步骤 2：启动本地预览**

```bash
pnpm --dir apps/ai dev --host 127.0.0.1
```

确认服务在 25 秒内启动，否则立即停止并报告。

- [ ] **步骤 3：桌面视觉检查**

在 1440×1024 检查 `/ai/hub` 和 `/ai/skills/vector-db`：导航选中、卡片三列、颜色层级、键盘焦点和滚动行为正确。

- [ ] **步骤 4：平板和移动端视觉检查**

在 1024×768 验证两列卡片；在 390×844 验证抽屉、单列卡片、全宽搜索和无横向滚动。

- [ ] **步骤 5：减少动态效果检查**

模拟 `prefers-reduced-motion: reduce`，确认不存在粒子、倾斜和装饰性入场动效。

- [ ] **步骤 6：最终状态检查**

```bash
git status --short
git log -5 --oneline
```

确认没有纳入用户现有的 `.agents/` 未跟踪目录，所有改造提交范围正确。

### 任务 5：建立全功能页共用样式层

**文件：**

- 新建：`apps/ai/src/styles/feature-pages.css`
- 新建：`apps/ai/src/styles/feature-pages.test.ts`
- 修改：`apps/ai/src/main.tsx`
- 修改：`apps/ai/src/index.css`

**接口：**

- 产出页面类：`.ai-page`、`.ai-page-header`、`.ai-panel`、`.ai-chat-shell`、`.ai-chat-messages`、`.ai-chat-composer`、`.ai-result-panel`。
- 产出覆盖范围：Ant Design Card、Table、Form、Input、Select、Tabs、Modal、Drawer、Upload、Empty 和 Alert。

- [ ] **步骤 1：先写失败的共用样式契约测试**

读取 `feature-pages.css`，断言其中包含全部共用页面类、`var(--ai-canvas)`、`var(--ai-surface-2)`、`:focus-visible` 和 `prefers-reduced-motion`。

- [ ] **步骤 2：运行测试并确认文件不存在而失败**

```bash
pnpm --dir apps/ai test -- src/styles/feature-pages.test.ts
```

- [ ] **步骤 3：实现共用样式并在入口加载**

样式必须只使用 `--ai-*` 令牌，不使用页面专属颜色，不通过全局 `!important` 强制覆盖业务状态。

- [ ] **步骤 4：运行测试和构建并提交**

```bash
pnpm --dir apps/ai test -- src/styles/feature-pages.test.ts
pnpm --dir apps/ai build
git add apps/ai/src/styles apps/ai/src/main.tsx apps/ai/src/index.css
git commit -m "feat(ai): add shared feature page styling"
```

### 任务 6：统一技能基础页

**文件：**

- 修改：`apps/ai/src/pages/VectorDb.tsx`
- 修改：`apps/ai/src/pages/KnowledgeBase.tsx`
- 修改：`apps/ai/src/pages/KnowledgeBaseNew.tsx`
- 修改：`apps/ai/src/pages/RAG.tsx`
- 修改：`apps/ai/src/pages/Text2SQL.tsx`
- 修改：`apps/ai/src/pages/LangChain.tsx`
- 修改：`apps/ai/src/pages/FunctionCall.tsx`
- 修改：`apps/ai/src/pages/MCP/index.tsx`
- 修改：`apps/ai/src/pages/A2A.tsx`
- 修改：`apps/ai/src/pages/Agent.tsx`
- 修改：`apps/ai/src/pages/FineTuning.tsx`

- [ ] **步骤 1：记录本批页面的硬编码颜色基线**

运行图搜索，确认白底、旧蓝色和浅灰色命中数，并保存文件清单。

- [ ] **步骤 2：应用共用页面类和令牌**

仅修改容器、标题、Card、Table、Form、Tabs、空状态和操作区样式；不改变请求、状态管理和路由。

- [ ] **步骤 3：验证命中数下降、测试和构建通过**

```bash
pnpm --dir apps/ai test
pnpm --dir apps/ai build
```

- [ ] **步骤 4：提交**

```bash
git add apps/ai/src/pages
git commit -m "feat(ai): unify skill feature pages"
```

### 任务 7：统一聊天与 Agent 页面

**文件：**

- 修改：`apps/ai/src/pages/Chat.tsx`
- 修改：`apps/ai/src/pages/GitHubChat.tsx`
- 修改：`apps/ai/src/pages/YouTubeChat.tsx`
- 修改：`apps/ai/src/pages/ArxivChat.tsx`
- 修改：`apps/ai/src/pages/PDFChat.tsx`
- 修改：`apps/ai/src/pages/MemoryChat.tsx`
- 修改：`apps/ai/src/pages/DoctorAgent.tsx`
- 修改：`apps/ai/src/pages/FinanceCoach.tsx`
- 修改：`apps/ai/src/pages/TravelPlanner.tsx`
- 修改：`apps/ai/src/pages/RecipePlanner.tsx`
- 修改：`apps/ai/src/pages/MentalWellbeing.tsx`
- 修改：`apps/ai/src/pages/ReasoningAgent.tsx`
- 修改：`apps/ai/src/pages/MixtureAgents.tsx`

- [ ] **步骤 1：应用聊天共用类**

统一消息区、用户/助手气泡、输入区、发送按钮、工具结果、警告和加载状态；保留消息结构与流式逻辑。

- [ ] **步骤 2：逐页清理白底和旧蓝色硬编码**

医疗、财务和心理警告继续使用语义 warning/error 色，并保留文字说明。

- [ ] **步骤 3：运行测试和构建并提交**

```bash
pnpm --dir apps/ai test
pnpm --dir apps/ai build
git add apps/ai/src/pages
git commit -m "feat(ai): unify chat and agent pages"
```

### 任务 8：统一数据、知识与多媒体页面

**文件：**

- 修改：`apps/ai/src/pages/Data.tsx`、`DataAnalysis.tsx`、`DataVisualization.tsx`
- 修改：`apps/ai/src/pages/ResumeMatcher.tsx`、`WebScraper.tsx`、`NewsAgent.tsx`、`StartupTrend.tsx`
- 修改：`apps/ai/src/pages/ImageGenerate.tsx`、`OCR.tsx`、`STT.tsx`、`TTS.tsx`
- 修改：`apps/ai/src/pages/SpeechTrainer.tsx`、`BlogPodcast.tsx`、`MusicGenerator.tsx`、`VideoUnderstand.tsx`
- 修改：`apps/ai/src/pages/ChessGame.tsx`、`NegotiationSimulator.tsx`、`TarotReading.tsx`、`GmailAssistant.tsx`
- 修改：`apps/ai/src/pages/MCP/*.tsx` 和相关 CSS

- [ ] **步骤 1：统一数据与结果容器**

表格、图表外围、上传区、结果面板和空状态使用共用令牌；图表、地图、棋盘和 3D 图谱内部语义色保持不变。

- [ ] **步骤 2：清理剩余非语义硬编码颜色**

每个保留的特殊颜色必须对应数据、警告、地图、棋盘或媒体内容语义。

- [ ] **步骤 3：运行测试和构建并提交**

```bash
pnpm --dir apps/ai test
pnpm --dir apps/ai build
git add apps/ai/src/pages
git commit -m "feat(ai): unify data and media pages"
```

### 任务 9：全路由视觉回归

**文件：**

- 仅在发现问题时修改任务 5–8 的文件。

- [ ] **步骤 1：运行完整测试和构建**

```bash
pnpm --dir apps/ai test
pnpm --dir apps/ai build
```

- [ ] **步骤 2：浏览所有路由并记录运行时错误**

所有现有路由必须成功渲染；不得出现空白页、未捕获异常或横向溢出。

- [ ] **步骤 3：按四批各检查一个代表页面**

桌面和移动端分别检查 VectorDB、GitHubChat、DataAnalysis、SpeechTrainer，并补查应用广场。

- [ ] **步骤 4：复查硬编码颜色**

确认白底、旧蓝色和浅灰色命中已删除，或位于明确允许的专用画布/语义内容中。

- [ ] **步骤 5：提交最终修正和构建产物**

```bash
git add apps/ai/src apps/ai/dist
git commit -m "fix(ai): complete full UI visual regression"
```
