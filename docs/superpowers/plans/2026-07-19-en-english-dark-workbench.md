# EN English Dark Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `apps/en` 的 `/english` 改造为与 `apps/ai` 同系的暗色翠绿学习工作台，同时保持六个模块的现有业务行为。

**Architecture:** 在 `apps/en/src/theme/` 建立独立主题令牌和 Ant Design 5 主题入口；保留现有 `ProLayout` 和六个业务模块，由 `English` 组件提供左侧导航和专属工作台壳层。全局主题负责 Ant Design/Pro Components，`.en-workbench` 负责 `/english` 的布局隔离，商城和其他路由不接入该类名。

**Tech Stack:** React 18、TypeScript 5、Vite 4、Ant Design 5.17、Ant Design Pro Components 2.6、Emotion、React Router 6、Vitest、Testing Library。

## Global Constraints

- 仅改造 `/en/english`，不改 `/store`、BusinessData 或独立后台路由。
- 保留现有接口、权限、表格字段、编辑弹窗和默认模块行为。
- 主强调色固定为 `#00C98D`，主画布固定为 `#07090D`。
- 不增加运行时视觉依赖，不升级现有框架版本。
- 390px 宽度下整页不得横向溢出；侧栏使用 Drawer，宽表格可在自身容器滚动。
- 必须支持 `:focus-visible` 和 `prefers-reduced-motion`。

---

### Task 1: EN Theme Foundation

**Files:**

- Create: `apps/en/src/theme/tokens.ts`
- Create: `apps/en/src/theme/antdTheme.ts`
- Create: `apps/en/src/theme/theme.test.ts`
- Create: `apps/en/src/test/setup.ts`
- Modify: `apps/en/package.json`
- Modify: `apps/en/vite.config.ts`
- Modify: `apps/en/src/App.tsx`
- Modify: `apps/en/src/index.css`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Produces: `enTokens` semantic token object.
- Produces: `enTheme: ThemeConfig`.
- Consumes: existing `ConfigProvider` in `App.tsx`.

- [ ] **Step 1: Add the minimal test toolchain**

Add dev dependencies matching the monorepo's existing AI test versions:

```json
"@testing-library/jest-dom": "^6.9.1",
"@testing-library/react": "^16.3.1",
"jsdom": "^25.0.1",
"vitest": "^2.1.9"
```

Add scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Configure Vitest**

Extend `vite.config.ts` with:

```ts
test: {
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
  css: true,
}
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Write the failing theme contract**

Create `theme.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { enTokens } from './tokens'
import { enTheme } from './antdTheme'

describe('EN dark workbench theme', () => {
  it('uses the approved AI-family dark tokens', () => {
    expect(enTokens.primary).toBe('#00C98D')
    expect(enTokens.canvas).toBe('#07090D')
    expect(enTheme.token?.colorPrimary).toBe(enTokens.primary)
    expect(enTheme.token?.colorBgBase).toBe(enTokens.canvas)
    expect(enTheme.components?.Table).toBeDefined()
    expect(enTheme.components?.Tabs).toBeDefined()
  })
})
```

- [ ] **Step 4: Verify RED**

Run:

```bash
pnpm --dir apps/en test -- src/theme/theme.test.ts
```

Expected: FAIL because `tokens.ts` and `antdTheme.ts` do not exist.

- [ ] **Step 5: Implement tokens and Ant Design mapping**

`tokens.ts` exports colors, 8px radius, spacing and font stack. `antdTheme.ts` uses `theme.darkAlgorithm` and maps `Layout`, `Menu`, `Tabs`, `Table`, `Card`, `Input`, `Select`, `Button`, `Modal`, `Drawer`, `Pagination` and `Tag`.

- [ ] **Step 6: Wire the single theme entry**

Change:

```tsx
<ConfigProvider theme={enTheme}>
  <RouterProvider router={router} />
