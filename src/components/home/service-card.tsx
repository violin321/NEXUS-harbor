"use client";

import { useState } from "react";
import {
  ArrowUpRight, Zap, Radio, Activity, ChevronDown, AlertTriangle,
  Bot, LayoutDashboard, BarChart3, Globe, Wrench, Search, Download,
  Code, CheckCircle2,
} from "lucide-react";
import type { Service, ServiceLatest, CheckLevel } from "@/types";
import { TimelineSparkline } from "./timeline-sparkline";

// ========== Icon Map ==========
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  bot: Bot, layout: LayoutDashboard, chart: BarChart3, gateway: Globe,
  proxy: Wrench, search: Search, download: Download, zap: Zap,
  design: LayoutDashboard, monitor: BarChart3,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const C = ICON_MAP[name] || Activity;
  return <C className={className} />;
}

// ========== Status helpers ==========
export function getStatusColor(ok: boolean | null, status: number): string {
  if (ok === false || (ok === null && status === 0)) return "text-red-400";
  if (status >= 500) return "text-red-400";
  if (status >= 400) return "text-amber-400";
  return "text-emerald-400";
}

export function getStatusDot(ok: boolean | null, status: number): string {
  if (ok === false || (ok === null && status === 0)) return "bg-red-400";
  if (status >= 500) return "bg-red-400";
  if (status >= 400) return "bg-amber-400";
  return "bg-emerald-400";
}

export function getStatusLabel(ok: boolean | null, status: number): string {
  if (ok === false || (ok === null && status === 0)) return "异常";
  if (status >= 500) return "错误";
  if (status >= 400) return "警告";
  return "正常";
}

// ========== Metrics Panel (L1/L2/L3 shared) ==========
function MetricsPanel({ latest }: { latest: ServiceLatest | null }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-muted/30 p-3 transition-colors group-hover:bg-muted/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Zap className="h-3.5 w-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">延迟</span>
        </div>
        <div className="mt-1 font-mono text-lg font-medium leading-none text-foreground">
          {latest?.latency != null && latest.latency >= 0 ? `${latest.latency}ms` : "—"}
        </div>
      </div>
      <div className="rounded-xl bg-muted/30 p-3 transition-colors group-hover:bg-muted/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Radio className="h-3.5 w-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">状态</span>
        </div>
        <div className="mt-1 font-mono text-lg font-medium leading-none text-foreground">
          {latest?.status ? `HTTP ${latest.status}` : "—"}
        </div>
      </div>
    </div>
  );
}

