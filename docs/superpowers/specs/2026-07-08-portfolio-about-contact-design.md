# Portfolio: About Me + Contact Me pages

## Goal

Stand up a new app, `apps/portfolio`, with two routed pages sharing a
common dark, animated design system: `/` (About Me) and `/contact`
(Contact Me). This is the first slice of a personal portfolio site;
resume-type content will be added later.

## App scaffold

- New workspace member `apps/portfolio`, same tooling shape as
  `apps/home`: `package.json`, `tailwind.config.cjs`, `postcss.config.cjs`,
  `vite.config.ts`, `tsconfig.json`, `index.html`.
- New deps not used elsewhere in the monorepo: `framer-motion`,
  `react-router-dom`.
- Not wired into root `README.md` / nginx deploy config yet — that's a
  follow-up once there's more content on the site.

## Font & base styles

- Google Font "Kanit", weights 300–900, loaded via `<link>` tags in
  `index.html` `<head>` (preconnect + stylesheet), per Google's current
  recommended embed snippet.
- `html, body { font-family: 'Kanit', sans-serif; }`
- Page background `#0C0C0C`.
- `.hero-heading` CSS class: gradient text fill
  `linear-gradient(180deg, #646973 0%, #BBCCD7 100%)` via
  `background-clip: text` (+ `-webkit-` prefixes).

## Routing

- `react-router-dom` `BrowserRouter` in `App.tsx` with two routes:
  `/` → `pages/About.tsx`, `/contact` → `pages/Contact.tsx`.
- About page's "Contact Me" button is a `<Link to="/contact">`.
- Contact page has a small text link back to `/`.

## Shared components (`src/components/`)

### `FadeIn.tsx`

Reusable scroll/mount fade-in wrapper.

- Props: `delay`, `duration` (default `0.7`), `x` (default `0`), `y`
  (default `30`), `className`, `style`, `as` (default `'div'`).
- Built with `motion.create(as)` so any HTML tag can be animated.
- Variants: `hidden` → `{ opacity: 0, x, y }`, `visible` → `{ opacity: 1,
  x: 0, y: 0 }`.
- Transition: `duration`, `delay`, easing `[0.25, 0.1, 0.25, 1]`.
- `whileInView="visible"`, `initial="hidden"`, `viewport={{ once: true,
  margin: '50px', amount: 0 }}`.

### `CornerDecorations.tsx`

Renders the 4 absolutely-positioned decorative images, `z-0`, used on
**both** About and Contact pages for visual consistency (no alternate
asset URLs exist for the smiley/cursor icons seen in the reference
screenshot).

| Corner | Image | Position classes | Size | FadeIn delay | Slide from |
|---|---|---|---|---|---|
| Top-left (moon) | `moon_icon.11395d36.png` | `top-[4%] left-[1%] sm:left-[2%] md:left-[4%]` | `w-[120px] sm:w-[160px] md:w-[210px] h-auto` | 0.1 | `x: -80, y: 0` |
| Bottom-left (3D object) | `p59_1.4659672e.png` | `bottom-[8%] left-[3%] sm:left-[6%] md:left-[10%]` | `w-[100px] sm:w-[140px] md:w-[180px] h-auto` | 0.25 | `x: -80, y: 0` |
| Top-right (lego) | `lego_icon-1.703bb594.png` | `top-[4%] right-[1%] sm:right-[2%] md:right-[4%]` | `w-[120px] sm:w-[160px] md:w-[210px] h-auto` | 0.15 | `x: 80, y: 0` |
| Bottom-right (group) | `Group_134-1.2e04f3ce.png` | `bottom-[8%] right-[3%] sm:right-[6%] md:right-[10%]` | `w-[130px] sm:w-[170px] md:w-[220px] h-auto` | 0.3 | `x: 80, y: 0` |

All four images load from the given
`https://shrug-person-78902957.figma.site/_components/...` URLs.
Duration `0.9` for all four.

### `AnimatedParagraph.tsx`

