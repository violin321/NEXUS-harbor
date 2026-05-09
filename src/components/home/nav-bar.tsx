"use client";

import { appConfig } from "@/lib/config";

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-muted/50 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-24 rounded bg-muted/50 animate-pulse" />
                <div className="h-4 w-10 rounded bg-muted/50 animate-pulse" />
              </div>
              <div className="h-3 w-32 rounded bg-muted/50 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map(j => (
              <div key={j} className="rounded-xl bg-muted/30 p-3 space-y-2">
                <div className="h-3 w-10 rounded bg-muted/50 animate-pulse" />
                <div className="h-5 w-12 rounded bg-muted/50 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function NavBar({ hasData, onNavigateAdmin }: {
  hasData: boolean;
  onNavigateAdmin: () => void;
}) {
  return (
    <nav className="border-b border-border/40">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-3 py-4 sm:px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            N
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground">{appConfig.productName}</h1>
            <p className="text-[11px] text-muted-foreground">NEXUS-9 · self-hosted service gateway</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onNavigateAdmin} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            管理
          </button>
          <span className="text-[11px] text-muted-foreground">
            {hasData && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />实时检测</span>}
          </span>
        </div>
      </div>
    </nav>
  );
}
