# 前端项目整合设计

## 背景

目前 doctor-dog.com 下有多个独立部署的前端项目，各用一个子域名，分别对应一台 Aliyun ECS 上 Nginx 的一个 `server` block：

- `doctor-dog.com`（apex）→ `home-ali`（纯静态 HTML 个人主页）
- `blog.doctor-dog.com` → `blog`（VitePress 文档站）
- `en.doctor-dog.com` → `en-dashbord`（Vite + React SPA：英语学习 / 数据看板 / 商城 demo）
- `ai.doctor-dog.com` → `ai-dashboard`（Vite + React SPA：AI 工具集），同时用 Nginx `include` 挂了一个独立子项目 `chinese-chess`
- `api.doctor-dog.com` / `home.doctor-dog.com` → 反向代理到后端服务（Python / Go / 家庭服务器），**本次不动**

四个前端项目各自是独立 git 仓库（`home`、`blog`、`en`、`ai-dashboard`），没有统一仓库管理，也没有 CI/CD，部署方式是手动/脚本把构建产物传到服务器对应目录。

目标：把这四个前端项目整合到一个仓库里，用统一域名 `doctor-dog.com` 加路径区分（`/`、`/blog`、`/en`、`/ai`），不再用子域名。`chinese-chess` 是有独立 SOP 的项目，本次不迁移代码，只处理它的路由挂载（改挂到 `/chess`）。后端服务完全不动。

## 范围

**包含：**
- 新建仓库 `doctor-dog-web`，用 pnpm workspace 管理 `home-ali`、`blog`、`en-dashbord`、`ai-dashboard` 四个子应用
- 四个子应用的 base path / 路由 basename 改造，让它们能在子路径下正常工作
- 统一的 Nginx 配置（用一个 `doctor-dog.com` server block 替换四个子域名 server block），外加 `chinese-chess` 的 `/chess` 路由挂载
- 简单的构建 + 部署脚本

**不包含：**
- 后端（`service-ali` / `service-ali-go` / `service-home`）的任何改动
- `chinese-chess` 项目代码本身的改动（只动路由挂载方式）
- CI/CD 自动化（本次仍是脚本手动触发部署）
- 旧子域名的兼容重定向（用户已决定直接下线旧子域名，不做 301）
- 旧仓库（`home`、`blog`、`en`、`ai-dashboard`）历史 git 记录的合并（直接拷贝当前代码快照，旧仓库归档不再更新）

## 仓库结构

新仓库位置：`/Users/lihong/Desktop/personal/code/doctor-dog-web`，与其他项目同级目录。

```
doctor-dog-web/
├── pnpm-workspace.yaml
├── package.json              # 根目录脚本：dev:home / dev:blog / dev:en / dev:ai / deploy
├── apps/
│   ├── home/                  # 来自 home-ali，静态 html，挂 /
│   ├── blog/                   # 来自 blog，vitepress，挂 /blog/
│   ├── en/                     # 来自 en-dashbord，vite+react，挂 /en/
│   └── ai/                     # 来自 ai-dashboard，vite+react，挂 /ai/
├── deploy/
│   ├── nginx/doctor-dog.com.conf   # 新的统一 nginx 配置，受控进仓库，作为服务器配置的参考/同步源
│   └── deploy.sh                   # 构建全部子应用 + 同步产物到服务器
└── README.md
```

`apps/*` 各自保留原来的构建工具和 `package.json`（VitePress / Vite 各自的 config），用 `pnpm-workspace.yaml` 声明为 workspace 成员，这样根目录一次 `pnpm install` 能装完所有依赖，一份 lockfile。四个子应用之间没有共享代码/依赖，不引入 Turborepo / Nx 等构建编排工具。

`chinese-chess` 不放进 `apps/`，保持独立仓库和独立开发流程不变。

## 各子应用改动点

从"子域名根路径"迁移到"主域名子路径"后，任何硬编码的绝对路径（`base`、路由 `basename`、写死的 `/xxx.png` 式引用）都需要重新核对，这是本次改造最容易出错的地方。

### home（原 home-ali）
无需改动。继续部署在根路径 `/`；页面里的图片/favicon 已经通过独立的静态资源 host（`/static/` alias，CORS 开放）引用绝对域名 URL，跟本次路径改造无关。

### blog
`docs/.vitepress/config.ts` 目前是空配置，需要加：
```ts
export default defineConfig({
  base: '/blog/',
})
```

