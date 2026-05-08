"use client";

import { Activity, AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardData, PublicService, Service } from "@/types";
import { ServiceCard } from "@/components/home/service-card";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { DashboardSkeleton, NavBar } from "@/components/home/nav-bar";
import { SystemStatusCard } from "@/components/home/system-status-card";

const GROUP_LABELS: Record<string, string> = {
  api: "API 服务",
  web: "Web 服务",
  default: "其他",
};

function resolvePublicUrl(service: PublicService): { url: string; label: string } {
  return {
    url: service.publicUrl || '',
    label: service.linkLabel || '访问',
  };
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
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
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const groupEntries = useMemo(() => {
    if (!data?.groups) return [];
    const resolved = Object.entries(data.groups).map(([groupName, services]) => {
      const resolvedServices = services.map(s => ({
        ...s,
        publicUrl: resolvePublicUrl(s).url,
        linkLabel: resolvePublicUrl(s).label,
      }));
      return [groupName, resolvedServices] as [string, Service[]];
    });
    return resolved;
  }, [data]);

  const totalServices = useMemo(() => {
    if (!data?.groups) return 0;
    return Object.values(data.groups).reduce((sum, g) => sum + g.length, 0);
  }, [data]);

  return (
    <div className="py-8 md:py-16">
      <NavBar serviceCount={totalServices} hasData={!!data} onNavigateAdmin={() => window.location.href = '/admin'} />

      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-3 sm:px-6 lg:px-12">
        {/* System Status Card */}
        <SystemStatusCard />

        {loading ? (
          <>
            <div className="space-y-4"><div className="h-4 w-20 rounded bg-muted/50 animate-pulse" /><DashboardSkeleton /></div>
            <div className="space-y-4"><div className="h-4 w-24 rounded bg-muted/50 animate-pulse" /><DashboardSkeleton /></div>
          </>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-3 text-red-400" />
            <p>{error}</p>
            <button onClick={fetchData} className="mt-3 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">重新加载</button>
          </div>
        ) : (
          groupEntries.map(([groupName, services]) => (
            <section key={groupName}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {GROUP_LABELS[groupName] || groupName}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.filter(s => s.enabled).map(s => <ServiceCard key={s.id} service={s} />)}
              </div>
            </section>
          ))
        )}
      </main>

      <footer className="mt-16 border-t border-border/40">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-3 py-6 sm:px-6 lg:px-12">
          <div className="text-sm text-muted-foreground">© 2026 NEXUS-9</div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-border/40 bg-background/60 px-3 py-1 text-xs text-muted-foreground shadow-sm transition hover:border-border/80">
              <span className="font-mono text-[11px]">Powered by OpenClaw</span>
            </span>
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}
