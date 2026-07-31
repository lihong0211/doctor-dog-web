---
name: spec-driven-react-development
description: "Systematic workflow for building React components from detailed design specifications, including monorepo scaffolding, spec compliance verification, and animation patterns. Use this skill when building React components or features from a detailed design specification with exact layout/animation/font/color constraints, monorepo scaffolding, or spec compliance verification."
trigger: "Use this skill when building React components or features from a detailed design specification with exact layout/animation/font/color constraints, monorepo scaffolding, or spec compliance verification."
author: lihong0211yao
source_sessions:
  - lihong0211yao_lihong0211yao's Organization_default_0607841c-ac68-4c73-9db8-77c1da87eb93
  - lihong0211yao_lihong0211yao's Organization_default_019f5e90-30e1-72a0-8e43-a1737b853b53
  - lihong0211yao_lihong0211yao's Organization_default_019f5e90-30e1-72a0-8e43-a16aba1fab3e
  - lihong0211yao_lihong0211yao's Organization_default_9372c486-bd42-4dff-baf3-99d92f709022
  - lihong0211yao_lihong0211yao's Organization_default_b1269bdf-aead-4c62-b47b-45002e6d92eb
  - lihong0211yao_lihong0211yao's Organization_default_cc6f16cd-c5ec-4ee3-b12f-7610cc547c15
contributors:
  - lihong0211yao
version: 1
created_by_agent: Codex
created_at: 2026-07-14T23:54:49.796Z
updated_at: 2026-07-14T23:54:49.796Z
---

# Spec-Driven React Component Development

## When to Use

Use this skill when:
- Building React components/features from a detailed design specification
- Scaffolding new apps in a monorepo (Vite + React + Tailwind + TypeScript)
- Implementing animations (framer-motion) with exact delays/durations/easing from spec
- Verifying spec compliance: layout, fonts, colors, asset URLs, copy text
- Handling multi-page features with routing

## Workflow

### 1. Interpret & Review the Spec

Parse the design prompt for:
- **Layout:** Flexbox/grid, padding, sizing, responsive breakpoints
- **Animations:** Delays, durations, easing, viewport triggers (scroll-driven vs. entrance)
- **Typography:** Font families, weights, sizes, line heights
- **Colors:** Hex values, gradients, backgrounds
- **Assets:** Image URLs, SVG paths, icon choices
- **Copy:** Exact text, CTAs, labels

Surface assumptions: missing breakpoint intent? unclear interactive states? unspecified content?

**Propose a design plan:** app structure (single file vs. component hierarchy), shared design system (reusable motion wrappers, CSS classes), pages/routes, dependency choices. **Get approval before proceeding.**

### 2. Scaffold the App in Monorepo Context

Create new `apps/<name>` directory matching existing app structure:

**Files:**
- `package.json`: React 18, TypeScript ~5.6, Tailwind 3, Vite 5, framer-motion if needed; no speculative deps
- `tsconfig.json`: standard monorepo template
- `vite.config.ts`: React plugin, no extra middleware
- `tailwind.config.cjs`: extend with any project-specific colors/fonts (usually from root config)
- `postcss.config.cjs`: tailwindcss plugin
- `index.html`: load fonts via `<link>` (not `@fontsource`); set `lang` and meta; script `src="/src/main.tsx"`
- `src/main.tsx`: `ReactDOM.createRoot()`, render `<App />`
- `src/App.tsx`: `BrowserRouter` if multi-page; route structure or single page
- `src/index.css`: Tailwind imports, shared CSS classes (e.g., `.hero-heading` for gradient text)
- `.gitignore`: standard (node_modules, dist, .DS_Store, etc.)

**Update root `package.json`:** add `dev:<app-name>` dev script.

**Verify:** `pnpm install`, `tsc`, `pnpm --filter <app-name> build` all succeed with no errors.

### 3. Build Component Hierarchy

