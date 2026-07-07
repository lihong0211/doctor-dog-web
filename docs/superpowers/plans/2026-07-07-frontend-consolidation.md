# Frontend Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge four independently-deployed frontend projects (`home-ali`, `blog`, `en-dashbord`, `ai-dashboard`) into one pnpm-workspace monorepo (`doctor-dog-web`), served under path prefixes on `doctor-dog.com` (`/`, `/blog`, `/en`, `/ai`) instead of separate subdomains.

**Architecture:** A single new git repo with `apps/home`, `apps/blog`, `apps/en`, `apps/ai` as pnpm workspace members. Each app keeps its original build tool (plain static HTML, VitePress, two independent Vite+React apps) — no shared code between them, so the workspace only unifies install/lockfile, not builds. A single Nginx `server` block for `doctor-dog.com` replaces the four subdomain blocks, routing by path prefix to each app's build output. `chinese-chess` stays in its own separate repo untouched; only its Nginx mount point moves from `ai.doctor-dog.com` to `/chess` on the main domain.

**Tech Stack:** pnpm workspaces, Vite, VitePress, React Router, Nginx.

## Global Constraints

- Backend (`service-ali`, `service-ali-go`, `service-home`) is out of scope — do not touch.
- `chinese-chess` source/repo is out of scope — only its deployment path changes (to `/chess`), covered in Task 6/7.
- Old subdomains (`en.`, `blog.`, `ai.doctor-dog.com`) are retired outright — no 301 redirects.
- Git history of the four source repos is **not** migrated — copy current file snapshots only; old repos (`home`, `blog`, `en`, `ai-dashboard` on GitHub) stay archived as-is.
- Source repos to copy from (do not modify them): `/Users/lihong/Desktop/personal/code/home-ali`, `/Users/lihong/Desktop/personal/code/blog`, `/Users/lihong/Desktop/personal/code/en-dashbord`, `/Users/lihong/Desktop/personal/code/ai-dashboard`.
- New repo root: `/Users/lihong/Desktop/personal/code/doctor-dog-web` (already `git init`'d, contains `docs/superpowers/specs/2026-07-07-frontend-consolidation-design.md`).

---

### Task 1: Scaffold the monorepo root

**Files:**
- Create: `/Users/lihong/Desktop/personal/code/doctor-dog-web/pnpm-workspace.yaml`
- Create: `/Users/lihong/Desktop/personal/code/doctor-dog-web/package.json`
- Create: `/Users/lihong/Desktop/personal/code/doctor-dog-web/.gitignore`

**Interfaces:**
- Produces: workspace root that Tasks 2-5 add packages into (`apps/*` glob), `pnpm --filter <name> <script>` convention used by later `dev:*`/`build` scripts.

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "doctor-dog-web",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev:home": "pnpm --filter home dev",
    "dev:blog": "pnpm --filter blog dev",
    "dev:en": "pnpm --filter en dev",
    "dev:ai": "pnpm --filter ai dev",
    "build": "pnpm -r --if-present run build"
  }
}
```

- [ ] **Step 3: Create root `.gitignore`**

```
node_modules
dist
.DS_Store
*.log
tsconfig.tsbuildinfo
.cursor/
```

- [ ] **Step 4: Create the `apps/` directory and verify the workspace is valid**

```bash
mkdir -p /Users/lihong/Desktop/personal/code/doctor-dog-web/apps
cd /Users/lihong/Desktop/personal/code/doctor-dog-web && pnpm install
```

Expected: exits 0 (no packages matched yet, that's fine — this just confirms `pnpm-workspace.yaml`/root `package.json` are valid and pnpm is available).

- [ ] **Step 5: Commit**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web
git add pnpm-workspace.yaml package.json .gitignore
git commit -m "chore: scaffold pnpm workspace root"
```

---

### Task 2: Migrate `home` app (static HTML, served at `/`)

**Files:**
- Create: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/home/` (copied from `home-ali`)
- Modify: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/home/package.json` (rename package)

**Interfaces:**
- Produces: `apps/home/index.html` served as-is at path `/` (no build step — Nginx Task 6 points `location = /` at this directory directly).

- [ ] **Step 1: Copy source files**

```bash
mkdir -p /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/home
rsync -a \
  --exclude='.git' --exclude='.DS_Store' --exclude='node_modules' \
  /Users/lihong/Desktop/personal/code/home-ali/ \
  /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/home/
```

- [ ] **Step 2: Rename the package**

Edit `apps/home/package.json`, change:
```json
  "name": "home-ali",
```
to:
```json
  "name": "home",
```

