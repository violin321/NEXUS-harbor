# Configuration

NEXUS Harbor 通过环境变量驱动配置，适合本地开发、自托管部署和容器化运行。

## 必需环境变量

- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目地址
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：前端匿名访问 key
- `SUPABASE_SERVICE_ROLE_KEY`：服务端管理 key，仅服务端使用
- `DATABASE_URL`：应用使用的 PostgreSQL 连接串
- `NEXT_PUBLIC_SITE_URL`：站点外部访问地址

如果未提供 `DATABASE_URL`，数据库相关功能会直接报错，而不是回退到内置本机地址。

## 可选环境变量

- `ADMIN_EMAILS`：逗号分隔的管理员邮箱 allowlist，例如 `alice@example.com,bob@example.com`
- `ADMIN_USER_IDS`：逗号分隔的管理员用户 ID allowlist，用于邮箱不稳定或需要直接按用户 ID 授权的场景
- `DEMO_MODE`：服务端 demo mode 开关；启用后公开 dashboard / system status 返回 synthetic 数据
- `NEXT_PUBLIC_DEMO_MODE`：客户端可见的 demo mode 标记；仅用于渲染提示，不携带 secret
- `DEMO_READ_ONLY`：显式只读开关；未开启 `DEMO_MODE` 时也可用于预览环境禁写
- `ALLOW_UNRESTRICTED_ADMIN`：本地临时开发逃生开关；默认 `false`，只有在未配置 allowlist 时显式设为 `true` 才允许所有已登录用户进入 admin
- `ALLOWED_DEV_ORIGINS`：逗号分隔的开发来源白名单，例如：

```env
ALLOWED_DEV_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

默认值为空，表示不额外放行任何开发来源。

> 管理员策略默认 fail-closed。若 `ADMIN_EMAILS` 与 `ADMIN_USER_IDS` 都未配置，admin 受保护页面与接口会直接拒绝访问。生产/公开部署必须显式配置 `ADMIN_EMAILS` 和/或 `ADMIN_USER_IDS`；仅限本地临时调试时，可显式设置 `ALLOW_UNRESTRICTED_ADMIN=true` 作为逃生开关。

## 本地开发

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

## 数据库初始化

```bash
psql "$DATABASE_URL" -f db/migrations/001_init.sql
psql "$DATABASE_URL" -f db/seeds/demo.sql
```

`app_settings.system_status_public` 默认值为 `false`。如果你确实希望公开系统摘要信息，应在后台或数据库中显式打开。

## Public demo 安全边界

建议公开演示站使用：

```env
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
DEMO_READ_ONLY=true
```

在该模式下：

- `/api/dashboard` 返回 synthetic demo 数据，可脱离真实私有服务 URL 运行
- `/api/system-public` 返回 synthetic system status，不读取真实 host metrics / Docker 列表
- admin 写接口拒绝写入，避免演示环境误改配置
- `SUPABASE_SERVICE_ROLE_KEY` 仍仅限服务端使用，不应出现在任何 client-visible path

L3 script execution is disabled until sandbox worker design is implemented.
