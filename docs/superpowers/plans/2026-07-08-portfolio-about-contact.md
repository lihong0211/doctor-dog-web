# Portfolio About Me / Contact Me Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a new `apps/portfolio` workspace member with two routed pages — `/` (About Me) and `/contact` (Contact Me) — sharing a dark, animated Kanit-font design system built with React, Tailwind, and framer-motion.

**Architecture:** A Vite + React + TS app scaffolded like `apps/home`/`apps/ai`, with `react-router-dom` for the two routes and a small set of shared presentational components (`FadeIn`, `CornerDecorations`, `AnimatedParagraph`, `GradientButton`) that both pages compose.

**Tech Stack:** React 18.3.1, TypeScript ~5.6.2, Vite ^5.4.10, Tailwind CSS ^3.4.13, framer-motion ^12.34.0, react-router-dom ^6.28.0 (same dependency versions already used elsewhere in this monorepo, in `apps/home` and `apps/ai`).

## Global Constraints

- Package name: `portfolio`, lives at `apps/portfolio` (picked up automatically by the root `pnpm-workspace.yaml` glob `apps/*`).
- Dependency versions must match what's already pinned elsewhere in the monorepo: `react`/`react-dom` `^18.3.1`, `typescript` `~5.6.2`, `vite` `^5.4.10`, `@vitejs/plugin-react` `^4.3.3`, `tailwindcss` `^3.4.13`, `autoprefixer` `^10.4.20`, `postcss` `^8.4.47`, `framer-motion` `^12.34.0` (from `apps/ai`), `react-router-dom` `^6.28.0` (from `apps/ai`).
- Page background: `#0C0C0C`. Font: Google Font "Kanit", weights `300;400;500;600;700;800;900`, loaded via `<link>` tags (not `@fontsource`).
- `.hero-heading` gradient text class: `background: linear-gradient(180deg, #646973 0%, #BBCCD7 100%)` with `-webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`.
- About page bio copy (verbatim, do not edit): "With more than five years of experience in design, i focus on branding, web design, and user experience, i truly enjoy working with businesses that aim to stand out and present their best image. Let's build something incredible together!"
- Contact email: `lihong0211yao@gmail.com`. No social links, no contact form — none were supplied and none are in scope for this slice.
- This monorepo has no unit-test infrastructure in any app (`apps/home`, `apps/ai`, `apps/en`, `apps/blog` all ship without a test runner) — do not introduce one. Verification for each task is `tsc`/`vite build` succeeding, plus a final Playwright visual check across both routes.
- Not in scope: wiring `apps/portfolio` into root `README.md`'s app table or `deploy/nginx/doctor-dog.com.conf` — this app isn't deployed yet.

---

### Task 1: Scaffold `apps/portfolio` tooling

**Files:**
- Create: `apps/portfolio/package.json`
- Create: `apps/portfolio/tsconfig.json`
- Create: `apps/portfolio/vite.config.ts`
- Create: `apps/portfolio/tailwind.config.cjs`
- Create: `apps/portfolio/postcss.config.cjs`
- Create: `apps/portfolio/.gitignore`
- Create: `apps/portfolio/index.html`
- Create: `apps/portfolio/src/index.css`
- Create: `apps/portfolio/src/main.tsx`
- Create: `apps/portfolio/src/App.tsx` (placeholder, replaced in Task 6)
- Modify: `/Users/lihong/Desktop/personal/code/doctor-dog-web/package.json` (add `dev:portfolio` script)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a buildable, empty Vite app at `apps/portfolio` that later tasks add components and pages into. `src/App.tsx` exports a default `App` component that `src/main.tsx` renders — later tasks replace `App.tsx`'s body but keep this export shape.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "portfolio",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "framer-motion": "^12.34.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "~5.6.2",
    "vite": "^5.4.10"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```typescript
import path from 'path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Create `tailwind.config.cjs`**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 5: Create `postcss.config.cjs`**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules
.DS_Store
tsconfig.tsbuildinfo
dist
```

- [ ] **Step 7: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Portfolio</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  font-family: 'Kanit', sans-serif;
  background-color: #0c0c0c;
}