- [ ] **Step 3: Verify the app still serves correctly**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/home
python3 -m http.server 8091 &
SERVER_PID=$!
sleep 1
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8091/
kill $SERVER_PID
```

Expected: prints `200`.

- [ ] **Step 4: Commit**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web
git add apps/home
git commit -m "feat: migrate home app (static homepage) into monorepo"
```

---

### Task 3: Migrate `blog` app (VitePress, served at `/blog/`)

**Files:**
- Create: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/blog/` (copied from `blog`)
- Modify: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/blog/package.json` (rename package)
- Modify: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/blog/docs/.vitepress/config.ts:1` (add `base`)

**Interfaces:**
- Produces: `apps/blog/docs/.vitepress/dist` (build output) that Task 6's Nginx `location ^~ /blog/` serves.

- [ ] **Step 1: Copy source files (excluding build artifacts)**

```bash
mkdir -p /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/blog
rsync -a \
  --exclude='.git' --exclude='.DS_Store' --exclude='node_modules' \
  --exclude='docs/.vitepress/dist' --exclude='docs/.vitepress/cache' \
  /Users/lihong/Desktop/personal/code/blog/ \
  /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/blog/
```

- [ ] **Step 2: Rename the package**

Edit `apps/blog/package.json`, change:
```json
  "name": "vitepress-project",
```
to:
```json
  "name": "blog",
```

- [ ] **Step 3: Set the VitePress base path**

Edit `apps/blog/docs/.vitepress/config.ts`, replace the entire file content:
```ts
import { defineConfig } from 'vitepress'

// https://vitepress.vuejs.org/config/app-configs
export default defineConfig({
  base: '/blog/',
})
```

- [ ] **Step 4: Install deps and build**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web
pnpm install
pnpm --filter blog build
```

Expected: build succeeds, `apps/blog/docs/.vitepress/dist/index.html` exists and its `<script>`/`<link>` tags reference `/blog/assets/...` paths (confirms base path took effect).

```bash
grep -o '/blog/assets/[^"]*' /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/blog/docs/.vitepress/dist/index.html | head -3
```

Expected: prints at least one `/blog/assets/...` path.

- [ ] **Step 5: Commit**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web
git add apps/blog
git commit -m "feat: migrate blog app (VitePress) into monorepo, serve under /blog/"
```

---

### Task 4: Migrate `en` app (Vite+React, served at `/en/`)

**Files:**
- Create: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/en/` (copied from `en-dashbord`)
- Modify: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/en/package.json` (rename package)
- Modify: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/en/vite.config.ts:8` (`base`)
- Modify: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/en/src/Router.tsx` (router `basename`)

**Interfaces:**
- Produces: `apps/en/dist` (build output) that Task 6's Nginx `location ^~ /en/` serves.
- Consumes: none (API calls in this app already hit the absolute `https://api.doctor-dog.com` origin in production — see `src/request/index.ts`, unaffected by this migration).

- [ ] **Step 1: Copy source files (excluding build artifacts)**

```bash
mkdir -p /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/en
rsync -a \
  --exclude='.git' --exclude='.DS_Store' --exclude='node_modules' --exclude='dist' \
  /Users/lihong/Desktop/personal/code/en-dashbord/ \
  /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/en/
```

- [ ] **Step 2: Rename the package**

Edit `apps/en/package.json`, change:
```json
  "name": "doctor-dog",
```
to:
```json
  "name": "en",
```

- [ ] **Step 3: Set the Vite base path**

Edit `apps/en/vite.config.ts`, change:
```ts
export default defineConfig({
  base: '/',
```
to:
```ts
export default defineConfig({
  base: '/en/',
```

- [ ] **Step 4: Set the router basename**

Edit `apps/en/src/Router.tsx`, change the end of the file from:
```ts
],{
  basename: '/'
});
```
to:
```ts
],{
  basename: '/en'
});
```

- [ ] **Step 5: Install deps and build**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web
pnpm install
pnpm --filter en build
```

Expected: build succeeds (`tsc && vite build`), `apps/en/dist/index.html` exists.

```bash
grep -o '/en/assets/[^"]*' /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/en/dist/index.html | head -3
```

Expected: prints at least one `/en/assets/...` path.

- [ ] **Step 6: Commit**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web
git add apps/en
git commit -m "feat: migrate en app (Vite+React) into monorepo, serve under /en/"
```

---

### Task 5: Migrate `ai` app (Vite+React, served at `/ai/`)