</ConfigProvider>
```

Add matching `--en-*` CSS variables, body canvas, focus styles and reduced-motion rules to `index.css`.

- [ ] **Step 7: Verify GREEN**

Run:

```bash
pnpm --dir apps/en test -- src/theme/theme.test.ts
pnpm --dir apps/en build
```

Expected: theme test and build pass.

- [ ] **Step 8: Commit**

```bash
git add apps/en/package.json apps/en/vite.config.ts apps/en/src/theme apps/en/src/test apps/en/src/App.tsx apps/en/src/index.css pnpm-lock.yaml
git commit -m "feat(en): add dark workbench theme"
```

### Task 2: `/english` Workbench Shell

**Files:**

- Create: `apps/en/src/pages/English/English.css`
- Create: `apps/en/src/pages/English/English.test.tsx`
- Modify: `apps/en/src/pages/English/index.tsx`
- Modify: `apps/en/src/pages/Root/index.tsx`

**Interfaces:**

- Keeps: default export `English()`.
- Keeps: six existing module children.
- Produces: default module `用户` and order `用户、单词、词库、词根、词缀、日常用语`.
- Produces: `.en-workbench` isolated root class.

- [ ] **Step 1: Write the failing page structure test**

Mock the six heavy child modules and render `English`:

```tsx
expect(screen.getByText('英语学习中心')).toBeVisible()
expect(screen.getByText('ENGLISH WORKBENCH')).toBeVisible()
for (const label of ['用户', '单词', '词库', '词根', '词缀', '日常用语']) {
  expect(screen.getByRole('button', { name: label })).toBeVisible()
}
expect(screen.getByRole('button', { name: '用户' })).toHaveAttribute('aria-current', 'page')
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --dir apps/en test -- src/pages/English/English.test.tsx
```

Expected: FAIL because the workbench header and sidebar navigation do not exist.

- [ ] **Step 3: Implement the workbench structure**

Replace the Tabs shell with local active-module state and semantic navigation:

```tsx
<section className="en-workbench">
  <header className="en-workbench-header">
    <div>
      <div className="en-workbench-eyebrow">ENGLISH WORKBENCH</div>
      <h1>英语学习中心</h1>
      <p>管理单词、词库、词根词缀和生活口语内容</p>
    </div>
    <span className="en-workbench-status">CONTENT LAB</span>
  </header>
  <div className="en-workbench-body">
    <aside className="en-workbench-sidebar" aria-label="英语学习模块">
      {items.map(item => (
        <button aria-current={activeKey === item.key ? 'page' : undefined}>
          {item.label}
        </button>
      ))}
    </aside>
    <main className="en-workbench-panel">
      {items.find(item => item.key === activeKey)?.children}
    </main>
  </div>
</section>
```

Set the item order to `用户、单词、词库、词根、词缀、日常用语` and initialize `activeKey` with the user item. Add an Ant Design `Drawer` containing the same navigation for screens below 768px.

- [ ] **Step 4: Implement scoped responsive CSS**

CSS must include:

```css
.en-workbench { background: var(--en-canvas); }
.en-workbench-sidebar { background: var(--en-surface-1); }
.en-workbench-panel { background: var(--en-surface-2); }
.en-workbench :focus-visible { outline: 2px solid var(--en-primary); }
@media (max-width: 768px) { /* hide fixed sidebar and show Drawer trigger */ }
@media (max-width: 480px) { /* 390px safe padding */ }
@media (prefers-reduced-motion: reduce) { /* disable transitions */ }
```

Give `Root` a stable EN application class without changing its routing or actions.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
pnpm --dir apps/en test -- src/pages/English/English.test.tsx
pnpm --dir apps/en build
```

Expected: test and build pass.

- [ ] **Step 6: Commit**

```bash
git add apps/en/src/pages/English apps/en/src/pages/Root/index.tsx
git commit -m "feat(en): redesign English workbench shell"
```

### Task 3: Darken the Six Existing Modules

**Files:**