.hero-heading {
  background: linear-gradient(180deg, #646973 0%, #bbccd7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

- [ ] **Step 9: Create `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 10: Create placeholder `src/App.tsx`**

```tsx
export default function App() {
  return <div>portfolio scaffold</div>
}
```

- [ ] **Step 11: Add `dev:portfolio` script to root `package.json`**

Edit `/Users/lihong/Desktop/personal/code/doctor-dog-web/package.json`, adding this line alongside the other `dev:*` scripts (after `"dev:404"`, the current last `dev:*` entry):

```json
    "dev:portfolio": "pnpm --filter portfolio dev",
```

- [ ] **Step 12: Install dependencies**

Run: `pnpm install` (from repo root)
Expected: completes without errors; `apps/portfolio` appears as a workspace package in the lockfile diff.

- [ ] **Step 13: Verify the scaffold builds**

Run: `pnpm --filter portfolio build`
Expected: `tsc` and `vite build` both succeed, producing `apps/portfolio/dist/`.

- [ ] **Step 14: Commit**

```bash
git add apps/portfolio package.json pnpm-lock.yaml
git commit -m "feat(portfolio): scaffold new portfolio app"
```

---

### Task 2: `FadeIn` component

**Files:**
- Create: `apps/portfolio/src/components/FadeIn.tsx`

**Interfaces:**
- Consumes: nothing new (uses `framer-motion`, installed in Task 1).
- Produces: `FadeIn` — a component with props `{ children: ReactNode; delay?: number; duration?: number; x?: number; y?: number; className?: string; style?: CSSProperties; as?: ElementType }` (defaults: `delay=0`, `duration=0.7`, `x=0`, `y=30`, `as='div'`). Later tasks (`CornerDecorations`, `About`, `Contact`) import this as `import { FadeIn } from '../components/FadeIn'` (or `./FadeIn` from within `components/`).

- [ ] **Step 1: Create `FadeIn.tsx`**

```tsx
import type { CSSProperties, ElementType, ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  x?: number
  y?: number
  className?: string
  style?: CSSProperties
  as?: ElementType
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  className,
  style,
  as = 'div',
}: FadeInProps) {
  const MotionTag = motion.create(as)

  const variants: Variants = {
    hidden: { opacity: 0, x, y },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration, delay, ease: [0.25, 0.1, 0.25, 1] },
    },
  }

  return (
    <MotionTag
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '50px', amount: 0 }}
      variants={variants}
    >
      {children}
    </MotionTag>
  )
}
```

- [ ] **Step 2: Verify it typechecks and builds**

Run: `pnpm --filter portfolio build`
Expected: succeeds (component isn't used anywhere yet, so this only confirms no syntax/type errors).

- [ ] **Step 3: Commit**

```bash
git add apps/portfolio/src/components/FadeIn.tsx
git commit -m "feat(portfolio): add FadeIn animation component"
```

---

### Task 3: `CornerDecorations` component

**Files:**
- Create: `apps/portfolio/src/components/CornerDecorations.tsx`

**Interfaces:**
- Consumes: `FadeIn` from Task 2 (`import { FadeIn } from './FadeIn'`).
- Produces: `CornerDecorations` — a component taking no props, rendering the 4 fixed corner images. Later tasks (`About`, `Contact`) import it as `import { CornerDecorations } from '../components/CornerDecorations'` and render it as the first child inside their `<section className="relative ...">`.

- [ ] **Step 1: Create `CornerDecorations.tsx`**

```tsx
import { FadeIn } from './FadeIn'

const BASE_URL =
  'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7'

