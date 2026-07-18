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
`/chess` — see `deploy/nginx/nginx.conf`. It is not part of this
monorepo.

## Development

```bash
pnpm install
pnpm dev:home   # or dev:blog / dev:en / dev:ai
```

## Build & deploy

The server keeps its own git checkout of this repo, and Nginx serves each
app's `dist/` directly from it (see `deploy/nginx/nginx.conf`). Deploying
means: SSH in, `git pull`, rebuild — no rsync involved.

```bash
cp deploy/.env.example deploy/.env  # fill in DEPLOY_HOST / DEPLOY_USER / DEPLOY_PASSWORD / DEPLOY_PATH
./deploy/deploy.sh                  # ssh + git pull + pnpm install + pnpm build, on the server
```

Requires `sshpass` and `timeout`/`gtimeout` locally (`brew install sshpass coreutils`).
Push your local commits to `origin` before running it — the script only
pulls on the server, it never pushes for you.

See `deploy/nginx/nginx.conf` for the Nginx routing config that
needs to be in place on the server (replaces the old per-subdomain configs
for `en.`, `blog.`, `ai.doctor-dog.com` — those subdomains are retired).

**First-time deploy only:** `deploy.sh` does not modify the server's Nginx
site config. Before running it for the first time, manually place
`deploy/nginx/nginx.conf` on the server and remove the old
`en.`, `blog.`, and `ai.doctor-dog.com` subdomain server blocks (and the
static-file-serving part of the old apex `doctor-dog.com` block), then run
`nginx -t` on the server to confirm the new config is valid, then reload
it manually (`nginx -s reload`) — `deploy.sh` itself never touches or
reloads Nginx.
