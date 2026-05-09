"use client";

import { useEffect, useState, useCallback } from "react";
import { Cpu, MemoryStick, HardDrive, Network, Container, RefreshCw } from "lucide-react";

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

export function SystemStatusCard() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDocker, setShowDocker] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/system-public", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(null);
      } else if (res.status === 403) {
        setData(null);
        setError("本机状态未公开");
      }
    } catch { /* silently fail */ }
    setLoading(false);
  }, []);


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- polling external status is intentional here; updates occur inside the async fetch callback.
    void fetchData();
    const interval = setInterval(() => {
      void fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const cpuColor = (data?.cpu.percent ?? 0) > 80 ? "bg-red-400" : (data?.cpu.percent ?? 0) > 50 ? "bg-amber-400" : "bg-emerald-400";
  const memColor = (data?.memory.percent ?? 0) > 80 ? "bg-red-400" : (data?.memory.percent ?? 0) > 50 ? "bg-amber-400" : "bg-emerald-400";
  const diskPercent = data?.disk[0]?.percent ?? 0;
  const diskColor = diskPercent > 80 ? "bg-red-400" : diskPercent > 50 ? "bg-amber-400" : "bg-emerald-400";

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-5 mb-6">
        <div className="h-4 w-32 rounded bg-muted/50 animate-pulse mb-4" />
        <div className="grid grid-cols-5 gap-3">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="rounded-xl bg-muted/30 p-4 space-y-2">
              <div className="h-3 w-16 rounded bg-muted/50 animate-pulse" />
              <div className="h-6 w-12 rounded bg-muted/50 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-5 mb-6">
        <p className="text-xs text-muted-foreground">{error || "本机状况数据不可用"}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">本机状态</h2>
          <span className="text-[10px] text-muted-foreground ml-2">运行 {data.uptime}</span>
        </div>
        <button onClick={() => void fetchData()} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors" title="刷新">
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <MetricCard icon={Cpu} label="CPU" value={`${data.cpu.percent}%`} sub={`${data.cpu.cores} 核`} percent={data.cpu.percent} colorClass={cpuColor} />
        <MetricCard icon={MemoryStick} label="内存" value={`${data.memory.percent}%`} sub={`${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)}`} percent={data.memory.percent} colorClass={memColor} />
        <MetricCard icon={HardDrive} label="磁盘" value={`${data.disk[0]?.percent ?? 0}%`} sub={data.disk[0]?.mount} percent={diskPercent} colorClass={diskColor} />
        <MetricCard icon={Network} label="网络" value={`${formatBytes(data.network.rxBytes)}`} sub={`↑ ${formatBytes(data.network.txBytes)}`} colorClass="bg-blue-400" />
        <button onClick={() => {
          if (!data) return;
          setShowDocker(!showDocker);
        }} className="rounded-xl bg-muted/30 p-4 text-left hover:bg-muted/50 transition-colors">
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
  );
}