**Files:**
- Create: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/ai/` (copied from `ai-dashboard`)
- Modify: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/ai/package.json` (rename package)
- Modify: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/ai/vite.config.ts:4` (`base`)
- Modify: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/ai/src/App.tsx:10` (router `basename`)
- Modify: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/ai/src/pages/Portal.tsx:73` (hardcoded absolute path)
- Modify: `/Users/lihong/Desktop/personal/code/doctor-dog-web/apps/ai/src/pages/ImageGenerate.tsx:11` (hardcoded absolute paths)

**Interfaces:**
- Produces: `apps/ai/dist` (build output) that Task 6's Nginx `location ^~ /ai/` serves.
- Consumes: none (most API calls in this app already hit absolute origins like `https://home.doctor-dog.com` in production — see `src/service/*.ts`, unaffected by this migration).

- [ ] **Step 1: Copy source files (excluding build artifacts)**

```bash
mkdir -p /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/ai
rsync -a \
  --exclude='.git' --exclude='.DS_Store' --exclude='node_modules' --exclude='dist' \
  --exclude='.cursor' --exclude='tsconfig.tsbuildinfo' \
  /Users/lihong/Desktop/personal/code/ai-dashboard/ \
  /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/ai/
```

- [ ] **Step 2: Rename the package**

Edit `apps/ai/package.json`, change:
```json
  "name": "ai-dashboard",
```
to:
```json
  "name": "ai",
```

- [ ] **Step 3: Set the Vite base path**

Edit `apps/ai/vite.config.ts`, change:
```ts
export default defineConfig({
  plugins: [react()],
```
to:
```ts
export default defineConfig({
  base: '/ai/',
  plugins: [react()],
```

- [ ] **Step 4: Set the router basename**

Edit `apps/ai/src/App.tsx`, change:
```tsx
    <BrowserRouter>
```
to:
```tsx
    <BrowserRouter basename="/ai">
```

- [ ] **Step 5: Fix hardcoded absolute path in `Portal.tsx`**

Edit `apps/ai/src/pages/Portal.tsx`, change:
```tsx
        src="/portal.html"
```
to:
```tsx
        src={`${import.meta.env.BASE_URL}portal.html`}
```

- [ ] **Step 6: Fix hardcoded absolute paths in `ImageGenerate.tsx`**

Edit `apps/ai/src/pages/ImageGenerate.tsx`, change:
```ts
const MD_URLS = ['/docs/code-1.md', '/docs/code-2.md'] as const
```
to:
```ts
const MD_URLS = ['docs/code-1.md', 'docs/code-2.md'].map(
  (p) => `${import.meta.env.BASE_URL}${p}`,
)
```

- [ ] **Step 7: Confirm no other hardcoded root-absolute references remain**

```bash
grep -rnE "(src|href)=\{?['\"\`]/[^/]" /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/ai/src --include="*.tsx" --include="*.ts"
grep -rn "fetch('/" /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/ai/src --include="*.tsx" --include="*.ts"
```

Expected: no output from either command (the two known hits from Steps 5-6 are now fixed).

- [ ] **Step 8: Install deps and build**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web
pnpm install
pnpm --filter ai build
```

Expected: build succeeds (`tsc -b && vite build`), `apps/ai/dist/index.html` exists.

```bash
grep -o '/ai/assets/[^"]*' /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/ai/dist/index.html | head -3
```

Expected: prints at least one `/ai/assets/...` path.

- [ ] **Step 9: Commit**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web
git add apps/ai
git commit -m "feat: migrate ai app (Vite+React) into monorepo, serve under /ai/"
```

---

### Task 6: Write the unified Nginx config

**Files:**
- Create: `/Users/lihong/Desktop/personal/code/doctor-dog-web/deploy/nginx/doctor-dog.com.conf`

**Interfaces:**
- Consumes: build output paths from Tasks 2-5 (`apps/home`, `apps/blog/docs/.vitepress/dist`, `apps/en/dist`, `apps/ai/dist`), mapped in Task 7's deploy script to the server-side directories referenced below (`/lihong/home`, `/lihong/blog/...`, `/lihong/en/dist`, `/lihong/ai/dist`, `/lihong/chinese-chess/dist`).

- [ ] **Step 1: Create the Nginx config**

```bash
mkdir -p /Users/lihong/Desktop/personal/code/doctor-dog-web/deploy/nginx
```

