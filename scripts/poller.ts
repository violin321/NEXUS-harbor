/**
 * L2 API 检测轮询脚本
 * 使用 checks 模块的 checkAllServices() 执行 L0/L1/L2 检测，L3 当前仅占位不执行脚本
 * 每 5 分钟执行一次，结果写入 check_results 表
 *
 * 运行: npx tsx scripts/poller.ts
 */
import { checkAllServices } from '../src/modules/checks';

const POLL_INTERVAL_MS = Number(process.env.POLLER_INTERVAL_MS || 5 * 60 * 1000); // 5 minutes
const runOnce = process.argv.includes('--once');

function fmt(d: Date): string {
  return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}

function okIcon(ok: boolean): string {
  return ok ? '✅' : '❌';
}

async function tick() {
  console.log(`\n[${fmt(new Date())}] ========== 开始检测 ==========`);
  const results = await checkAllServices();

  if (results.length === 0) {
    console.log(`[${fmt(new Date())}] ⚠️ 没有启用的服务`);
    return;
  }

  let passCount = 0;
  let failCount = 0;

  for (const r of results) {
    const status = r.result.ok ? 'OK' : 'FAIL';
    const icon = okIcon(r.result.ok);
    console.log(`[${fmt(new Date())}] ${icon} ${r.name}: ${status} ${r.result.latency}ms ${r.result.status}${r.result.error ? ` (${r.result.error})` : ''}${r.result.message ? ` — ${r.result.message}` : ''}`);
    if (r.result.ok) passCount++;
    else failCount++;
  }

  console.log(`[${fmt(new Date())}] 检测完成: ${passCount} 通过, ${failCount} 失败, 共 ${results.length} 个服务`);
}

async function main() {
  if (runOnce) {
    console.log(`[${fmt(new Date())}] 🧪 Poller 单次执行模式启动`);
    await tick();
    return;
  }

  console.log(`[${fmt(new Date())}] 🚀 L2 API 检测轮询器启动 (每 ${POLL_INTERVAL_MS / 1000 / 60} 分钟)`);

  // 首次立即执行
  await tick();

  // 定时轮询
  setInterval(async () => {
    try {
      await tick();
    } catch (err) {
      console.error(`[${fmt(new Date())}] 💥 检测异常:`, err);
    }
  }, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error(`[${fmt(new Date())}] 💥 致命错误:`, err);
  process.exit(1);
});
