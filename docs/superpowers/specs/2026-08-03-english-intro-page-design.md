# 英语产品介绍页 + 控制台分离设计

## 背景

`apps/en` 现在的 `/english` 路由直接渲染管理控制台（用户/单词/词库/词根/词缀/日常用语管理），没有对外的产品介绍页。需要新增一个介绍页，展示桌面端和小程序两个客户端的下载/获取方式，首页默认显示介绍页，介绍页和控制台之间可以互相跳转。

## 现状

- `Router.tsx`：`/` 重定向到 `/english`，`/english` 直接渲染 `<English />`（控制台）
- `Root.tsx`：`isEnglish = pathname === '/english'`，为真时套用深色 `ProLayout` 侧边栏（控制台专用 chrome），侧边栏 6 个模块菜单来自 `Root/props.tsx`，key 都是 `/english?module=X`
- `English/index.tsx`：控制台本体，`en-workbench-panel-heading` 里只有一个 `<h2>` 模块标题，没有其他按钮
- 桌面端安装包托管在 GitHub Release（`lihong0211/en-app`），当前最新 `v2.1.0` 三个资源：
  - `learn-english-2.1.0-arm.dmg`（Apple Silicon）
  - `learn-english-2.1.0-intel.dmg`（Intel Mac）
  - `learn-english-2.1.0.exe`（Windows）
- 小程序二维码：用户从微信公众平台小程序管理后台导出 PNG，手动提供

## 路由架构

介绍页和控制台拆成两个独立顶层路由，介绍页**不**套 `Root.tsx` 的 `ProLayout` chrome（完全独立的营销落地页布局）：

```
createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <Navigate to="/english" replace /> },
      { path: '/english/console', element: <English /> },
      { path: '/store', ... }, // 不变
      { path: '/test', ... },  // 不变
    ],
  },
  {
    path: '/english',
    element: <EnglishIntro />,
  },
], { basename: '/en' })
```

- 站点根路径 `/` 仍重定向到 `/english`，落到介绍页 → 满足"首页显示介绍页"
- `Root.tsx` 的 `isEnglish` 判断改为 `pathname === '/english/console'`；`englishLocation` 兜底值从 `/english?module=users` 改为 `/english/console?module=users`
- `Root/props.tsx` 六个菜单项的 `path`/`key` 从 `/english?module=X` 改为 `/english/console?module=X`
- `EnglishIntro` 自己的 `useEffect` 设置 `document.title`（因为不在 `Root.tsx` 下，不会继承它的标题副作用）

## 介绍页设计（`pages/EnglishIntro/index.tsx`）

单页布局，自上而下：

1. **顶部导航条**：站点名 + 右侧「进入控制台」按钮（`<Link to="/english/console">`）
2. **Hero 区**：产品名 + 一句话简介，背景用径向渐变 + 深色底（跟 `English.css` 里 `.en-workbench` 的渐变一致手法：`radial-gradient(... rgb(0 201 141 / 8%) ...)` + `#07090D` 底色）
3. **两张并排卡片**（响应式，窄屏堆叠）：
   - **桌面端卡片**：简介文案 + 3 个下载按钮：
     - Mac (Apple Silicon) → `https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0-arm.dmg`
     - Mac (Intel) → `https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0-intel.dmg`
     - Windows → `https://github.com/lihong0211/en-app/releases/download/v2.1.0/learn-english-2.1.0.exe`
   - **小程序卡片**：简介文案 + 二维码图片 `src/assets/mini-program-qrcode.png`（占位图先用，等真实图片替换）
4. **底部**：复用 `components/Footer.tsx`（备案号），介绍页是对外页面需要展示

样式：新建 `EnglishIntro.css`，颜色/字体直接引用 `theme/tokens.ts` 的 `enTokens`（`primary #00C98D`、`canvas #07090D`、`surface1/2` 等、`Plus Jakarta Sans` 字体），跟控制台共用同一套视觉语言，保证"风格统一"。

下载链接硬编码当前版本号，发新版本时需要手动更新——这是用户明确接受的权衡（备选方案是链接到 Release 列表页，不用维护但用户选了直链）。

## 控制台改动（`pages/English/index.tsx`）

`en-workbench-panel-heading` 里 `<h2>` 旁边加一个「返回介绍页」按钮，`<Link to="/english">`。

## 涉及文件

- `Router.tsx` — 路由拆分
- `pages/Root/index.tsx` — `isEnglish` 判断路径调整
- `pages/Root/props.tsx` — 菜单 key 路径调整
- `pages/English/index.tsx` — 加返回按钮
- 新增 `pages/EnglishIntro/index.tsx`
- 新增 `pages/EnglishIntro/EnglishIntro.css`
- 新增 `src/assets/mini-program-qrcode.png`（占位）

## 测试

- 手动验证：访问 `/en/`（站点根路径）落到介绍页；点「进入控制台」到 `/en/english/console`，侧边栏/模块切换跟改动前一致；控制台里点「返回介绍页」回到 `/en/english`
- 下载按钮/二维码图片手动点击核对能打开正确资源
- 现有测试（`English.test.tsx`、`table-layout.test.ts`）不受路由改动影响，跑一遍确认没有回归

## 范围外

- 不做小程序二维码的服务端动态生成（用户手动提供图片）
- 不做下载链接的自动跟随最新 Release 版本号（用户已知晓需要手动维护）
