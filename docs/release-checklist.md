# Release Checklist

面向公开仓库 / 对外演示前的最小 gate。

## 1. Secrets 与配置

- [ ] 轮换 `.env.local`、`.env.production` 里已经使用过的 Supabase key / 数据库密码 / 其他 secret
- [ ] 确认仓库内只保留 `.env.example` 这类占位模板
- [ ] 生产环境明确配置 `ADMIN_EMAILS` 和/或 `ADMIN_USER_IDS`
- [ ] 确认没有依赖 `ALLOW_UNRESTRICTED_ADMIN=true` 作为公开部署方案
- [ ] 确认 `NEXT_PUBLIC_SITE_URL` 已替换为真实域名

## 2. 代码与仓库清理

- [ ] 检查 Git 工作区没有误提交本地产物、日志、转储文件
- [ ] 运行敏感信息扫描，确认没有真实连接串、token、宿主机路径、IP 暴露在可公开文件中
- [ ] 如果历史提交曾带出 secret，先做 history rewrite 或直接轮换全部相关密钥

建议命令：

```bash
grep -RIn \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=.openclaw-backup \
  --exclude=.env.local \
  --exclude=.env.production \
  --exclude=.env \
  -E 'postgresql://|SUPABASE|service_role|/[A-Za-z0-9._-]+/|([0-9]{1,3}\.){3}[0-9]{1,3}' .

git ls-files -z | xargs -0 grep -nE 'postgresql://|SUPABASE|service_role' || true

git log --all --stat -- . ':(exclude).env.example'
git log --all -p -G 'postgresql://|SUPABASE|service_role'
```

## 3. 质量 gate

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] GitHub Actions CI 通过（含 lint hard gate）
- [ ] Docker build 通过

## 4. 数据与权限

- [ ] 在目标数据库执行 `db/migrations/001_init.sql`
- [ ] 仅在需要演示数据时执行对应 seed：本地 / 宿主机用 `db/seeds/demo.sql`，Docker Compose demo 用 `db/seeds/demo-compose.sql`
- [ ] 如为 public demo，确认已显式启用 `DEMO_MODE=true`、`NEXT_PUBLIC_DEMO_MODE=true`、`DEMO_READ_ONLY=true`
- [ ] 确认 `system_status_public` 是否符合公开策略
- [ ] 验证 admin allowlist 实际生效
- [ ] 验证公开 dashboard / system status 不读取真实私有服务 URL、主机指标或可见的 service role key

## 5. 部署演练

- [ ] 至少完成一次 demo deploy（PM2 或 Docker Compose）
- [ ] 验证首页、登录、admin、数据库读写链路
- [ ] 验证反向代理配置可正常转发
- [ ] 记录回滚方式（上一个镜像 / 上一个 commit / 上一个 env 文件）

## 6. 对外发布前最后确认

- [ ] README / deployment 文档可让外部开发者独立跑起来
- [ ] README 中的 public demo 说明明确标注 synthetic / read-only，不暗示真实运维环境可见
- [ ] repo visibility 切换前再做一轮 secret 检查
- [ ] 确认不会把 `.env.local`、`.env.production`、数据库备份、日志目录一并公开
- [ ] 如启用 poller，至少完成一次 `pnpm poller:once` 或等价 dry-run 验证