export function CornerDecorations() {
  return (
    <>
      <FadeIn
        delay={0.1}
        duration={0.9}
        x={-80}
        y={0}
        className="absolute left-[1%] top-[4%] z-0 sm:left-[2%] md:left-[4%]"
      >
        <img
          src={`${BASE_URL}/moon_icon.11395d36.png`}
          alt=""
          className="h-auto w-[120px] sm:w-[160px] md:w-[210px]"
        />
      </FadeIn>
      <FadeIn
        delay={0.25}
        duration={0.9}
        x={-80}
        y={0}
        className="absolute bottom-[8%] left-[3%] z-0 sm:left-[6%] md:left-[10%]"
      >
        <img
          src={`${BASE_URL}/p59_1.4659672e.png`}
          alt=""
          className="h-auto w-[100px] sm:w-[140px] md:w-[180px]"
        />
      </FadeIn>
      <FadeIn
        delay={0.15}
        duration={0.9}
        x={80}
        y={0}
        className="absolute right-[1%] top-[4%] z-0 sm:right-[2%] md:right-[4%]"
      >
        <img
          src={`${BASE_URL}/lego_icon-1.703bb594.png`}
          alt=""
          className="h-auto w-[120px] sm:w-[160px] md:w-[210px]"
        />
      </FadeIn>
      <FadeIn
        delay={0.3}
        duration={0.9}
        x={80}
        y={0}
        className="absolute bottom-[8%] right-[3%] z-0 sm:right-[6%] md:right-[10%]"
      >
        <img
          src={`${BASE_URL}/Group_134-1.2e04f3ce.png`}
          alt=""
          className="h-auto w-[130px] sm:w-[170px] md:w-[220px]"
        />
      </FadeIn>
    </>
  )
}
```

- [ ] **Step 2: Verify it typechecks and builds**

Run: `pnpm --filter portfolio build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/portfolio/src/components/CornerDecorations.tsx
git commit -m "feat(portfolio): add CornerDecorations component"
```

---

### Task 4: `AnimatedParagraph` component

**Files:**
- Create: `apps/portfolio/src/components/AnimatedParagraph.tsx`

**Interfaces:**
- Consumes: nothing new (uses `framer-motion`'s `useScroll`/`useTransform`, and React's `useRef`).
- Produces: `AnimatedParagraph` — a component with props `{ text: string; className?: string; style?: CSSProperties }`. The About page (Task 6) imports it as `import { AnimatedParagraph } from '../components/AnimatedParagraph'` and renders `<AnimatedParagraph text={BIO_TEXT} className="..." style={{...}} />`.

- [ ] **Step 1: Create `AnimatedParagraph.tsx`**

```tsx
import type { CSSProperties } from 'react'
import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'

interface AnimatedParagraphProps {
  text: string
  className?: string
  style?: CSSProperties
}

function AnimatedChar({
  char,
  index,
  totalChars,
  scrollYProgress,
}: {
  char: string
  index: number
  totalChars: number
  scrollYProgress: MotionValue<number>
}) {
  const charProgress = index / totalChars
  const start = Math.max(0, charProgress - 0.1)
  const end = Math.min(1, charProgress + 0.05)
  const opacity = useTransform(scrollYProgress, [start, end], [0.2, 1])
  const display = char === ' ' ? ' ' : char

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ visibility: 'hidden' }}>{display}</span>
      <motion.span style={{ position: 'absolute', left: 0, top: 0, opacity }}>
        {display}
      </motion.span>
    </span>
  )
}

export function AnimatedParagraph({ text, className, style }: AnimatedParagraphProps) {
  const containerRef = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  })

  const chars = text.split('')

  return (
    <p ref={containerRef} className={className} style={style}>
      {chars.map((char, index) => (
        <AnimatedChar
          key={index}
          char={char}
          index={index}
          totalChars={chars.length}
          scrollYProgress={scrollYProgress}
        />
      ))}
    </p>
  )
}
```

- [ ] **Step 2: Verify it typechecks and builds**

Run: `pnpm --filter portfolio build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/portfolio/src/components/AnimatedParagraph.tsx
git commit -m "feat(portfolio): add scroll-driven AnimatedParagraph component"
```

---

### Task 5: `GradientButton` component

**Files:**
- Create: `apps/portfolio/src/components/GradientButton.tsx`

**Interfaces:**
- Consumes: `Link` from `react-router-dom` (installed in Task 1).
- Produces: `GradientButton` — a component with props `{ children: ReactNode; to?: string; href?: string }`. Exactly one of `to` (internal route, renders a router `Link`) or `href` (renders an `<a>`, used for `mailto:`) is passed by callers. Task 6 (About) uses `<GradientButton to="/contact">Contact Me</GradientButton>`; Task 7 (Contact) uses `<GradientButton href="mailto:lihong0211yao@gmail.com">Email Me</GradientButton>`.

- [ ] **Step 1: Create `GradientButton.tsx`**

```tsx
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface GradientButtonProps {
  children: ReactNode
  to?: string
  href?: string
}