Create `deploy/nginx/doctor-dog.com.conf`:
```nginx
server {
    listen       443 ssl;
    server_name  doctor-dog.com;

    ssl_certificate cert/doctor-dog.com.pem;
    ssl_certificate_key cert/doctor-dog.com.key;

    location = / {
        root /lihong/home;
        try_files /index.html =404;
        expires -1;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # mini OSS：静态资源托管，支持跨域（不变）
    location ^~ /static/ {
        alias /lihong/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin  "*" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept" always;
        if ($request_method = 'OPTIONS') {
            return 204;
        }
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

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   html;
    }
}
```

- [ ] **Step 2: Validate the config syntax locally**

`nginx -t` also checks that files referenced by `ssl_certificate`/`ssl_certificate_key` actually exist and load, so generate throwaway dummy certs at the same relative path the config expects (`cert/doctor-dog.com.pem` / `.key`, resolved relative to Nginx's `/etc/nginx` prefix) before running the check:

```bash
mkdir -p /tmp/doctor-dog-nginx-test/cert
openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
  -keyout /tmp/doctor-dog-nginx-test/cert/doctor-dog.com.key \
  -out /tmp/doctor-dog-nginx-test/cert/doctor-dog.com.pem \
  -subj "/CN=doctor-dog.com" 2>/dev/null

docker run --rm \
  -v /Users/lihong/Desktop/personal/code/doctor-dog-web/deploy/nginx/doctor-dog.com.conf:/etc/nginx/conf.d/doctor-dog.com.conf:ro \
  -v /tmp/doctor-dog-nginx-test/cert:/etc/nginx/cert:ro \
  nginx:stable nginx -t
```

Expected: `nginx: configuration file /etc/nginx/nginx.conf test is successful` (this only validates the syntax and file references of the new block in isolation — other server blocks like `api.doctor-dog.com` aren't part of this test. If Docker isn't available locally, skip this step and rely on `nginx -t` on the actual server after deploying, noted in Task 9 Step 5).

- [ ] **Step 3: Commit**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web
git add deploy/nginx/doctor-dog.com.conf
git commit -m "feat: add unified nginx config for path-based routing"
```

---

### Task 7: Write the deploy script

**Files:**
- Create: `/Users/lihong/Desktop/personal/code/doctor-dog-web/deploy/deploy.sh`

**Interfaces:**
- Consumes: `pnpm -r --if-present run build` (Task 1's root script), build output paths from Tasks 2-5.
- Requires at runtime: `DEPLOY_HOST` environment variable (e.g. `user@1.2.3.4`) pointing at the Aliyun ECS host — the script errors out immediately if it's unset rather than silently doing the wrong thing.

- [ ] **Step 1: Create the deploy script**

```bash
mkdir -p /Users/lihong/Desktop/personal/code/doctor-dog-web/deploy
```

Create `deploy/deploy.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST to the target ssh host, e.g. user@1.2.3.4}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Building all apps"
cd "$ROOT_DIR"
pnpm -r --if-present run build

echo "==> Syncing home"
rsync -avz --delete "$ROOT_DIR/apps/home/" "$DEPLOY_HOST:/lihong/home/"

echo "==> Syncing blog"
rsync -avz --delete "$ROOT_DIR/apps/blog/docs/.vitepress/dist/" "$DEPLOY_HOST:/lihong/blog/docs/.vitepress/dist/"

echo "==> Syncing en"
rsync -avz --delete "$ROOT_DIR/apps/en/dist/" "$DEPLOY_HOST:/lihong/en/dist/"

echo "==> Syncing ai"
rsync -avz --delete "$ROOT_DIR/apps/ai/dist/" "$DEPLOY_HOST:/lihong/ai/dist/"

echo "==> Reloading nginx"
ssh "$DEPLOY_HOST" "sudo nginx -t && sudo nginx -s reload"

echo "==> Done"
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x /Users/lihong/Desktop/personal/code/doctor-dog-web/deploy/deploy.sh
```

- [ ] **Step 3: Verify it fails fast without `DEPLOY_HOST`**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web
unset DEPLOY_HOST
./deploy/deploy.sh; echo "exit code: $?"
```

Expected: exits non-zero immediately with `Set DEPLOY_HOST to the target ssh host, e.g. user@1.2.3.4` — confirms it doesn't proceed to build/sync with an unset target.

- [ ] **Step 4: Commit**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web
git add deploy/deploy.sh
git commit -m "feat: add deploy script (build all + rsync + nginx reload)"
```

---

### Task 8: Root README

**Files:**
- Create: `/Users/lihong/Desktop/personal/code/doctor-dog-web/README.md`

- [ ] **Step 1: Write the README**

```markdown
# doctor-dog-web