// ========== L2 Custom Metrics ==========
function CustomMetrics({ details }: { details?: Record<string, unknown> }) {
  if (!details || Object.keys(details).length === 0) return null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      {Object.entries(details).map(([key, value]) => (
        <div key={key} className="rounded-xl bg-muted/30 p-3 transition-colors group-hover:bg-muted/50">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">{key}</span>
          </div>
          <div className="mt-1 font-mono text-sm font-medium leading-none text-foreground">
            {String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ========== L3 Custom Message ==========
function CustomMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mt-3 rounded-xl bg-muted/30 p-3 transition-colors group-hover:bg-muted/50">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Activity className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">输出</span>
      </div>
      <div className="mt-1 text-sm text-foreground whitespace-pre-wrap">{message}</div>
    </div>
  );
}

// ========== L3 Script Placeholder ==========
function ScriptPlaceholder({ service }: { service: Service }) {
  const [configured, setConfigured] = useState(false);
  const hasConfig = service.script_config && Object.keys(service.script_config).length > 0;

  return (
    <div className="mt-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Code className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-primary">自定义脚本</span>
      </div>

      {hasConfig ? (
        <div className="mb-2">
          <p className="text-[10px] text-muted-foreground mb-1">脚本配置：</p>
          <pre className="text-[10px] font-mono text-muted-foreground bg-background/50 rounded-lg p-2 overflow-x-auto max-h-20 whitespace-pre-wrap">
            {JSON.stringify(service.script_config, null, 2)}
          </pre>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground mb-2">自定义脚本检测尚未配置</p>
      )}

      {configured ? (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          即将开放，敬请期待
        </div>
      ) : (
        <button
          onClick={() => setConfigured(true)}
          className="rounded-lg bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-[11px] font-medium text-primary transition-colors"
        >
          配置脚本
        </button>
      )}
    </div>
  );
}

// ========== Service Card ==========
export function ServiceCard({ service }: { service: Service }) {
  const [open, setOpen] = useState(false);
  const l = service.latest;
  const checkLevel: CheckLevel = service.checkLevel ?? 1;

  // ===== L0: Pure link card =====
  if (checkLevel === 0) {
    return (
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="absolute left-2 top-2 h-4 w-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
          <line x1="12" y1="0" x2="12" y2="24" /><line x1="0" y1="12" x2="24" y2="12" />
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="absolute right-2 top-2 h-4 w-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
          <line x1="12" y1="0" x2="12" y2="24" /><line x1="0" y1="12" x2="24" y2="12" />
        </svg>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white/80 to-white/20 shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-105 dark:from-white/10 dark:to-white/5 dark:ring-white/10 mb-3">
            <ServiceIcon name={service.icon} className="h-7 w-7 text-foreground/70" />
          </div>
          <h3 className="text-base font-bold leading-none tracking-tight text-foreground mb-4">{service.name}</h3>
          {service.publicUrl ? (
            <a href={service.publicUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-500/20 transition-all hover:shadow-md hover:shadow-violet-500/25">
              {service.linkLabel || "访问"} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">暂无链接</span>
          )}
        </div>
      </div>
    );
  }

  // ===== L1/L2/L3: Full card with metrics =====
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="absolute left-2 top-2 h-4 w-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
        <line x1="12" y1="0" x2="12" y2="24" /><line x1="0" y1="12" x2="24" y2="12" />
      </svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="absolute right-2 top-2 h-4 w-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
        <line x1="12" y1="0" x2="12" y2="24" /><line x1="0" y1="12" x2="24" y2="12" />
      </svg>

      <div className="flex-1 p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/80 to-white/20 shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-105 dark:from-white/10 dark:to-white/5 dark:ring-white/10">
            <ServiceIcon name={service.icon} className="h-5 w-5 text-foreground/70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-base font-bold leading-none tracking-tight text-foreground">{service.name}</h3>
              {service.publicUrl ? (
                <a href={service.publicUrl} target="_blank" rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm shadow-violet-500/20 transition-all hover:shadow-md hover:shadow-violet-500/25">
                  访问 <ArrowUpRight className="h-3 w-3" />
                </a>
              ) : (
                <span className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusColor(l?.ok ?? null, l?.status ?? 0)}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(l?.ok ?? null, l?.status ?? 0)}`} />
                  {getStatusLabel(l?.ok ?? null, l?.status ?? 0)}
                </span>
              )}
            </div>
            {l?.error && (
              <p className="mt-1 text-[11px] text-red-400/80 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {l.error}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {l ? `上次检测: ${new Date(l.checkedAt).toLocaleTimeString('zh-CN')}` : '暂无数据'}
            </p>
          </div>
        </div>

        {/* L1/L2/L3 shared: latency + status */}
        <MetricsPanel latest={l} />

        {/* L2: custom metrics */}
        {checkLevel === 2 && <CustomMetrics details={l?.details} />}

        {/* L3: script placeholder + custom message */}
        {checkLevel === 3 && (
          <>
            <ScriptPlaceholder service={service} />
            <CustomMessage message={l?.message} />
          </>
        )}
      </div>

      {/* Collapsible Timeline (L1/L2/L3) */}
      {service.timeline.length > 0 && (
        <>
          <button onClick={() => setOpen(!open)}
            className="border-t border-border/30 px-5 py-3 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors">
            <span className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" /> 延迟趋势 ({service.timeline.length} 条)
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && service.timeline.length > 0 && (
            <div className="border-t border-border/30 px-5 py-4 bg-muted/10">
              <TimelineSparkline data={service.timeline} />
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground/60">
                <span>{new Date(service.timeline[0].checkedAt).toLocaleString('zh-CN')}</span>
                <span>{new Date(service.timeline[service.timeline.length - 1].checkedAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
