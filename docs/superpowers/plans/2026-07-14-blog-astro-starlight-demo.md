# Blog Astro+Starlight Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up an isolated `apps/blog-astro` app running Astro + Starlight + the `starlight-theme-nova` theme, with one representative doc per existing blog section (ALGORITHM/AI/BACKEND), so the visual direction can be judged before deciding on a full migration.

**Architecture:** New pnpm workspace member `apps/blog-astro` (no root config changes — already covered by the `apps/*` glob in `pnpm-workspace.yaml`). Astro's `@astrojs/starlight` integration provides the docs framework; `starlight-theme-nova` is registered as a Starlight plugin for the visual theme; Tailwind CSS v4 is wired in per Nova's documented setup. Content lives in Starlight's standard `src/content/docs/` collection, validated by `docsSchema`.

**Tech Stack:** Astro (latest, `astro` package), `@astrojs/starlight` (latest, currently 0.41.x), `starlight-theme-nova` (latest), `tailwindcss` + `@tailwindcss/vite` (latest, v4).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-14-blog-astro-starlight-demo-design.md`
- Do not modify `apps/blog` in any way.
- Do not modify `deploy/nginx/nginx.conf` or any other deployment config.
- Do not wire `apps/blog-astro` into the root `README.md`.
- No custom components (`HlsVideo`, `InsightSection`), no leetcode injection script, no search, no custom CSS variable overrides beyond Nova's defaults — all explicitly out of scope for this spike.
- Default locale is `zh-CN`.

---

### Task 1: Scaffold `apps/blog-astro` and install dependencies

**Files:**
- Create: `apps/blog-astro/package.json`
- Create: `apps/blog-astro/tsconfig.json`

**Interfaces:**
- Produces: a pnpm workspace member named `blog-astro`, runnable via `pnpm --filter blog-astro <script>`, with `astro`, `@astrojs/starlight`, `starlight-theme-nova`, `tailwindcss`, `@tailwindcss/vite` installed as devDependencies (matching the existing `apps/blog` convention of putting the site generator/framework in devDependencies).

- [ ] **Step 1: Create the directory and a minimal package.json**

Create `apps/blog-astro/package.json`:

```json
{
  "name": "blog-astro",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 2: Install dependencies via pnpm workspace filter**

Run:

```bash
pnpm --filter blog-astro add -D astro @astrojs/starlight starlight-theme-nova tailwindcss @tailwindcss/vite
```

Expected: pnpm resolves and installs all five packages into `apps/blog-astro/node_modules` (hoisted via the workspace root), and `apps/blog-astro/package.json`'s `devDependencies` field is populated automatically. `pnpm-lock.yaml` at the repo root is updated.

- [ ] **Step 3: Add scripts to package.json**

Edit `apps/blog-astro/package.json` to add a `scripts` block:

```json
{
  "name": "blog-astro",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "sync": "astro sync"
  },
  "devDependencies": {
    "...": "left as populated by Step 2 — do not hand-edit versions"
  }
}
```

(Keep whatever exact devDependency versions pnpm wrote in Step 2 — only add the `scripts` key.)

- [ ] **Step 4: Add tsconfig.json**

Create `apps/blog-astro/tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

- [ ] **Step 5: Verify the toolchain is installed and runnable**

Run: `pnpm --filter blog-astro exec astro --version`
Expected: prints a version string (e.g. `astro  6.x.x`) with no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/blog-astro/package.json apps/blog-astro/tsconfig.json pnpm-lock.yaml
git commit -m "chore(blog-astro): scaffold Astro+Starlight app"
```

---

### Task 2: Configure Astro, Starlight, Nova theme, and Tailwind

**Files:**
- Create: `apps/blog-astro/astro.config.mjs`
- Create: `apps/blog-astro/src/content.config.ts`
- Create: `apps/blog-astro/src/styles/global.css`
- Create: `apps/blog-astro/src/content/docs/` (empty directory, populated in Task 3)

**Interfaces:**
- Consumes: the `blog-astro` package scaffolded in Task 1 (`pnpm --filter blog-astro exec <cmd>` must already work).
- Produces: a Starlight `docs` content collection (importable as `astro:content` collection `docs`) with sidebar groups `🧩 ALGORITHM` → `/algorithm/`, `🧠 AI` → `/ai/`, `⚙️ BACKEND` → `/backend/`. Task 3 fills these routes with real content.

- [ ] **Step 1: Create the content collection config**

Create `apps/blog-astro/src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
```

- [ ] **Step 2: Create the Tailwind entry CSS**

Create `apps/blog-astro/src/styles/global.css`:

```css
@import 'tailwindcss';
@import 'starlight-theme-nova/tailwind.css';
```

- [ ] **Step 3: Create the empty content directory**

```bash
mkdir -p apps/blog-astro/src/content/docs
```

(No file needed yet — this just ensures the glob loader has a base directory to read in Step 5. Task 3 adds the actual `.md` files here.)

- [ ] **Step 4: Create the Astro config**

Create `apps/blog-astro/astro.config.mjs`:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeNova from 'starlight-theme-nova';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    starlight({
      title: '技术文档',
      description: '技术学习文档集合',
      defaultLocale: 'zh-CN',
      customCss: ['./src/styles/global.css'],
      plugins: [starlightThemeNova()],
      sidebar: [
        {
          label: '🧩 ALGORITHM',
          items: [{ label: 'LeetCode 题解', link: '/algorithm/' }],
        },
        {
          label: '🧠 AI',
          items: [{ label: 'Home 项目文档', link: '/ai/' }],
        },
        {
          label: '⚙️ BACKEND',
          items: [{ label: 'ACID', link: '/backend/' }],
        },
      ],
    }),
  ],
});
```

- [ ] **Step 5: Verify the config and content collection are valid**

Run: `pnpm --filter blog-astro sync`
Expected: completes without error and prints something like `Types generated` (generates `.astro/types.d.ts`). It's fine that the `docs` collection is empty at this point — the sidebar linking to not-yet-existing pages does not fail `astro sync` (only `astro build`, tackled in Task 3, requires the pages to exist).

- [ ] **Step 6: Commit**

```bash
git add apps/blog-astro/astro.config.mjs apps/blog-astro/src/content.config.ts apps/blog-astro/src/styles/global.css
git commit -m "feat(blog-astro): configure Starlight + Nova theme + Tailwind"
```

Note: the empty `src/content/docs/` directory from Step 3 won't be tracked by git until Task 3 adds files into it — that's expected, nothing to commit for it here.

---

### Task 3: Add homepage and three representative content pages

**Files:**
- Create: `apps/blog-astro/src/content/docs/index.md`
- Create: `apps/blog-astro/src/content/docs/algorithm/index.md`
- Create: `apps/blog-astro/src/content/docs/ai/index.md`
- Create: `apps/blog-astro/src/content/docs/backend/index.md`

**Interfaces:**
- Consumes: the `docs` collection and sidebar config from Task 2 (routes `/`, `/algorithm/`, `/ai/`, `/backend/` must resolve to these files by Starlight's file-based routing).
- Produces: a buildable site — nothing downstream in this plan depends on these files' internals beyond the routes existing.

- [ ] **Step 1: Create the homepage**

Create `apps/blog-astro/src/content/docs/index.md`:

```md
---
title: 技术文档
description: 技术学习文档集合
template: splash
hero:
  title: 技术文档
  tagline: 技术学习文档集合
  actions:
    - text: 查看算法题解
      link: /algorithm/
      icon: right-arrow