### en（原 en-dashbord）
- `vite.config.ts` 加 `base: '/en/'`
- `src/Router.tsx` 里 `createBrowserRouter(routes, { basename: '/' })` 的 `basename` 改成 `'/en'`
- API 请求（`src/request/index.ts`）已经在生产环境写死绝对域名 `https://api.doctor-dog.com`，不受路径改造影响，无需改动

### ai（原 ai-dashboard）
- `vite.config.ts` 加 `base: '/ai/'`
- `src/App.tsx` 里 `<BrowserRouter>` 加 `basename="/ai"`
- 大部分 API 请求（`src/service/*.ts`）生产环境已写死绝对域名（如 `https://home.doctor-dog.com`），不受影响
- 发现一处硬编码根路径引用需要修复：`src/pages/Portal.tsx:73` 的 `src="/portal.html"`，挂到 `/ai/` 子路径下会 404，需要改成 `` src={`${import.meta.env.BASE_URL}portal.html`} ``
- 实现阶段需要对该应用的 `src/` 和 `public/` 引用做一次全量搜索（`grep` 形如 `"/xxx"` 的字符串字面量），确认没有遗漏类似的写死根路径引用

## Nginx 改造

用一个 `doctor-dog.com` server block 替换掉四个子域名的 server block（`en.` / `blog.` / `ai.` 三个直接下线，apex 的 `doctor-dog.com` server block 保留并扩展）：

```nginx
server {
    listen 443 ssl;
    server_name doctor-dog.com;

    ssl_certificate cert/doctor-dog.com.pem;
    ssl_certificate_key cert/doctor-dog.com.key;

    location = / {
        root /lihong/home;
        try_files /index.html =404;
        expires -1;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # mini OSS 静态资源托管，保持不变
    location ^~ /static/ {
        alias /lihong/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept" always;
        if ($request_method = 'OPTIONS') { return 204; }
    }

    location ^~ /blog/ {
        alias /lihong/blog/docs/.vitepress/dist/;
        try_files $uri $uri/ /blog/index.html;
    }

    location ^~ /en/ {
        alias /lihong/en/dist/;
        try_files $uri $uri/ /en/index.html;
    }

    location ^~ /ai/ {
        alias /lihong/ai/dist/;
        try_files $uri $uri/ /ai/index.html;
    }

    location ^~ /chess/ {
        alias /lihong/chinese-chess/dist/;
        try_files $uri $uri/ /chess/index.html;
    }

    location ~ \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

`api.doctor-dog.com`、`home.doctor-dog.com` 两个后端反代 server block 保持完全不变。`en.doctor-dog.com`、`blog.doctor-dog.com`、`ai.doctor-dog.com` 三个 server block 直接删除，不做 301 重定向兼容。

## 部署流程

现状：无 CI，手动/脚本把 `dist` 传到服务器对应目录。

整合后 `deploy/deploy.sh` 的流程：
1. 根目录执行 `pnpm -r --if-present run build`，依次构建 `apps/*` 里每个子应用（`home` 是纯静态文件，没有 `build` 脚本，`--if-present` 让它被跳过而不报错）
2. 把各自构建产物同步（rsync）到服务器对应目录：
   - `apps/home` → `/lihong/home`
   - `apps/blog/docs/.vitepress/dist` → `/lihong/blog/docs/.vitepress/dist`
   - `apps/en/dist` → `/lihong/en/dist`
   - `apps/ai/dist` → `/lihong/ai/dist`
3. 提示（或由脚本通过 ssh 触发）执行 `nginx -s reload` 让新配置生效

脚本里服务器地址、ssh 密钥等具体连接方式在实现阶段由用户补充，设计阶段先留一个可配置的框架（环境变量或脚本顶部的配置项）。

## 验证方式

没有自动化测试，验证手段是：
1. 本地 `pnpm -r build` 全部子应用构建成功，无报错
2. 本地起一个静态文件服务器（或本地跑一份修改后的 Nginx 配置）模拟路径挂载，人工走一遍：
   - `/` 首页正常
   - `/blog` 文档站导航、静态资源正常
   - `/en` 的英语学习 / 数据看板 / 商城 各子路由正常，接口请求正常（浏览器 network 面板确认打到 `api.doctor-dog.com`）
   - `/ai` 各功能页正常，尤其是 Portal 页面（验证刚才发现的硬编码路径已修复），接口请求正常（打到 `home.doctor-dog.com`）
   - `/chess` 能正常进入
3. 部署到生产环境后，对照上面同一份检查清单在线上再走一遍