**Shared design system** (`src/components/`):
- **Motion wrappers** (e.g., `FadeIn.tsx`): extract exact animation props from spec (delay, duration, easing, viewport). Use `framer-motion`'s `motion.create()` at module level, not inside render.
- **Repeated UI patterns:** buttons, cards, sections — but only if spec actually repeats them. No speculative abstractions.
- **CSS classes:** `.hero-heading`, `.section-padding`, etc., defined in `index.css`

**Page/Feature components:** One file per route or major section.

**Anti-pattern:** Don't add flexibility beyond spec. No "configuration" for colors, spacing, or animation values that spec doesn't ask for.

### 4. Implement to Spec

- **Match exactly:** Copy provided code blocks verbatim (SVG paths, hex colors, animation values, asset URLs)
- **Responsive:** Use Tailwind breakpoints (sm/md/lg) matching spec's intent
- **Type safety:** Export interfaces; use `React.FC<Props>` or function signatures with types
- **Font loading:** If spec prescribes Google `<link>`, use that; apply via inline `fontFamily` or Tailwind config (not `@fontsource`)
- **Avoid `motion.create()` inside render:** This creates a new component type on every re-render, breaking framer-motion's viewport tracking. Extract to module level:
  ```tsx
  // ✅ Correct: outside component
  const MotionDiv = motion.create('div');
  
  // ❌ Wrong: inside render
  function FadeIn() {
    const MotionDiv = motion.create('div'); // broken — re-creates on every render
    return <MotionDiv>...</MotionDiv>;
  }
  ```

### 5. Verify Spec Compliance & Build

- Check that generated code **matches spec exactly** for provided code blocks (SVG, CSS gradient values, animation delays/durations)
- Run `pnpm --filter <app-name> build`: TypeScript must compile cleanly, no warnings
- Browser-test key flows: responsive layouts (mobile 390px, tablet, desktop 1440px), animated entrances, interactive elements (links, buttons)
- **Document deviations:** If you had to deviate (missing asset, typo in spec, conflicting guidance), explain why

## Common Pitfalls

- **`motion.create()` in render:** Creates new component type every render, breaks viewport tracking. Use module-level const.
- **Over-scaffolding:** Don't add test infra, storybook, or linting unless explicitly asked. Minimal, spec-driven only.
- **Dependency drift:** Don't upgrade packages or add @fontsource if spec says use `<link>`. Match monorepo versions exactly.
- **Spec code blocks:** Copy them verbatim — don't reformat, don't "improve" hex case or spacing.
- **Responsive assumptions:** Clarify breakpoint intent before building. "Does `left-[1%]` change to `left-[2%]` at sm:?" Ask, don't assume.

## Example: Portfolio About Component

Spec provided: dark section (#0C0C0C), Kanit font, 4 corner decorative images with staggered fade-in animations, character-reveal animation on bio.

Workflow:
1. **Interpret:** Recognize `FadeIn.tsx` wrapper (with exact delays/durations), `CornerDecorations.tsx` for repeated corner logic, `pages/About.tsx` for page structure
2. **Scaffold:** Create `apps/portfolio`, load Kanit via `<link>` in `index.html`, add framer-motion to `package.json`
3. **Implement:** 
   - `FadeIn.tsx`: motion wrapper with `delay`, `duration`, `x`, `y`, viewport-once trigger
   - `CornerDecorations.tsx`: 4 images, absolute positioned, each with FadeIn wrapper
   - `About.tsx`: centered content, hero heading (`.hero-heading` class), bio with character-reveal, "Contact Me" button
4. **Verify:** Build passes (`pnpm --filter portfolio build`), browser renders all 4 corner images at correct positions, animations play on scroll entrance, copy matches spec exactly

## Output Format

For each component/page built:
```markdown
### Spec Compliance
- ✅ [File] matches spec exactly: [what was checked]

### Strengths
- [Positive finding]

### Issues
- [Any deviations or bugs found]
```
