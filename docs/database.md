# Database

本文档只基于 `db/migrations/001_init.sql` 的真实结构说明当前数据库模型。

## 初始化

```bash
psql "$DATABASE_URL" -f db/migrations/001_init.sql
psql "$DATABASE_URL" -f db/seeds/demo.sql
```

迁移会先启用：

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

用于生成 UUID 默认值。

## 表结构概览

### 1. `service_checks`

服务检测定义表。

字段：

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `name TEXT NOT NULL`
- `url TEXT NOT NULL`
- `icon TEXT NOT NULL DEFAULT 'zap'`
- `group_name TEXT NOT NULL DEFAULT 'default'`
- `enabled BOOLEAN NOT NULL DEFAULT TRUE`
- `check_path TEXT NOT NULL DEFAULT '/'`
- `expected_status INTEGER NOT NULL DEFAULT 200`
- `public_url TEXT`
- `link_label TEXT NOT NULL DEFAULT '访问'`
- `check_level INTEGER NOT NULL DEFAULT 1`
- `api_config JSONB`
- `script_content TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

用途说明：

- 记录每个被监控服务的基础信息与展示信息
- `check_level` 区分检测深度
- `api_config` 预留结构化 API 检测配置
- `script_content` 目前仅是字段预留，不代表生产中已启用脚本执行能力

### 2. `check_results`

服务检测结果表。

字段：

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `service_id UUID NOT NULL REFERENCES service_checks(id) ON DELETE CASCADE`
- `latency_ms INTEGER`
- `status_code INTEGER NOT NULL DEFAULT 0`
- `ok BOOLEAN NOT NULL DEFAULT FALSE`
- `error_message TEXT`
- `checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

索引：

```sql
CREATE INDEX IF NOT EXISTS idx_check_results_service_checked_at
  ON check_results(service_id, checked_at DESC);
```

用途说明：

- 保存每次检测的结果快照
- 与 `service_checks` 通过 `service_id` 关联
- 删除某个服务时，其历史检测结果会级联删除

### 3. `app_settings`

应用级键值配置表。

字段：

- `key TEXT PRIMARY KEY`
- `value TEXT NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

初始化数据：

```sql
INSERT INTO app_settings (key, value)
VALUES ('system_status_public', 'false')
ON CONFLICT (key) DO NOTHING;
```

当前已知用途：

- `system_status_public`：控制系统状态摘要是否公开，默认 `false`

### 4. `user_profiles`

用户资料表。

字段：

- `user_id UUID PRIMARY KEY`
- `display_name TEXT`
- `avatar_url TEXT`
- `github_username TEXT`
- `preferences JSONB NOT NULL DEFAULT '{"theme":"system"}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

用途说明：

- 存放用户的展示资料与偏好设置
- 当前默认偏好包含 `theme=system`

## 表关系

```text
service_checks (1) ---- (N) check_results
```

- `check_results.service_id` 外键指向 `service_checks.id`
- 其他两张表目前独立，不直接声明外键关系

## Seeds

- `db/seeds/demo.sql`：面向本地开发 / 宿主机访问，示例目标默认是 `127.0.0.1`。
- `db/seeds/demo-compose.sql`：面向 Docker Compose 演示环境，默认检测 `app` 容器的 `/api/health`，避免容器网络内对宿主机回环地址探测失败。

生产环境是否执行 seed，应由部署方自行决定。

## 运维建议

- 公开仓库不要提交真实数据库连接串
- 正式环境建议定期清理 `check_results` 历史数据，避免结果表无限增长
- 如果后续引入更多配置项，优先复用 `app_settings` 的键值模式，再决定是否拆成专门配置表
