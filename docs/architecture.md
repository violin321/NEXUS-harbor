# Architecture

NEXUS Harbor（仓库目录名为 `violinai-homepage`）是一个自托管服务入口与状态面板，主要面向个人或小团队的统一导航与运行状态展示。

## 主要组成

### 1. Next.js Web App

- App Router 前端与 API Route 共用同一代码库
- 首页负责服务导航、状态展示与入口聚合
- 管理能力依赖 Supabase 身份体系

### 2. PostgreSQL

- 保存服务检查配置 `service_checks`
- 保存检测结果 `check_results`
- 保存应用设置 `app_settings`
- 可扩展用户档案等业务数据

### 3. Check Engine

- `src/modules/checks/engine.ts` 是执行 L1/L2 服务检测的主实现
- `src/lib/check-engine.ts` 仅作为兼容层 re-export
- 支持按数据库配置批量读取启用项并写回结果
- `scripts/poller.ts` 作为轮询入口，定时调用检测引擎

### 4. System Status API

- `src/app/api/system-public/route.ts` 提供可选的公开系统摘要
- 默认关闭，开启后仅返回 CPU、内存、磁盘、网络、Docker 数量级信息
- 不公开 Docker 镜像名、端口映射等过细宿主机细节

## 设计原则

- 配置通过环境变量注入，不在代码中内置本机路径或 secret
- 公共接口默认最小暴露
- 轮询脚本复用应用内统一配置层，不维护分叉版连接逻辑
- 适合先本地自托管，再按需扩展到容器或 VPS 部署
