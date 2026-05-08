# Open Source Readiness

本项目是 NEXUS Harbor（violinai-homepage）的自托管服务入口与状态面板。

## 已完成的开源收口

- 移除代码中的本机数据库 fallback，统一要求通过 `DATABASE_URL` 注入。
- `next.config.ts` 不再内置真实域名或公网 IP，`allowedDevOrigins` 改为环境变量控制。
- 本机编译产物 `scripts/poller.js` 已移出仓库目录，避免硬编码凭据残留继续进入版本管理。
- `scripts/start-poller.sh` 改为相对路径启动，不依赖宿主机绝对路径。
- `system_status_public` 默认改为 `false`，公共系统信息接口默认关闭。
- `system-public` API 公开模式下仅返回收敛后的汇总信息，不再返回 Docker 镜像名与端口细节。
- admin 权限策略改为默认 fail-closed：公开/生产部署必须配置 `ADMIN_EMAILS` 和/或 `ADMIN_USER_IDS`；只有本地临时开发时显式设置 `ALLOW_UNRESTRICTED_ADMIN=true` 才会放开未配置 allowlist 的登录用户。
- `.gitignore` 已补充本地备份、PM2 配置、日志、临时目录等忽略规则。

## 发布前仍需人工处理

- 轮换 `.env.local` / `.env.production` 中已使用过的 Supabase key 与其他 secret。
- 为生产/公开部署明确配置 `ADMIN_EMAILS` 和/或 `ADMIN_USER_IDS`，不要依赖本地逃生开关。
- 复查本地或私有部署脚本，确认没有新的硬编码路径、凭据、token。
- 检查 Git 历史；如果敏感信息曾经提交到历史，需做 history rewrite 或更换全部相关密钥。

## 建议的发布检查

```bash
grep -RIn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=.openclaw-backup --exclude=.env.local --exclude=.env.production --exclude=.env -E 'postgresql://|SUPABASE|service_role|/[A-Za-z0-9._-]+/|([0-9]{1,3}\.){3}[0-9]{1,3}' .
pnpm build
```

如果 grep 仍命中真实 secret、宿主路径或公网资产，先处理再公开。