const buttonStyle = {
  background:
    'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
  boxShadow: '0px 4px 4px rgba(181, 1, 167, 0.25), 4px 4px 12px #7721B1 inset',
  outline: '2px solid #E3E3E3',
  outlineOffset: '-3px',
}

const buttonClassName =
  'rounded-full px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-xs sm:text-sm md:text-base font-medium uppercase tracking-widest text-white transition-opacity duration-200 hover:opacity-90 active:opacity-75'

export function GradientButton({ children, to, href }: GradientButtonProps) {
  if (to) {
    return (
      <Link to={to} className={buttonClassName} style={buttonStyle}>
        {children}
      </Link>
    )
  }

  return (
    <a href={href} className={buttonClassName} style={buttonStyle}>
      {children}
    </a>
  )
}
```

- [ ] **Step 2: Verify it typechecks and builds**

Run: `pnpm --filter portfolio build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/portfolio/src/components/GradientButton.tsx
git commit -m "feat(portfolio): add GradientButton component"
```

---

### Task 6: About page + routing wire-up

**Files:**
- Create: `apps/portfolio/src/pages/About.tsx`
- Create: `apps/portfolio/src/pages/Contact.tsx` (temporary placeholder, filled in fully by Task 7)
- Modify: `apps/portfolio/src/App.tsx` (replace placeholder body with `BrowserRouter` + routes)

**Interfaces:**
- Consumes: `CornerDecorations` (Task 3), `FadeIn` (Task 2), `AnimatedParagraph` (Task 4), `GradientButton` (Task 5); `BrowserRouter`, `Routes`, `Route` from `react-router-dom`.
- Produces: `About` default export from `pages/About.tsx`; `Contact` default export from `pages/Contact.tsx` (placeholder here, real implementation in Task 7); `App.tsx` renders `<BrowserRouter><Routes><Route path="/" element={<About />} /><Route path="/contact" element={<Contact />} /></Routes></BrowserRouter>`.

- [ ] **Step 1: Create `pages/About.tsx`**

```tsx
import { AnimatedParagraph } from '../components/AnimatedParagraph'
import { CornerDecorations } from '../components/CornerDecorations'
import { FadeIn } from '../components/FadeIn'
import { GradientButton } from '../components/GradientButton'

const BIO_TEXT =
  "With more than five years of experience in design, i focus on branding, web design, and user experience, i truly enjoy working with businesses that aim to stand out and present their best image. Let's build something incredible together!"

export default function About() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-5 py-20 sm:px-8 md:px-10">
      <CornerDecorations />
      <div className="relative z-10 flex max-w-4xl flex-col items-center gap-16 sm:gap-20 md:gap-24">
        <div className="flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
          <FadeIn
            as="h1"
            y={40}
            className="hero-heading text-center font-black uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
          >
            About me
          </FadeIn>
          <AnimatedParagraph
            text={BIO_TEXT}
            className="max-w-[560px] text-center font-medium leading-relaxed text-[#D7E2EA]"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
          />
        </div>
        <FadeIn delay={0.3} y={20}>
          <GradientButton to="/contact">Contact Me</GradientButton>
        </FadeIn>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create placeholder `pages/Contact.tsx`**

```tsx
export default function Contact() {
  return <div>contact placeholder</div>
}
```

- [ ] **Step 3: Replace `App.tsx`**

```tsx
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import About from './pages/About'
import Contact from './pages/Contact'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Verify it builds**

Run: `pnpm --filter portfolio build`
Expected: succeeds.

- [ ] **Step 5: Visually verify the About route**

Run: `pnpm --filter portfolio dev` (leave running)
Then open `http://localhost:5173/` in a browser (or use the Playwright MCP tool: `browser_navigate` to that URL, then `browser_snapshot`).
Expected: dark `#0C0C0C` page, "ABOUT ME" gradient heading centered, bio paragraph below it, 4 corner images fading in, "Contact Me" gradient pill button. Stop the dev server after checking.

- [ ] **Step 6: Commit**

```bash
git add apps/portfolio/src/pages/About.tsx apps/portfolio/src/pages/Contact.tsx apps/portfolio/src/App.tsx
git commit -m "feat(portfolio): add About page and wire up routing"
```

