# EN English Outer Sidebar Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the six English modules into the outermost ProLayout sidebar and remove all light layout boards from `/english`.

**Architecture:** Root owns route-aware ProLayout menu data. English reads `?module=` and renders one module without nested navigation. Scoped CSS darkens only the English ProLayout shell.

**Tech Stack:** React 18, React Router 6, Ant Design 5, Ant Design Pro Components, Vitest.

## Global Constraints

- Only `/en/english` changes visually.
- Preserve all module business behavior and APIs.
- Default module is `users`.
- Do not stage unrelated `.agents`, root `ai`, or `apps/ai` changes.

---

### Task 1: Lock the corrected navigation contract

**Files:**
- Modify: `apps/en/src/pages/English/English.test.tsx`
- Create: `apps/en/src/pages/Root/Root.test.tsx`

**Interfaces:**
- Consumes: `English` query parameter `module`.
- Produces: six outer menu entries in approved order.

- [ ] **Step 1: Write failing tests**

Test that `English` has no nested navigation and defaults to user content. Test that `Root` passes six approved routes to ProLayout.

- [ ] **Step 2: Verify RED**

Run `pnpm --dir apps/en test -- src/pages/English/English.test.tsx src/pages/Root/Root.test.tsx`.

Expected: FAIL because the nested navigation still exists and Root only exposes “学英语”.

### Task 2: Move modules to ProLayout

**Files:**
- Modify: `apps/en/src/pages/Root/props.tsx`
- Modify: `apps/en/src/pages/Root/index.tsx`
- Modify: `apps/en/src/pages/English/index.tsx`
- Modify: `apps/en/src/pages/English/English.css`

**Interfaces:**
- Produces: `/english?module=users|words|libraries|roots|affixes|speech`.
- Consumes: React Router `useSearchParams`.

- [ ] **Step 1: Implement outer menu routes**

Replace the single `/english` menu item with six query-string menu keys in approved order.

- [ ] **Step 2: Remove nested sidebar**

Render only the workbench header, current module heading, and current module component.

- [ ] **Step 3: Scope dark shell styling**

Add an `/english` class to ProLayout and override header, sider, content, PageContainer, menu and collapse control backgrounds using EN tokens.

- [ ] **Step 4: Verify GREEN**

Run `pnpm --dir apps/en test` and `pnpm --dir apps/en build`.

Expected: all tests pass and production build exits zero.

### Task 3: Ship correction

**Files:**
- Modify: `apps/en/dist/**`

- [ ] **Step 1: Review scope**

Run `git status --short` and confirm only EN/docs paths are staged.

- [ ] **Step 2: Commit and push**

Commit with `fix(en): move English modules to outer sidebar`, then push `origin main`.

- [ ] **Step 3: Deploy and verify**

Run `./deploy/deploy.sh`, then verify `https://doctor-dog.com/en/english` serves the new EN asset hashes.