Scroll-driven character-by-character reveal, used on the About page's
bio paragraph only (see "Contact page content" below for why Contact
doesn't use this).

- Each character rendered as its own `<span style={{ position:
  'relative', display: 'inline-block' }}>` containing an invisible
  duplicate (holds layout space) plus an absolutely-positioned visible
  character on top.
- Spaces rendered as ` `.
- `useScroll({ target: containerRef, offset: ['start 0.8', 'end 0.2'] })`.
- Per character at `index` of `totalChars`: `charProgress = index /
  totalChars`; `start = Math.max(0, charProgress - 0.1)`; `end =
  Math.min(1, charProgress + 0.05)`; `useTransform(scrollYProgress,
  [start, end], [0.2, 1])` drives that character's opacity.

### Gradient "pill" button styling

Shared visual treatment (as inline styles or a small shared class) for
both the About page's "Contact Me" button and the Contact page's
mailto button:

- `rounded-full`, padding `px-8 py-3 sm:px-10 sm:py-3.5 md:px-12
  md:py-4`.
- Text: `text-white font-medium uppercase tracking-widest`, size
  `text-xs sm:text-sm md:text-base`.
- Background: `linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0
  72%, #BE4C00 100%)`.
- Box shadow: `0px 4px 4px rgba(181, 1, 167, 0.25), 4px 4px 12px
  #7721B1 inset`.
- Outline: `2px solid #E3E3E3`, `outlineOffset: -3px`.
- Hover → `opacity: 0.9`; active → `opacity: 0.75`; `transition: 200ms`.

## Page: About (`pages/About.tsx`)

Full spec as given by the user:

- Full-width `<section>`, `min-h-screen`, flex column, centered both
  axes, `relative`, padding `px-5 sm:px-8 md:px-10 py-20`.
- `<CornerDecorations />` behind content (`z-0`).
- Centered content column (`relative z-10 max-w-4xl`, `gap-16 sm:gap-20
  md:gap-24`):
  - Group 1 (`gap-10 sm:gap-14 md:gap-16`):
    - Heading "ABOUT ME" — `font-black uppercase leading-none
      tracking-tight text-center`, `font-size: clamp(3rem, 12vw,
      160px)`, `.hero-heading` class, `FadeIn` with `delay: 0, y: 40`.
    - `AnimatedParagraph` with the exact bio text from the spec,
      styled `text-[#D7E2EA] font-medium text-center leading-relaxed
      max-w-[560px]`, `font-size: clamp(1rem, 2vw, 1.35rem)`.
  - Group 2: `FadeIn` (`delay: 0.3, y: 20`) wrapping the gradient
    "Contact Me" pill button, `<Link to="/contact">`.

## Page: Contact (`pages/Contact.tsx`)

Same section skeleton as About (full-viewport, centered, dark,
`<CornerDecorations />`), with:

- Heading "CONTACT ME", same `hero-heading` gradient/size/weight
  treatment, `FadeIn(delay: 0, y: 40)`.
- A short static blurb (1–2 sentences, tone matching the About copy —
  invitation to reach out), wrapped in plain `FadeIn` (no char-reveal —
  a short contact line doesn't carry the same scroll-reveal pacing as
  a full bio paragraph).
- A `mailto:lihong0211yao@gmail.com` link styled with the shared
  gradient pill button treatment, text "EMAIL ME",
  `FadeIn(delay: 0.3, y: 20)`.
- No form, no social links (none supplied yet) — resume/social content
  is an explicit future addition, not part of this slice.
- Small text link back to `/` (About).

## Out of scope for this slice

- Wiring `apps/portfolio` into root `README.md`'s app table or the
  nginx deploy config.
- Resume/CV content.
- A contact form or social links (no data provided for either).
- Any nav/header shared across pages beyond the back-link on Contact.

## Verification

- `pnpm --filter portfolio dev`, visually check both routes at mobile
  (~375px), tablet (~768px), and desktop (~1440px) widths.
- Confirm all four corner images load and fade in with the correct
  slide direction and stagger delay.
- Confirm the About paragraph's scroll-driven character reveal
  progresses as the section scrolls through the viewport.
- Confirm the Contact Me button navigates to `/contact` and the
  mailto link opens the user's mail client with the right address.