---

### Task 7: Contact page

**Files:**
- Modify: `apps/portfolio/src/pages/Contact.tsx` (replace placeholder from Task 6 with the full implementation)

**Interfaces:**
- Consumes: `CornerDecorations` (Task 3), `FadeIn` (Task 2), `GradientButton` (Task 5), `Link` from `react-router-dom`.
- Produces: `Contact` default export, matching the shape `App.tsx` already routes to (`/contact`) — no changes needed to `App.tsx`.

- [ ] **Step 1: Replace `pages/Contact.tsx`**

```tsx
import { Link } from 'react-router-dom'

import { CornerDecorations } from '../components/CornerDecorations'
import { FadeIn } from '../components/FadeIn'
import { GradientButton } from '../components/GradientButton'

const CONTACT_EMAIL = 'lihong0211yao@gmail.com'
const BLURB_TEXT =
  "Have a project in mind or just want to say hello? I'd love to hear from you — reach out and let's start a conversation."

export default function Contact() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-5 py-20 sm:px-8 md:px-10">
      <CornerDecorations />
      <div className="relative z-10 flex max-w-4xl flex-col items-center gap-16 sm:gap-20 md:gap-24">
        <div className="flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
          <FadeIn
            as="h1"
            y={40}
            className="hero-heading text-center font-black uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
          >
            Contact me
          </FadeIn>
          <FadeIn
            as="p"
            delay={0.15}
            y={20}
            className="max-w-[560px] text-center font-medium leading-relaxed text-[#D7E2EA]"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
          >
            {BLURB_TEXT}
          </FadeIn>
        </div>
        <FadeIn delay={0.3} y={20}>
          <GradientButton href={`mailto:${CONTACT_EMAIL}`}>Email Me</GradientButton>
        </FadeIn>
      </div>
      <Link
        to="/"
        className="relative z-10 mt-10 text-sm text-[#D7E2EA] underline-offset-4 hover:underline"
      >
        Back to About
      </Link>
    </section>
  )
}
```

- [ ] **Step 2: Verify it builds**

Run: `pnpm --filter portfolio build`
Expected: succeeds.

- [ ] **Step 3: Visually verify the Contact route**

Run: `pnpm --filter portfolio dev` (leave running)
Then open `http://localhost:5173/contact` (or Playwright `browser_navigate` + `browser_snapshot`).
Expected: same dark layout and corner decorations as About, "CONTACT ME" gradient heading, blurb text, "Email Me" gradient pill button linking to `mailto:lihong0211yao@gmail.com`, "Back to About" link that navigates to `/`. Stop the dev server after checking.

- [ ] **Step 4: Commit**

```bash
git add apps/portfolio/src/pages/Contact.tsx
git commit -m "feat(portfolio): add Contact page"
```

---

### Task 8: Final cross-page verification

**Files:** none (verification only).

**Interfaces:**
- Consumes: the full app from Tasks 1–7.
- Produces: nothing new — confirms the whole slice works end-to-end.

- [ ] **Step 1: Full build**

Run: `pnpm --filter portfolio build`
Expected: succeeds with no TypeScript or bundling errors.

- [ ] **Step 2: Responsive visual check**

Run: `pnpm --filter portfolio dev` (leave running). Using the Playwright MCP tool:
- `browser_navigate` to `http://localhost:5173/`, `browser_resize` to `375x812` (mobile), `768x1024` (tablet), `1440x900` (desktop) — `browser_take_screenshot` at each size.
- `browser_navigate` to `http://localhost:5173/contact`, repeat the three sizes and screenshots.
Expected: at every width, the heading stays centered and legible, the 4 corner images stay clear of the centered content column, and the gradient button remains a legible pill shape. Stop the dev server after checking.

- [ ] **Step 3: Confirm navigation round-trip**

Using Playwright: on `/`, `browser_click` the "Contact Me" button, confirm the URL becomes `/contact`; then `browser_click` "Back to About", confirm the URL returns to `/`.
Expected: both navigations work without a full page reload (client-side routing).

- [ ] **Step 4: Final commit (if any fixes were needed)**

If Steps 1–3 required any code fixes, stage and commit them with a message describing the fix. If no fixes were needed, this task produces no commit.