- Modify: `apps/en/src/pages/English/Root/index.tsx`
- Modify: `apps/en/src/pages/English/Root/AddEdit.tsx`
- Modify: `apps/en/src/pages/English/Affix/index.tsx`
- Modify: `apps/en/src/pages/English/Affix/AddEdit.tsx`
- Modify: `apps/en/src/pages/English/LivingSpeech/index.tsx`
- Modify: `apps/en/src/pages/English/LivingSpeech/AddEdit.tsx`
- Modify: `apps/en/src/pages/EnDesktop/Words/index.tsx`
- Modify: `apps/en/src/pages/EnDesktop/Words/AddEdit.tsx`
- Modify: `apps/en/src/pages/EnDesktop/Libraries/index.tsx`
- Modify: `apps/en/src/pages/EnDesktop/Libraries/AddEdit.tsx`
- Modify: `apps/en/src/pages/EnDesktop/Libraries/LibraryWords.tsx`
- Modify: `apps/en/src/pages/EnDesktop/Users/index.tsx`
- Modify: `apps/en/src/pages/EnDesktop/Users/AddEdit.tsx`
- Modify: `apps/en/src/pages/EnDesktop/ExampleWords.tsx`
- Modify: `apps/en/src/pages/English/English.test.tsx`

**Interfaces:**

- Keeps all existing request URLs, columns, form names, callbacks and permission guards.
- Consumes `--en-*` tokens from Task 1.

- [ ] **Step 1: Extend the failing static regression test**

Read the listed modules and assert they contain no visual root fallback from this set:

```ts
const lightBackground = /background(?:Color)?:\s*['"]#(?:fff(?:fff)?|fafafa|f5f5f5|f0f2f5)['"]/i
expect(offenders).toEqual([])
```

Also assert `English.css` scopes ProTable, Form, Modal and Drawer dark surfaces beneath `.en-workbench` or `.en-app`.

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --dir apps/en test -- src/pages/English/English.test.tsx
```

Expected: FAIL listing existing light visual declarations or missing scoped component rules.

- [ ] **Step 3: Apply the minimal visual cleanup**

Replace only visual hard-coding:

- light surfaces → `var(--en-surface-1/2/3)`
- light borders → `var(--en-border)`
- dark text intended for light backgrounds → `var(--en-text)` or `var(--en-text-secondary)`
- blue primary links → `var(--en-primary)`

Do not change request calls, table columns, form field names, handlers or permission checks.

- [ ] **Step 4: Add scoped component rules**

Within `.en-workbench`/`.en-app`, style ProTable toolbar, table header/body, pagination, Card, Form, Input, Select, Drawer and Modal. Keep `/store` unaffected by avoiding unscoped layout rules.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
pnpm --dir apps/en test
pnpm --dir apps/en build
git diff --check
```

Expected: all tests and build pass; no whitespace errors.

- [ ] **Step 6: Commit**

```bash
git add apps/en/src/pages/English apps/en/src/pages/EnDesktop
git commit -m "feat(en): unify English module dark surfaces"
```

### Task 4: Visual QA, Production Assets and Deploy

**Files:**

- Modify: `apps/en/dist/**`

**Interfaces:**

- Consumes the completed `/en/english` implementation.
- Produces tracked production assets and a deployed `main`.

- [ ] **Step 1: Run final verification**

```bash
pnpm --dir apps/en test
pnpm --dir apps/en build
git diff --check
```

Expected: zero test failures and build exit code 0.

- [ ] **Step 2: Check representative views**

At 1440×1024, 1024×768 and 390×844 inspect:

- 单词管理
- 词库管理
- 词根或词缀管理
- one existing add/edit modal or drawer

Verify no overall horizontal scrolling, no white workbench surfaces, readable text and visible focus states.

- [ ] **Step 3: Commit production assets**

```bash
git add apps/en/dist
git commit -m "build(en): refresh English production assets"
```

Skip the commit if the tracked assets are already identical.

- [ ] **Step 4: Push and deploy**

```bash
git push origin main
./deploy/deploy.sh
```

The deploy script must build locally, push any generated dist commit, SSH to the server, fast-forward the repository and pass `nginx -t` before reload.

- [ ] **Step 5: Verify production**

```bash
curl --fail --location --max-time 10 https://doctor-dog.com/en/english
```

Expected: HTTP 200 and HTML references the newly built EN asset hashes.
