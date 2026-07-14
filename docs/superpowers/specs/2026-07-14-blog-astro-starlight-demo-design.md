# Blog: Astro + Starlight demo (spike)

## Goal

Stand up a new, isolated app, `apps/blog-astro`, as a minimal demo of
migrating the existing VitePress blog (`apps/blog`) to Astro +
Starlight with the `starlight-theme-nova` theme. The demo exists to
let the user visually judge whether this direction fixes the "too
monotonous" look before committing to a full migration. It is a spike,
not a replacement — `apps/blog` keeps running unchanged.

## App scaffold

- New workspace member `apps/blog-astro` (covered by the existing
  `apps/*` entry in `pnpm-workspace.yaml` — no root config changes
  needed).
- Deps: `astro`, `@astrojs/starlight`, `starlight-theme-nova`,
  `tailwindcss`, `@tailwindcss/vite` (Nova's recommended Tailwind
  setup).
- `astro.config.mjs`: `@astrojs/starlight` integration with
  `plugins: [starlightThemeNova()]`, `defaultLocale: 'zh-CN'`, and a
  manual `sidebar` array (see below).
- Not wired into root `README.md`, not referenced from
  `deploy/nginx/nginx.conf`, and does not touch `apps/blog` in any way.
  Runs standalone via `pnpm --filter blog-astro dev`.

## Content

Content lives under `src/content/docs/`, one subfolder per section,
each holding **one representative doc copied from `apps/blog`**:

- `algorithm/` ← copy of `apps/blog/docs/ALGORITHM/README.md`
  (LeetCode 题解)
- `ai/` ← copy of `apps/blog/docs/AI/home/README.md`
- `backend/` ← copy of `apps/blog/docs/BACKEND/ACID.md` (ACID). Note:
  the spec originally named `BACKEND/index.md` as the representative
  doc, but that file doesn't exist — the VitePress sidebar link to it
  is already dead (masked by `ignoreDeadLinks: true` in
  `apps/blog/docs/.vitepress/config.ts`). `ACID.md` is used instead: a
  short, self-contained BACKEND doc with no existing frontmatter.

Frontmatter: Starlight requires a `title` field per page — add one to
each copied file if missing (source VitePress docs may rely on the
first heading instead). No other frontmatter changes.

Homepage: Starlight's splash/hero template, reusing the existing
blog's title ("技术文档") and description ("技术学习文档集合") as
copy.

`sidebar` config in `astro.config.mjs` mirrors the current VitePress
grouping (three groups, one link each):

```js
sidebar: [
  { label: '🧩 ALGORITHM', items: [{ label: 'LeetCode 题解', link: '/algorithm/' }] },
  { label: '🧠 AI', items: [{ label: 'Home 项目文档', link: '/ai/' }] },
  { label: '⚙️ BACKEND', items: [{ label: 'ACID', link: '/backend/' }] },
]
```

## Theming

- `starlight-theme-nova` installed and enabled per its documented
  Tailwind setup: `src/styles/global.css` importing `tailwindcss` and
  `starlight-theme-nova/tailwind.css`, wired via `customCss` in the
  Starlight config and `@tailwindcss/vite` in Astro's `vite.plugins`.
- No custom CSS variable overrides and no custom components in this
  pass — use Nova's defaults as-is, evaluate visually, and only reach
  for further customization in a follow-up if the default look isn't
  right.
- Dark/light mode: Starlight's built-in toggle, default behavior, no
  customization.

## Out of scope for this spike

- Migrating the full content set (all of ALGORITHM/AI/BACKEND, not
  just one doc each).
- Custom components `HlsVideo.vue` and `InsightSection.vue` (no video
  embed or insight-section demo page).
- The `inject-leetcode-description.mjs` build script.
- Search.
- Any custom CSS variable overrides beyond what Nova ships with.
- Any change to `deploy/nginx/nginx.conf` or other deployment config.
- Any change to `apps/blog`.

## Verification

- `pnpm --filter blog-astro dev` starts without errors.
- Visit the homepage locally: hero renders, nav/sidebar with the three
  groups is visible, each group's single link resolves to its page.
- Visually compare against the current `apps/blog` VitePress site
  (side by side) for the "monotonous vs. not" judgment call this spike
  exists to answer.
- Toggle dark/light mode and confirm both render correctly.

## Decision point

After this spike, the user decides: keep going with a full migration
(informed by what's out of scope above), adjust the theming direction,
or stay on VitePress. That decision — and the resulting work — is a
separate spec/plan, not part of this one.