---
```

- [ ] **Step 2: Create the ALGORITHM sample page**

```bash
mkdir -p apps/blog-astro/src/content/docs/algorithm
cp apps/blog/docs/ALGORITHM/README.md apps/blog-astro/src/content/docs/algorithm/index.md
```

Then edit `apps/blog-astro/src/content/docs/algorithm/index.md`:
- Delete the first line (`# LeetCode 题解`) and the blank line immediately after it — Starlight renders the frontmatter `title` as the page's top-level heading, so a duplicate Markdown `#` heading is redundant.
- Insert this frontmatter at the very top of the file:

```md
---
title: LeetCode 题解
description: 我的 LeetCode 算法题解集合，每道题可点击跳转到 LeetCode 原题。
---
```

Note: this file contains internal links like `/ALGORITHM/912.排序数组` and `./1.两数之和.md` that point to sibling docs which are not part of this spike — those links will 404. That's expected; fixing them is out of scope (see spec's "Out of scope" section).

- [ ] **Step 3: Create the AI sample page**

```bash
mkdir -p apps/blog-astro/src/content/docs/ai
cp apps/blog/docs/AI/home/README.md apps/blog-astro/src/content/docs/ai/index.md
```

Then edit `apps/blog-astro/src/content/docs/ai/index.md`:
- Delete the first line (`# service/ai 技术文档总览`) and the blank line immediately after it, for the same reason as Step 2.
- Insert this frontmatter at the very top of the file:

```md
---
title: service/ai 技术文档总览
description: service/ai 全模块技术文档总览与架构图
---
```

Note: same as Step 2 — this file's relative links like `./01_vector_db.md` and image references like `/images/vectorDB-1.png` point to content/assets not copied in this spike, so they'll 404/break. Expected, out of scope.

- [ ] **Step 4: Create the BACKEND sample page**

```bash
mkdir -p apps/blog-astro/src/content/docs/backend
cp apps/blog/docs/BACKEND/ACID.md apps/blog-astro/src/content/docs/backend/index.md
```

Then edit `apps/blog-astro/src/content/docs/backend/index.md` to insert this frontmatter at the very top (this file has no existing H1 to remove):

```md
---
title: ACID
description: 数据库事务的 ACID 属性介绍与实际应用权衡
---
```

- [ ] **Step 5: Build and verify all four routes render**

Run: `pnpm --filter blog-astro build`
Expected: completes without error, producing `apps/blog-astro/dist/index.html`, `apps/blog-astro/dist/algorithm/index.html`, `apps/blog-astro/dist/ai/index.html`, `apps/blog-astro/dist/backend/index.html`.

Then run:

```bash
grep -l "技术学习文档集合" apps/blog-astro/dist/index.html
grep -l "LeetCode 题解" apps/blog-astro/dist/algorithm/index.html
grep -l "service/ai 技术文档总览" apps/blog-astro/dist/ai/index.html
grep -l "ACID" apps/blog-astro/dist/backend/index.html
```

Expected: each `grep -l` prints the matching file path (i.e., the expected text is present in each built page).

- [ ] **Step 6: Commit**

```bash
git add apps/blog-astro/src/content/docs/
git commit -m "feat(blog-astro): add homepage and three sample content pages"
```

---

### Task 4: Visual verification in a browser

**Files:** none (no code changes — this task drives the app that Tasks 1–3 built).

**Interfaces:**
- Consumes: the running `blog-astro` dev server from Task 3's completed build.

- [ ] **Step 1: Start the dev server**

Run (in the background, since it's a long-running process): `pnpm --filter blog-astro dev`
Expected: logs a local URL, typically `http://localhost:4321/`.

- [ ] **Step 2: Load the homepage in a browser and check the hero + sidebar**

Navigate to `http://localhost:4321/`. Confirm:
- The splash hero renders with title "技术文档" and tagline "技术学习文档集合".
- The sidebar (or nav, depending on Nova's layout) shows three groups: 🧩 ALGORITHM, 🧠 AI, ⚙️ BACKEND, each expandable to its one link.

- [ ] **Step 3: Check each content page renders**

Navigate to `/algorithm/`, `/ai/`, `/backend/` in turn. Confirm each page's content renders (headings, tables, lists, code blocks as applicable) without a broken layout.

- [ ] **Step 4: Check dark/light mode toggle**

Use Starlight's built-in theme toggle control. Confirm both modes render without unstyled or broken elements.

- [ ] **Step 5: Compare against the current VitePress site**

Open `apps/blog`'s existing dev server (or the deployed site) side by side and make the "less monotonous or not" call this spike exists to answer. This is a manual judgment call by the user, not an automated check — report what you see; no code changes follow from this step within this plan.

---

## Decision point (not a task)

After Task 4, the user decides whether to proceed with a full migration (all content, custom components, injection script — all currently out of scope), adjust the Nova theming, or stay on VitePress. That's a separate spec and plan.
