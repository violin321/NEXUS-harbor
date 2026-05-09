# Deployment

本文档覆盖 Harbor 的本地开发、PM2 单机部署、Docker Compose 部署，以及放在 Nginx / Caddy 反向代理后的基本做法。

## 0. 前提

- Node.js 22+
- pnpm 10+
- PostgreSQL 16+（或兼容版本）
- Supabase 项目（用于登录与会话）

复制环境变量模板：

```bash
cp .env.example .env.local
```

生产环境建议单独维护 `.env.production`，不要把真实 secret 提交到仓库。

## 1. 环境变量说明

### 必填

- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：前端匿名 key
- `SUPABASE_SERVICE_ROLE_KEY`：服务端使用的高权限 key
- `DATABASE_URL`：应用自己的 PostgreSQL 连接串
- `NEXT_PUBLIC_SITE_URL`：站点对外访问地址，例如 `https://harbor.example.com`

### 推荐配置

- `ADMIN_EMAILS`：逗号分隔的管理员邮箱 allowlist
- `ADMIN_USER_IDS`：逗号分隔的管理员用户 ID allowlist
- `ALLOWED_DEV_ORIGINS`：本地开发来源白名单

### Public demo 配置

如需公开演示站，显式启用：

- `DEMO_MODE=true`
- `NEXT_PUBLIC_DEMO_MODE=true`
- `DEMO_READ_ONLY=true`

效果：

- 首页 dashboard 改用 synthetic demo 数据
- `/api/system-public` 返回 synthetic system status
- admin 写接口拒绝写入，演示站保持只读
- public demo 可运行，但不应映射到真实运维服务 URL

### 仅限本地临时调试

- `ALLOW_UNRESTRICTED_ADMIN=true`

默认策略是 fail-closed：如果没有配置 `ADMIN_EMAILS` / `ADMIN_USER_IDS`，admin 页面与接口会拒绝访问。公开部署不要依赖 `ALLOW_UNRESTRICTED_ADMIN`。

## 2. Local development

```bash
pnpm install
psql "$DATABASE_URL" -f db/migrations/001_init.sql
psql "$DATABASE_URL" -f db/seeds/demo.sql
pnpm dev
```

其中：

- `db/seeds/demo.sql` 面向本地开发 / 宿主机访问，默认使用 synthetic / example 命名的示例目标，不应被理解为真实私有服务地址。
- `db/seeds/demo-compose.sql` 面向 Docker Compose 演示环境，默认检测 `app` 容器内的 `/api/health`，公开链接使用 `https://demo.example.com` 这类安全示例地址。

默认访问：<http://localhost:3000>

## 3. PM2 单机部署

### 3.1 构建并启动 Web

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

如果要交给 PM2 托管，可以用最小配置：

```bash
pm2 start pnpm --name harbor-web -- start
pm2 save
```

### 3.2 Poller 部署

Poller 负责周期性写入 `check_results`，当前只执行 L0/L1/L2 检测，L3 仍保持禁用占位。

先安装依赖：

```bash
pnpm install --frozen-lockfile
```

可先做一次单次验证：

```bash
pnpm poller:once
```

确认数据库连接与 `service_checks` 配置正常后，再用 PM2 常驻：

```bash
pm2 start pm2.pollers.json
pm2 save
```

补充说明：

- `pm2.pollers.json` 通过 `pnpm poller:start` 启动。
- 默认轮询间隔 5 分钟，可用 `POLLER_INTERVAL_MS` 覆盖。
- 日志输出到 `./logs/poller-l2*.log`。

## 4. Docker Compose

项目提供 `Dockerfile` 与 `docker-compose.example.yml`。

### 4.1 准备环境变量

```bash
cp .env.example .env.compose
```

把占位值替换成真实配置，尤其是：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `DATABASE_URL`
- `ADMIN_EMAILS` / `ADMIN_USER_IDS`

然后把 compose 文件里的 `env_file` 指向你的实际文件，例如 `.env.compose`。

### 4.2 启动

```bash
docker compose -f docker-compose.example.yml up --build -d
```

Compose 示例包含：

- `app`：Next.js 生产容器
- `postgres`：本地 PostgreSQL，首次启动会自动执行 `db/migrations` 与 `db/seeds/demo-compose.sql`
- `poller`：可选 worker（通过 `--profile poller` 启用）

如果你已有外部数据库，可删除 `postgres` 服务，并把 `DATABASE_URL` 指向外部实例。

如需同时启动 poller：

```bash
docker compose -f docker-compose.example.yml --profile poller up --build -d
```

注意：Compose 示例默认使用容器网络可达的 demo seed，因此 poller 至少可以对 `app` 自身健康接口做一次可解释的绿色检查；如果你想复用宿主机场景的 `db/seeds/demo.sql`，需要同步把其中的目标地址改成你自己的可解析主机名或服务名。对于 public demo，更推荐直接启用 `DEMO_MODE=true`，让公开首页与状态接口完全走 synthetic 数据。

## 5. Reverse proxy

### Nginx

```nginx
server {
    listen 80;
    server_name harbor.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Caddy

```caddy
harbor.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

## 6. 发布后检查

至少确认以下项：

1. `pnpm build` 通过
2. 首页可访问
3. 登录流程可完成
4. admin allowlist 生效
5. `service_checks` 与 `check_results` 可正常读写
6. `system_status_public` 是否符合你的公开策略
7. 如为 public demo，确认 `DEMO_MODE=true` 且 demo 站不依赖真实私有服务 URL

## 7. 已知限制

- L3 script execution 仍未启用，当前仅支持到 L2 API 检测。
- Poller 依赖数据库可写权限；如只部署只读演示站，可不启用 `poller` profile。
