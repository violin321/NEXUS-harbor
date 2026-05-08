# NEXUS Harbor

NEXUS Harbor 是一个基于 Next.js 16 的自托管服务入口与状态面板，包含首页导航、服务管理、系统状态展示，以及基于 Supabase 的后台登录。

## 环境变量

复制示例文件后按需填写：

```bash
cp .env.example .env.local
```

最少需要：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`

推荐额外配置：

- `ADMIN_EMAILS`：逗号分隔的管理员邮箱 allowlist
- `ADMIN_USER_IDS`：逗号分隔的管理员用户 ID allowlist
- `ALLOW_UNRESTRICTED_ADMIN`：本地临时开发逃生开关；默认 `false`，仅在未配置 allowlist 时显式设为 `true` 才允许所有已登录用户进入 admin
- `ALLOWED_DEV_ORIGINS`：开发环境来源白名单

`DATABASE_URL` 用于应用自己的 PostgreSQL 读写；示例格式可参考 `.env.example`，请按你的实际数据库实例填写。

管理员策略默认 **fail-closed**：公开/生产部署必须配置 `ADMIN_EMAILS` 和/或 `ADMIN_USER_IDS`。如果两者都为空，`/admin` 与对应 API 会拒绝访问；只有在本地临时调试时显式设置 `ALLOW_UNRESTRICTED_ADMIN=true`，才会放开给所有已登录用户。

## 开发启动

```bash
pnpm install
pnpm dev
```

默认访问：<http://localhost:3000>

## 数据库初始化

项目提供基础 SQL：

- `db/migrations/001_init.sql`：初始化业务表结构
- `db/seeds/demo.sql`：导入演示服务数据

可按顺序执行：

```bash
psql "$DATABASE_URL" -f db/migrations/001_init.sql
psql "$DATABASE_URL" -f db/seeds/demo.sql
```

## 生产构建

```bash
pnpm build
pnpm start
```

## 说明

- 应用名称已统一为 `nexus-harbor`
- 页面产品文案统一为 `NEXUS Harbor`
- PostgreSQL 连接已从硬编码迁移到统一配置层
- L3 script execution is disabled until sandbox worker design is implemented
