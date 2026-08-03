# English Intro Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public product intro page at `/english` (desktop app + mini program showcase, downloads, QR code) and move the existing admin console to `/english/console`, with buttons to switch between the two.

**Architecture:** Split `/english` into two independent top-level routes in `Router.tsx` — `/english` renders a new standalone `EnglishIntro` page (no `ProLayout` chrome), `/english/console` renders the existing `English` console unchanged in behavior. `Root.tsx`'s console-only styling hook (`isEnglish`) moves from matching `/english` to matching `/english/console`.

**Tech Stack:** React + TypeScript, react-router-dom (`createBrowserRouter`), antd (`ConfigProvider`/`Button`/`Card`), Vite, Vitest + @testing-library/react, pnpm workspace (package name `en`, run from `apps/en`).

## Global Constraints

- All new UI must reuse the existing dark theme tokens: CSS custom properties defined in `apps/en/src/styles/index.css` (`--en-canvas`, `--en-surface-1`, `--en-border`, `--en-text-primary`, `--en-text-secondary`, `--en-text-tertiary`, `--en-primary`) and the antd `enTheme` from `apps/en/src/theme/antdTheme.ts`. Do not introduce new colors.
- Desktop download links point at GitHub Release `v2.1.0` assets, hardcoded (user-accepted tradeoff — no auto-follow-latest-version logic):
  - Mac (Apple Silicon): `https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0-arm.dmg`
  - Mac (Intel): `https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0-intel.dmg`
  - Windows: `https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0.exe`
- Mini program QR code is a placeholder PNG until the user supplies the real exported image (they will drop the real file at `apps/en/src/assets/mini-program-qrcode.png` themselves later — no code changes needed at that point).
- `body { position: fixed; inset: 0; overflow: hidden }` is set globally (`apps/en/src/styles/index.css:36-40`) — any new full-page view must manage its own internal scroll (`height: 100dvh; overflow-y: auto`) rather than relying on page scroll.
- Run all commands from `apps/en/` (`cd apps/en && pnpm test`), this is a pnpm workspace package named `en`.

---

### Task 1: Intro page component (`EnglishIntro`)

**Files:**
- Create: `apps/en/src/assets/mini-program-qrcode.png` (placeholder image)
- Create: `apps/en/src/pages/EnglishIntro/index.tsx`
- Create: `apps/en/src/pages/EnglishIntro/EnglishIntro.css`
- Test: `apps/en/src/pages/EnglishIntro/EnglishIntro.test.tsx`

**Interfaces:**
- Produces: default export `EnglishIntro` — a zero-props React component — from `apps/en/src/pages/EnglishIntro/index.tsx`. Task 2's `Router.tsx` imports it as `import EnglishIntro from './pages/EnglishIntro/index'`.

- [ ] **Step 1: Generate the placeholder QR asset**

Run from `apps/en/`:

```bash
mkdir -p src/assets
magick -size 240x240 xc:'#131922' -bordercolor '#232D39' -border 2 \
  -fill '#6F7C89' -gravity center -pointsize 20 -interline-spacing 6 \
  -annotate 0 '二维码占位\n待替换' src/assets/mini-program-qrcode.png
```

Verify it was created: `file src/assets/mini-program-qrcode.png` should print `PNG image data`.

- [ ] **Step 2: Write the failing test**

Create `apps/en/src/pages/EnglishIntro/EnglishIntro.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import EnglishIntro from './index';

describe('English intro page', () => {
  it('shows the hero, console entry, desktop downloads, QR code and footer', () => {
    render(
      <MemoryRouter initialEntries={['/english']}>
        <EnglishIntro />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: '随时随地，把单词学进脑子里' }),
    ).toBeVisible();

    expect(screen.getByRole('link', { name: '进入控制台' })).toHaveAttribute(
      'href',
      '/english/console',
    );

    expect(
      screen.getByRole('link', { name: 'Mac (Apple Silicon)' }),
    ).toHaveAttribute(
      'href',
      'https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0-arm.dmg',
    );
    expect(screen.getByRole('link', { name: 'Mac (Intel)' })).toHaveAttribute(
      'href',
      'https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0-intel.dmg',
    );
    expect(screen.getByRole('link', { name: 'Windows' })).toHaveAttribute(
      'href',
      'https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0.exe',
    );

    expect(screen.getByAltText('学英语小程序二维码')).toBeVisible();
    expect(screen.getByText('备案号：蜀ICP备2024044574号')).toBeVisible();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd apps/en && pnpm test -- EnglishIntro`