Monorepo for the doctor-dog.com frontend properties, previously split across
separate subdomains and separate repos. Backend services
(`service-ali`, `service-ali-go`, `service-home`) are not part of this repo.

## Apps

| App          | Path     | Stack              | Source of origin |
|--------------|----------|---------------------|-------------------|
| `apps/home`  | `/`      | Static HTML          | `home-ali`        |
| `apps/blog`  | `/blog/` | VitePress             | `blog`            |
| `apps/en`    | `/en/`   | Vite + React          | `en-dashbord`     |
| `apps/ai`    | `/ai/`   | Vite + React          | `ai-dashboard`    |

`chinese-chess` is a separate, independently-maintained repo mounted at
`/chess` — see `deploy/nginx/doctor-dog.com.conf`. It is not part of this
monorepo.

## Development

```bash
pnpm install
pnpm dev:home   # or dev:blog / dev:en / dev:ai
```

## Build & deploy

```bash
pnpm build                          # builds every app
DEPLOY_HOST=user@1.2.3.4 ./deploy/deploy.sh   # build + rsync + nginx reload
```

See `deploy/nginx/doctor-dog.com.conf` for the Nginx routing config that
needs to be in place on the server (replaces the old per-subdomain configs
for `en.`, `blog.`, `ai.doctor-dog.com` — those subdomains are retired).
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web
git add README.md
git commit -m "docs: add root README"
```

---

### Task 9: End-to-end local verification

**Files:** none (verification only)

- [ ] **Step 1: Build every app from a clean state**

```bash
cd /Users/lihong/Desktop/personal/code/doctor-dog-web
rm -rf apps/blog/docs/.vitepress/dist apps/en/dist apps/ai/dist
pnpm install
pnpm build
```

Expected: all three build commands succeed; `apps/blog/docs/.vitepress/dist/index.html`, `apps/en/dist/index.html`, `apps/ai/dist/index.html` all exist afterward.

- [ ] **Step 2: Simulate path-based routing locally with a throwaway Nginx container**

```bash
cat > /tmp/doctor-dog-local.conf <<'EOF'
server {
    listen 8090;

    location = / {
        root /srv/home;
        try_files /index.html =404;
    }
    location ^~ /blog/ {
        alias /srv/blog/;
        try_files $uri $uri/ /blog/index.html;
    }
    location ^~ /en/ {
        alias /srv/en/;
        try_files $uri $uri/ /en/index.html;
    }
    location ^~ /ai/ {
        alias /srv/ai/;
        try_files $uri $uri/ /ai/index.html;
    }
}
EOF

docker run --rm -d --name doctor-dog-local -p 8090:8090 \
  -v /tmp/doctor-dog-local.conf:/etc/nginx/conf.d/default.conf:ro \
  -v /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/home:/srv/home:ro \
  -v /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/blog/docs/.vitepress/dist:/srv/blog:ro \
  -v /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/en/dist:/srv/en:ro \
  -v /Users/lihong/Desktop/personal/code/doctor-dog-web/apps/ai/dist:/srv/ai:ro \
  nginx:stable
```

- [ ] **Step 3: Walk the checklist in a browser**

Open `http://localhost:8090/` and check:
- `/` — home page loads, images/favicon load (from the external `/static/` host, unaffected by this change)
- `/blog/` — VitePress nav and pages load, assets resolve (no 404s in Network tab under `/blog/assets/...`)
- `/en/` — app loads, `english` / `business-data` / `store` sub-routes navigate correctly, API calls in Network tab go to `https://api.doctor-dog.com/...`
- `/ai/` — app loads, `hub` / `models` / `experience` / `skills` / `portal` routes work; specifically open **Portal** (uses the `Portal.tsx` fix) and the **ImageGenerate** page's reference markdown viewer (uses the `ImageGenerate.tsx` fix) and confirm both load content with no 404s in Network tab

- [ ] **Step 4: Tear down**

```bash
docker stop doctor-dog-local
```

- [ ] **Step 5: Record deployment follow-up**

This step is a reminder, not code: once `DEPLOY_HOST` and server access are confirmed with the user, run `deploy/deploy.sh`, then on the server replace the four old subdomain server blocks (`en.`, `blog.`, `ai.doctor-dog.com`, and the static-file part of the apex `doctor-dog.com` block) with `deploy/nginx/doctor-dog.com.conf`, update the `chinese-chess` location include to mount at `/chess` per that repo's own instructions, run `nginx -t` on the real server, then `nginx -s reload`. Verify the same checklist from Step 3 against the live `https://doctor-dog.com`.
