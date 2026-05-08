"use client";

import { useCallback, useEffect, useState } from "react";
import { Cpu, MemoryStick, HardDrive, Network, Container, RefreshCw, Activity, ArrowLeft } from "lucide-react";

interface SystemData {
  cpu: { percent: number; cores: number; model: string };
  memory: { total: number; used: number; percent: number };
  disk: Array<{ mount: string; total: number; used: number; percent: number }>;
  network: { rxBytes: number; txBytes: number };
  docker: { total: number; running: number; stopped: number; containers: Array<{ name: string; status: string }> };
  uptime: string;
  timestamp: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function ProgressBar({ percent, colorClass }: { percent: number; colorClass: string }) {
  return (
    <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden mt-1">
      <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, percent, colorClass }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  percent?: number;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-mono text-lg font-medium leading-none text-foreground">{value}</div>
      {sub && <div className="mt-1 text-[10px] text-muted-foreground">{sub}</div>}
      {percent !== undefined && <ProgressBar percent={percent} colorClass={colorClass} />}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-5">
      <div className="h-4 w-32 rounded bg-muted/50 animate-pulse mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl bg-muted/30 p-4 space-y-2">
            <div className="h-3 w-16 rounded bg-muted/50 animate-pulse" />
            <div className="h-6 w-12 rounded bg-muted/50 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDocker, setShowDocker] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/system-public", { cache: "no-store" });
      if (res.status === 403) {
        setData(null);
        setError("本机状态未公开");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, autoRefresh]);

  const cpuColor = (data?.cpu.percent ?? 0) > 80 ? "bg-red-400" : (data?.cpu.percent ?? 0) > 50 ? "bg-amber-400" : "bg-emerald-400";
  const memColor = (data?.memory.percent ?? 0) > 80 ? "bg-red-400" : (data?.memory.percent ?? 0) > 50 ? "bg-amber-400" : "bg-emerald-400";
  const diskPercent = data?.disk[0]?.percent ?? 0;
  const diskColor = diskPercent > 80 ? "bg-red-400" : diskPercent > 50 ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border/40">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>返回首页</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              自动刷新 {autoRefresh ? "已开启" : "已关闭"}
            </span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                autoRefresh
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {autoRefresh ? "ON" : "OFF"}
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              title="手动刷新"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              刷新
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-[1200px] px-4 py-8">
        {/* Title */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">LIVE</span>
          </div>
          <h1 className="text-xl font-semibold">系统状态</h1>
        </div>

        {loading && !data && <LoadingSkeleton />}

        {error && !data && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button
              onClick={fetchData}
              className="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/25 transition-colors"
            >
              重试
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Status card */}
            <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">本机状态</h2>
                  <span className="text-[10px] text-muted-foreground ml-2">运行 {data.uptime}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    最后更新: {formatTimestamp(data.timestamp)}
                  </span>
                  <button
                    onClick={fetchData}
                    className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                    title="刷新"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MetricCard icon={Cpu} label="CPU" value={`${data.cpu.percent}%`} sub={`${data.cpu.cores} 核`} percent={data.cpu.percent} colorClass={cpuColor} />
                <MetricCard icon={MemoryStick} label="内存" value={`${data.memory.percent}%`} sub={`${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)}`} percent={data.memory.percent} colorClass={memColor} />
                <MetricCard icon={HardDrive} label="磁盘" value={`${data.disk[0]?.percent ?? 0}%`} sub={data.disk[0]?.mount} percent={diskPercent} colorClass={diskColor} />
                <MetricCard icon={Network} label="网络" value={`${formatBytes(data.network.rxBytes)}`} sub={`↑ ${formatBytes(data.network.txBytes)}`} colorClass="bg-blue-400" />
                <button
                  onClick={() => setShowDocker(!showDocker)}
                  className="rounded-xl bg-muted/30 p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Container className="h-4 w-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Docker</span>
                  </div>
                  <div className="font-mono text-lg font-medium leading-none text-foreground">{data.docker.running}/{data.docker.total}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">运行中 / 总计</div>
                </button>
              </div>

              {/* Docker container list */}
              {showDocker && data.docker.containers.length > 0 && (
                <div className="mt-3 rounded-xl bg-muted/20 p-3 max-h-48 overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/30">
                        <th className="text-left py-1 px-2">容器</th>
                        <th className="text-left py-1 px-2">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.docker.containers.map(c => (
                        <tr key={c.name} className="border-b border-border/20">
                          <td className="py-1 px-2 font-medium">{c.name}</td>
                          <td className="py-1 px-2">
                            <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] ${c.status === 'running' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-400'}`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>此页面为公开状态页，仅展示非敏感系统指标。</p>
              <p className="mt-1">© 2026 NEXUS-9 · Powered by OpenClaw</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