Expected: FAIL — `Failed to resolve import "./index"` (component doesn't exist yet)

- [ ] **Step 4: Write the CSS**

Create `apps/en/src/pages/EnglishIntro/EnglishIntro.css`:

```css
.en-intro-scroll {
  height: 100dvh;
  overflow-y: auto;
  background: var(--en-canvas);
}

.en-intro {
  position: relative;
  min-height: 100dvh;
  padding-bottom: 50px;
  color: var(--en-text-primary);
  background:
    radial-gradient(circle at 82% 0%, rgb(0 201 141 / 8%), transparent 32rem),
    var(--en-canvas);
}

.en-intro-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 28px;
  border-bottom: 1px solid var(--en-border);
}

.en-intro-nav-title {
  color: var(--en-text-primary);
  font-size: 18px;
  font-weight: 700;
}

.en-intro-hero {
  padding: 64px 28px 32px;
  text-align: center;
}

.en-intro-hero h1 {
  margin: 0 0 16px;
  color: var(--en-text-primary);
  font-size: 34px;
}

.en-intro-hero p {
  max-width: 560px;
  margin: 0 auto;
  color: var(--en-text-secondary);
  font-size: 15px;
  line-height: 1.7;
}

.en-intro-cards {
  display: flex;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 28px 64px;
  gap: 24px;
}

.en-intro-card {
  flex: 1;
  min-width: 0;
  border-color: var(--en-border);
  background: var(--en-surface-1);
}

.en-intro-card .ant-card-head {
  border-color: var(--en-border);
  color: var(--en-text-primary);
}

.en-intro-card p {
  margin: 0 0 20px;
  color: var(--en-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.en-intro-downloads {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.en-intro-qrcode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.en-intro-qrcode img {
  border: 1px solid var(--en-border);
  border-radius: 8px;
}

.en-intro-qrcode span {
  color: var(--en-text-tertiary);
  font-size: 13px;
}

@media (max-width: 720px) {
  .en-intro-cards {
    flex-direction: column;
  }
}
```

- [ ] **Step 5: Write the component**

Create `apps/en/src/pages/EnglishIntro/index.tsx`:

```tsx
import { useEffect } from 'react';
import { ConfigProvider, Button, Card } from 'antd';
import qrCodeImg from '../../assets/mini-program-qrcode.png';
import Footer from '../../components/Footer';
import { enTheme } from '../../theme/antdTheme';
import './EnglishIntro.css';

const DESKTOP_DOWNLOADS = [
  {
    label: 'Mac (Apple Silicon)',
    href: 'https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0-arm.dmg',
  },
  {
    label: 'Mac (Intel)',
    href: 'https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0-intel.dmg',
  },
  {
    label: 'Windows',
    href: 'https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0.exe',
  },
] as const;

export default function EnglishIntro() {
  useEffect(() => {
    document.title = '二仙桥大爷 | 学英语';
  }, []);

  return (
    <ConfigProvider theme={enTheme}>
      <div className="en-intro-scroll">
        <div className="en-intro">
          <header className="en-intro-nav">
            <span className="en-intro-nav-title">学英语</span>
            <Button type="primary" href="/english/console">
              进入控制台
            </Button>
          </header>

          <section className="en-intro-hero">
            <h1>随时随地，把单词学进脑子里</h1>
            <p>
              桌面端沉浸式背单词，小程序随手学，例句朗读、发音跟读、生词本自动同步，一套系统，两种用法。
            </p>
          </section>

          <section className="en-intro-cards">
            <Card className="en-intro-card" title="桌面端">
              <p>沉浸式背单词播放器，例句朗读、悬浮词幕、日常用语轮播，适合长时间专注学习。</p>
              <div className="en-intro-downloads">
                {DESKTOP_DOWNLOADS.map((item) => (
                  <Button key={item.label} href={item.href} target="_blank" rel="noreferrer">
                    {item.label}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="en-intro-card" title="小程序">
              <p>微信扫码即用，碎片时间随手背单词，数据与桌面端账号同步。</p>
              <div className="en-intro-qrcode">
                <img src={qrCodeImg} alt="学英语小程序二维码" width={160} height={160} />
                <span>微信扫码体验</span>
              </div>
            </Card>
          </section>

          <Footer />
        </div>
      </div>
    </ConfigProvider>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd apps/en && pnpm test -- EnglishIntro`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
cd apps/en
git add src/assets/mini-program-qrcode.png src/pages/EnglishIntro
git commit -m "feat(en): add English product intro page"
```

---

### Task 2: Route split (`/english` intro vs `/english/console`)

**Files:**
- Modify: `apps/en/src/Router.tsx`
- Modify: `apps/en/src/pages/Root/index.tsx:14,16`
- Modify: `apps/en/src/pages/Root/props.tsx` (6 route entries)
- Test: `apps/en/src/pages/Root/props.test.ts`

**Interfaces:**
- Consumes: `EnglishIntro` default export from Task 1 (`apps/en/src/pages/EnglishIntro/index.tsx`).
- Produces: `/english` → intro page, `/english/console` → admin console. Task 1 and Task 3 already hardcode these two path strings, so no further code interface is produced here — this task just makes those paths real.

- [ ] **Step 1: Update the failing test**

Edit `apps/en/src/pages/Root/props.test.ts` — replace the `expect` block:

```ts
    expect(routes.map(({ path }) => path)).toEqual([
      '/english/console?module=users',
      '/english/console?module=words',
      '/english/console?module=libraries',
      '/english/console?module=roots',
      '/english/console?module=affixes',
      '/english/console?module=speech',
    ]);
```

(keep the `name` and `key` assertions as-is — `key` is asserted to equal `path` so it updates automatically once `path` values change).

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/en && pnpm test -- props.test`
Expected: FAIL — expected `/english/console?module=users`, received `/english?module=users`

- [ ] **Step 3: Update `Router.tsx`**

Edit `apps/en/src/Router.tsx`:

```tsx
import Root from './pages/Root/index';
import English from './pages/English/index';
import EnglishIntro from './pages/EnglishIntro/index';
import StoreLayout from './pages/Store/StoreLayout';
import ProductList from './pages/Store/ProductList';
import ProductDetail from './pages/Store/ProductDetail';
import StoreLogin from './pages/Store/Login';
import StoreRegister from './pages/Store/Register';
import AdminProducts from './pages/Store/AdminProducts';
import AdminOrders from './pages/Store/AdminOrders';
import Test from './pages/English/Test/index';
import { createBrowserRouter, Navigate } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <Navigate to="/english" replace />,
      },
      {
        path: '/english/console',
        element: <English />,
      },
      {
        path: '/store',
        element: <StoreLayout />,
        children: [
          { index: true, element: <ProductList /> },
          { path: 'product/:id', element: <ProductDetail /> },
          { path: 'login', element: <StoreLogin /> },
          { path: 'register', element: <StoreRegister /> },
          { path: 'admin/products', element: <AdminProducts /> },
          { path: 'admin/orders', element: <AdminOrders /> },
        ],
      },
      {
        path: '/test',
        element: <Test />,
      },
    ],
  },
  {
    path: '/english',
    element: <EnglishIntro />,
  },
],{
  basename: '/en'
});

export default router;

export const navigate = router.navigate;
```

- [ ] **Step 4: Update `Root.tsx`**

Edit `apps/en/src/pages/Root/index.tsx`, lines 14 and 16:

```tsx
  const isEnglish = pathname === '/english/console';
  const englishLocation =
    search && search.includes('module=') ? `${pathname}${search}` : '/english/console?module=users';
```

- [ ] **Step 5: Update `props.tsx`**

Edit `apps/en/src/pages/Root/props.tsx` — change all 6 `path`/`key` pairs from `/english?module=X` to `/english/console?module=X`:

```tsx
export default {
  route: {
    path: '/',
    routes: [
      {
        path: '/english/console?module=users',
        key: '/english/console?module=users',
        name: '用户',
        component: '../English',
      },
      {
        path: '/english/console?module=words',
        key: '/english/console?module=words',
        name: '单词',
        component: '../English',
      },
      {
        path: '/english/console?module=libraries',
        key: '/english/console?module=libraries',
        name: '词库',
        component: '../English',
      },
      {
        path: '/english/console?module=roots',
        key: '/english/console?module=roots',
        name: '词根',
        component: '../English',
      },
      {
        path: '/english/console?module=affixes',
        key: '/english/console?module=affixes',
        name: '词缀',
        component: '../English',
      },
      {
        path: '/english/console?module=speech',
        key: '/english/console?module=speech',
        name: '日常用语',
        component: '../English',
      },
      {
        path: '/store',
        name: '商品店铺',
        component: '../Store',
        hideInMenu: true,
      },
    ],
  },
  
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd apps/en && pnpm test -- props.test`
Expected: PASS

- [ ] **Step 7: Run the full suite to check for regressions**

Run: `cd apps/en && pnpm test`
Expected: PASS (all suites, including `English.test.tsx`, `theme.test.ts`, `table-layout.test.ts`, `EnglishIntro.test.tsx`)

- [ ] **Step 8: Commit**

```bash
cd apps/en
git add src/Router.tsx src/pages/Root/index.tsx src/pages/Root/props.tsx src/pages/Root/props.test.ts
git commit -m "feat(en): move admin console to /english/console"
```

---

### Task 3: Console "back to intro" button

**Files:**
- Modify: `apps/en/src/pages/English/index.tsx`
- Modify: `apps/en/src/pages/English/English.css`
- Test: `apps/en/src/pages/English/English.test.tsx`

**Interfaces:**
- Consumes: nothing new (uses the plain path string `/english`, already real as of Task 2).

- [ ] **Step 1: Add the failing assertion**

Edit `apps/en/src/pages/English/English.test.tsx`, add inside the existing `it(...)` block, after the last `expect`:

```tsx
    expect(screen.getByRole('link', { name: '返回介绍页' })).toHaveAttribute(
      'href',
      '/english',
    );
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/en && pnpm test -- English.test`
Expected: FAIL — unable to find role "link" with name "返回介绍页"

- [ ] **Step 3: Add the button**

Edit `apps/en/src/pages/English/index.tsx`:

```tsx
import { ConfigProvider, Button } from 'antd';
import { useSearchParams } from 'react-router-dom';
import Root from './Root';
import Affix from './Affix';
import LivingSpeech from './LivingSpeech';
import EnDesktopWords from '../EnDesktop/Words';
import EnDesktopLibraries from '../EnDesktop/Libraries';
import EnDesktopUsers from '../EnDesktop/Users';
import './English.css';
import { enTheme } from '../../theme/antdTheme';

const modules = {
  users: { label: '用户', content: <EnDesktopUsers /> },
  words: { label: '单词', content: <EnDesktopWords /> },
  libraries: {
    label: '词库',
    content: <EnDesktopLibraries />,
  },
  roots: { label: '词根', content: <Root /> },
  affixes: { label: '词缀', content: <Affix /> },
  speech: {
    label: '日常用语',
    content: <LivingSpeech />,
  },
} as const;

type ModuleKey = keyof typeof modules;

export default function English() {
  const [searchParams] = useSearchParams();
  const requestedModule = searchParams.get('module');
  const activeKey: ModuleKey =
    requestedModule && requestedModule in modules
      ? (requestedModule as ModuleKey)
      : 'users';
  const activeModule = modules[activeKey];

  return (
    <ConfigProvider theme={enTheme}>
      <section className="en-workbench">
        <main className="en-workbench-panel">
          <div className="en-workbench-panel-heading">
            <h2>{activeModule.label}</h2>
            <Button href="/english">返回介绍页</Button>
          </div>
          <div className="en-workbench-module">{activeModule.content}</div>
        </main>
      </section>
    </ConfigProvider>
  );
}
```

- [ ] **Step 4: Update the CSS**

Edit `apps/en/src/pages/English/English.css` — add `justify-content: space-between;` to `.en-workbench-panel-heading`:

```css
.en-workbench-panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/en && pnpm test -- English.test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd apps/en
git add src/pages/English/index.tsx src/pages/English/English.css src/pages/English/English.test.tsx
git commit -m "feat(en): add back-to-intro button in console"
```

---

### Task 4: Final verification

No file changes — this task confirms the three previous tasks work together end-to-end.

- [ ] **Step 1: Run the full test suite**

Run: `cd apps/en && pnpm test`
Expected: PASS, all suites (`EnglishIntro.test.tsx`, `props.test.ts`, `English.test.tsx`, `theme.test.ts`, `table-layout.test.ts`)

- [ ] **Step 2: Manual smoke check in a browser**

Start the dev server (`cd apps/en && pnpm dev`, note the printed port — `vite.config.ts` sets `port: 3389`) and check, at `http://localhost:3389/en/`:

1. Root `/en/` loads the intro page (hero text, two cards, footer beian text visible)
2. The 3 desktop download buttons and the QR code image render without broken-image icons
3. Clicking "进入控制台" navigates to `/en/english/console` and shows the admin console with its sidebar (用户/单词/词库/词根/词缀/日常用语) exactly as before this change
4. Clicking "返回介绍页" in the console navigates back to `/en/english` and shows the intro page again
5. Directly navigating to `/en/english/console?module=words` still deep-links into the "单词" module (regression check on existing behavior)
