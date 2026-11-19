# 电影知识图谱生产发布

正式入口为 `https://doctor-dog.com/ai/skills/knowledge-graph`。前端静态资源由云服务器 Nginx 读取，后端仍在本机运行，经 FRP 映射为云服务器的 `127.0.0.1:6000`。

## 配置与鉴权

- 本地开发从仓库根目录 `.env` 读取 `KG_API_KEY`，由 Vite 代理添加请求头。
- 仓库内 `.env.production` 持久配置非敏感开关 `KG_PROXY_AUTH_ENABLED=true`，正常 `pnpm build` 和后续 `deploy.sh` 重建均可保持自动连接。开关只决定自动连接，不包含密钥，也不依赖构建机持有密钥。
- KG 请求使用同源 `/ai/kg/*`。其他业务 API 的默认地址保持不变。
- 生产 Nginx 从 `/lihong/secure/doctor-dog-kg-headers.conf` 读取私有请求头配置。该文件由服务器管理员创建，位于 Git 仓库外，权限为仅 root 可读；内容是一条 `proxy_set_header X-API-Key` 指令，值与后端 `KG_API_KEY` 相同。
- 路由配置同样部署到 Git 目录外的 `/lihong/secure/doctor-dog-kg.locations.conf`，由 Nginx server 引用。发布时从已审核的 `deploy/nginx/kg-proxy.locations.conf` 上传到该路径，避免新文件提前放入线上 Git 工作目录后阻碍更新。
- 不将实际密钥写进源码、构建开关、Nginx 公共模板或发布日志。避免输出完整 `nginx -T`，因为展开的配置可能包含私有 include。

`deploy/nginx/kg-proxy.locations.conf` 只允许以下接口：

| 路径 | 允许的方法 |
| --- | --- |
| `/ai/kg/overview` | GET |
| `/ai/kg/graph` | GET |
| `/ai/kg/search` | POST |
| `/ai/kg/merge` | POST |
| `/ai/kg/answer` | POST |

Nginx 的 GET 限制同时允许 HEAD；后端决定是否支持 HEAD。未列出的 `/ai/kg/` 路径（包括 `ingest`）一律返回 404。五个精确路径优先于原有 `/ai/` SPA 前缀，避免 API 返回 HTML。

## 发布顺序

1. 从已审核提交创建隔离发布目录，保留原工作区中的其他改动。确认本地后端和 FRP 正常运行。
2. 在服务器备份当前前端提交和实际 Nginx 配置，创建私有头配置文件。将隔离发布目录的 `deploy/nginx/kg-proxy.locations.conf` 上传为 `/lihong/secure/doctor-dog-kg.locations.conf`，不要提前写入线上 Git 工作目录。只在实际 `doctor-dog.com` TLS server 内新增该外部文件的 include，避免用仓库模板覆盖整份线上配置。
3. 执行 `nginx -t`，通过后 reload。先验证同源 `overview` 返回 JSON；无密钥直连后端仍应返回 401，`/ai/kg/ingest` 返回 404，错误方法被拒绝。
4. 在隔离目录本地执行 `KG_PROXY_AUTH_ENABLED=true pnpm --filter ai build`，并运行 `pnpm --filter ai test`。服务器不构建，其他应用的 dist 保持不变。
5. 扫描构建产物确认没有实际密钥。提交并推送发布版本，再由服务器更新到指定提交，保留其余应用和服务器私有文件。
6. 验证页面自动连接、真实图谱统计、检索问答和浏览器控制台；检查新静态资源可访问，保存截图与发布前后提交记录。

## 回滚

保留发布前的已知正常提交和 Nginx 备份。需要回滚时，将线上工作目录恢复到已记录的前端提交，并根据实际故障恢复 Nginx 备份；每次配置恢复先 `nginx -t`，通过后再 reload。只回滚本次发布，不清理数据库、图谱、FRP 数据或服务器私有密钥文件。

如果取消服务器代理自动鉴权，将 `.env.production` 的开关设为 `false`，或用 `KG_PROXY_AUTH_ENABLED=false pnpm --filter ai build` 显式覆盖后发布，页面会回退手动连接。仅省略命令行开关不会覆盖生产默认值。静态前端不会自行读取服务器 `.env`。
