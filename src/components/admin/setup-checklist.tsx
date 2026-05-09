"use client";

import { AlertTriangle, CheckCircle2, Copy, Loader2, ShieldAlert, Wrench } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export type SetupState = "complete" | "action_required" | "warning" | "error";

export interface SetupItem {
  key: string;
  label: string;
  status: SetupState;
  message: string;
  command?: string;
}

export interface SetupStatus {
  generatedAt: string;
  overallStatus: SetupState;
  items: SetupItem[];
}

const STATUS_META: Record<SetupState, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  complete: {
    label: "已完成",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  action_required: {
    label: "需处理",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    icon: Wrench,
  },
  warning: {
    label: "注意",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    icon: AlertTriangle,
  },
  error: {
    label: "异常",
    className: "bg-red-500/15 text-red-400 border-red-500/20",
    icon: ShieldAlert,
  },
};

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SetupChecklist({ initialStatus }: { initialStatus: SetupStatus }) {
  const [status, setStatus] = useState<SetupStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/setup", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setStatus(json);
    } catch {
      // keep last good state to avoid a broken onboarding panel
    } finally {
      setLoading(false);
    }
  }, []);

  const summary = useMemo(() => {
    const counts = status.items.reduce<Record<SetupState, number>>((acc, item) => {
      acc[item.status] += 1;
      return acc;
    }, { complete: 0, action_required: 0, warning: 0, error: 0 });

    if (counts.error > 0) return `发现 ${counts.error} 项异常，建议先修复数据库连通性。`;
    if (counts.action_required > 0) return `还有 ${counts.action_required} 项首次启动配置待完成。`;
    if (counts.warning > 0) return `主体已可用，但还有 ${counts.warning} 项建议处理。`;
    return "首次启动关键项已就绪。";
  }, [status.items]);

  const overallMeta = STATUS_META[status.overallStatus];

  const copyCommand = async (key: string, command?: string) => {
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1600);
    } catch {
      setCopiedKey(null);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-zinc-200 bg-white/70 p-5 backdrop-blur-xl dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">首次启动检查清单</h2>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${overallMeta.className}`}>
              <overallMeta.icon className="h-3 w-3" />
              {overallMeta.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{summary}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            只显示是否已配置，不回显 secret。公开/生产环境下 admin 仍默认 fail-closed。
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>更新于 {formatGeneratedAt(status.generatedAt)}</span>
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50 disabled:opacity-60 dark:border-white/[0.08] dark:hover:bg-white/[0.04]"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5" />}
            刷新检查
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {status.items.map((item) => {
          const meta = STATUS_META[item.status];
          const Icon = meta.icon;
          return (
            <div
              key={item.key}
              className="rounded-xl border border-zinc-200/80 bg-white/70 p-4 dark:border-white/[0.06] dark:bg-black/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <h3 className="text-sm font-medium">{item.label}</h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.message}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.className}`}>
                  {meta.label}
                </span>
              </div>

              {item.command ? (
                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-3">
                    <code className="block flex-1 overflow-x-auto text-[11px] text-zinc-600 dark:text-zinc-300">{item.command}</code>
                    <button
                      onClick={() => copyCommand(item.key, item.command)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-zinc-100 hover:text-foreground dark:hover:bg-white/[0.06]"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copiedKey === item.key ? "已复制" : "复制"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
