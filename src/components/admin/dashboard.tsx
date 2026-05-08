"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import {
  Shield, Sun, Moon, Laptop, Plus, Edit2, Trash2, Save, X,
  ExternalLink, LogOut, Loader2, ArrowLeft, UserCircle,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  url: string;
  icon: string;
  group_name: string;
  enabled: boolean;
  check_path: string;
  expected_status: number;
  public_url: string | null;
  link_label: string;
  check_level?: number;
  api_config?: any;
  script_content?: string;
  created_at: string;
}

interface SettingsState {
  systemStatusPublic: boolean;
}

const ICON_EMOJI: Record<string, string> = {
  zap: "⚡", wrench: "🔧", search: "🔍", download: "📥",
  layout: "📋", bot: "🤖", chart: "📊", gateway: "🌐", monitor: "📈",
};

export function AdminDashboard({ initialServices, initialSettings }: { initialServices: Service[]; initialSettings: SettingsState }) {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [settings, setSettings] = useState<SettingsState>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Service>>({});
  const [saving, setSaving] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const [servicesRes, settingsRes] = await Promise.all([
        fetch("/api/admin/services"),
        fetch("/api/admin/settings"),
      ]);
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch {}
    setLoading(false);
  }, []);

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const save = async () => {
    setSaving(true);
    const isNew = editing === "new";
    const body = isNew
      ? { action: "create", data: form }
      : { action: "update", data: form };
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      fetchServices();
      setEditing(null);
      setForm({});
    }
  };

  const remove = async (id: string) => {
    if (!confirm("确定删除该服务？")) return;
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    fetchServices();
  };

  const toggleEnabled = async (s: Service) => {
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        data: { id: s.id, enabled: !s.enabled },
      }),
    });
    fetchServices();
  };

  const toggleSystemStatusPublic = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemStatusPublic: !settings.systemStatusPublic }),
      });
      if (res.ok) {
        const json = await res.json();
        setSettings({ systemStatusPublic: !!json.systemStatusPublic });
      }
    } catch {}
    setLoading(false);
  };

  const startAdd = () => {
    setEditing("new");
    setForm({
      name: "", url: "", icon: "zap", group_name: "api",
      enabled: true, check_path: "/", expected_status: 200,
      public_url: "", link_label: "访问", check_level: 1,
    });
  };

  const groupLabels: Record<string, string> = {
    api: "API 服务",
    web: "Web 服务",
    core: "核心服务",
    default: "其他",
  };

  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    const g = s.group_name || "default";
    (acc[g] = acc[g] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen relative bg-[#fafafa] text-zinc-900 dark:bg-[#0a0a0a] dark:text-white">
      {/* Grid background */}
      <div className="pointer-events-none fixed inset-0 [background-size:24px_24px] [background-image:linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)]" />

      {/* Nav */}
      <nav className="relative border-b backdrop-blur-xl border-zinc-200 bg-white/80 dark:border-white/[0.06] dark:bg-[#0a0a0a]/80">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-3 py-4 sm:px-6 lg:px-12">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> 返回首页
            </a>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">服务管理</h1>
              <p className="text-[11px] text-muted-foreground">{services.length} 个已注册服务</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={startAdd} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm shadow-violet-500/20 hover:shadow-md hover:shadow-violet-500/25 transition-all">
              <Plus className="h-3.5 w-3.5" /> 添加
            </button>
            <button
              onClick={toggleTheme}
              className="relative h-9 w-9 rounded-xl border border-border/40 bg-background/60 backdrop-blur-sm transition-all hover:bg-background/80"
              title={theme === "system" ? "跟随系统（点击切换）" : theme === "dark" ? "深色模式（点击切换）" : "浅色模式（点击切换）"}
            >
              {!mounted ? null : (
                theme === "system" ? (
                  <Laptop className="absolute inset-0 m-auto h-[1.2rem] w-[1.2rem] transition-all" />
                ) : theme === "dark" ? (
                  <Moon className="absolute inset-0 m-auto h-[1.2rem] w-[1.2rem] transition-all" />
                ) : (
                  <Sun className="absolute inset-0 m-auto h-[1.2rem] w-[1.2rem] transition-all" />
                )
              )}
            </button>
            <a href="/admin/profile" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <UserCircle className="h-3.5 w-3.5" /> 个人资料
            </a>
            <button onClick={signOut} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors">
              <LogOut className="h-3.5 w-3.5" /> 退出
            </button>
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-[1600px] px-3 py-8 sm:px-6 lg:px-12">
        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white/70 p-5 backdrop-blur-xl dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">公开状态设置</h2>
              <p className="mt-1 text-xs text-muted-foreground">控制首页“本机状态”卡片及 /api/system-public 是否对未登录访客开放。</p>
            </div>
            <button
              onClick={toggleSystemStatusPublic}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                settings.systemStatusPublic
                  ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                  : "bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20"
              }`}
            >
              {settings.systemStatusPublic ? "● 已公开" : "○ 未公开"}
            </button>
          </div>
        </section>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" />
            <p className="text-sm">加载中...</p>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-sm mb-3">暂无服务</p>
            <button onClick={startAdd} className="text-xs text-violet-400 hover:underline">添加第一个服务 →</button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([groupName, groupServices]) => (
              <section key={groupName}>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {groupLabels[groupName] || groupName}
                </h2>
                <div className="rounded-2xl border overflow-hidden backdrop-blur-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50/50 dark:border-white/[0.04] dark:bg-white/[0.01]">
                          {["服务", "检测地址", "路径", "检测级别", "公开链接", "状态", "操作"].map(h => (
                            <th key={h} className={`py-3 px-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground ${
                              h === "操作" ? "text-right" : h === "状态" ? "text-center" : "text-left"
                            }`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groupServices.map((s) => (
                          <tr key={s.id} className={`border-b border-zinc-100 hover:bg-zinc-50/80 transition-colors dark:border-white/[0.04] dark:hover:bg-white/[0.02] ${!s.enabled ? "opacity-30" : ""}`}>
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2.5">
                                <span className="text-lg">{ICON_EMOJI[s.icon] || "📦"}</span>
                                <span className="font-medium">{s.name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5">
                              <code className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400">{s.url}</code>
                            </td>
                            <td className="py-3.5 px-5">
                              <code className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400">{s.check_path}</code>
                            </td>
                            <td className="py-3.5 px-5">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                (s.check_level ?? 1) === 0 ? "bg-gray-500/15 text-gray-400" :
                                (s.check_level ?? 1) === 1 ? "bg-emerald-500/15 text-emerald-400" :
                                (s.check_level ?? 1) === 2 ? "bg-blue-500/15 text-blue-400" :
                                "bg-amber-500/15 text-amber-400"
                              }`}>{['L0 链接','L1 HTTP','L2 API','L3 已禁用'][s.check_level ?? 1]}</span>
                            </td>
                            <td className="py-3.5 px-5 text-xs text-muted-foreground max-w-[200px] truncate">
                              {s.public_url ? (
                                <a href={s.public_url} target="_blank" className="text-violet-400 hover:underline flex items-center gap-1">
                                  {s.link_label || "访问"} <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : "—"}
                            </td>
                            <td className="py-3.5 px-5 text-center">
                              <button onClick={() => toggleEnabled(s)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                                s.enabled ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" : "bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20"
                              }`}>
                                {s.enabled ? "● 启用" : "○ 停用"}
                              </button>
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="flex items-center justify-end gap-0.5">
                                <button onClick={() => { setEditing(s.id); setForm({ ...s }); }} className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => remove(s.id)} className="rounded-lg p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-2xl border p-6 backdrop-blur-xl bg-white border-zinc-200 dark:bg-[#141414] dark:border-white/[0.06]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold">{editing === "new" ? "添加服务" : "编辑服务"}</h3>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="服务名称"><input className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="如：CLIProxyAPI" /></Field>
              <Field label="检测地址 (本机)"><input className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono text-xs outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={form.url || ""} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="http://127.0.0.1:8080" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="检测路径"><input className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono text-xs outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={form.check_path || "/"} onChange={e => setForm(f => ({ ...f, check_path: e.target.value }))} /></Field>
                <Field label="期望状态码"><input type="number" className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono text-xs outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={form.expected_status || 200} onChange={e => setForm(f => ({ ...f, expected_status: parseInt(e.target.value) }))} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="图标"><select className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={form.icon || "zap"} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}>{Object.entries(ICON_EMOJI).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}</select></Field>
                <Field label="分组（自定义）"><input className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={form.group_name || ""} onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))} placeholder="如：API 服务、Web 服务" list="group-suggestions" /><datalist id="group-suggestions">{[...new Set(services.map(s => s.group_name).filter(Boolean))].sort().map(g => <option key={g} value={g} />)}</datalist></Field>
              </div>
              <Field label="检测级别">
                <select className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={form.check_level ?? 1} onChange={e => setForm(f => ({ ...f, check_level: parseInt(e.target.value) }))}>
                  <option value={0}>L0 - 纯链接（无检测）</option>
                  <option value={1}>L1 - HTTP 检测（延迟+状态）</option>
                  <option value={2}>L2 - API 集成检测</option>
                  <option value={3}>L3 - 自定义脚本检测（experimental / disabled）</option>
                </select>
              </Field>
              <Field label="公开链接"><input className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono text-xs outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={form.public_url || ""} onChange={e => setForm(f => ({ ...f, public_url: e.target.value }))} placeholder="https://harbor.example.com" /></Field>
              <Field label="链接标签"><input className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={form.link_label || "访问"} onChange={e => setForm(f => ({ ...f, link_label: e.target.value }))} /></Field>

              {/* L2 API 集成配置 */}
              {(form.check_level === 2) && (
                <>
                  <Field label="API Endpoint"><input className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono text-xs outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={form.api_config?.endpoint || ""} onChange={e => setForm(f => ({ ...f, api_config: { ...(f.api_config || {}), endpoint: e.target.value } }))} placeholder="/api/v1/status" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="请求方法"><select className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={form.api_config?.method || "GET"} onChange={e => setForm(f => ({ ...f, api_config: { ...(f.api_config || {}), method: e.target.value } }))}><option value="GET">GET</option><option value="POST">POST</option></select></Field>
                    <Field label="期望值路径"><input className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono text-xs outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={form.api_config?.response_path || ""} onChange={e => setForm(f => ({ ...f, api_config: { ...(f.api_config || {}), response_path: e.target.value } }))} placeholder="data.status" /></Field>
                  </div>
                  <Field label="期望值"><input className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={form.api_config?.expected_value || ""} onChange={e => setForm(f => ({ ...f, api_config: { ...(f.api_config || {}), expected_value: e.target.value } }))} placeholder="healthy" /></Field>
                </>
              )}

              {/* L3 自定义脚本 */}
              {(form.check_level === 3) && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-medium">L3 script execution is experimental / disabled</p>
                  <p className="mt-1 text-amber-700/80 dark:text-amber-300/80">
                    当前仅保留占位配置，不会执行脚本；需等待 sandbox worker 设计落地后再启用。
                  </p>
                  <div className="mt-3">
                    <Field label="检测脚本（仅占位，不执行）"><textarea className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono text-xs outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" rows={6} value={form.script_content || ""} onChange={e => setForm(f => ({ ...f, script_content: e.target.value }))} placeholder={`// Placeholder only. Script execution is disabled until sandbox worker design is implemented.`} /></Field>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border/40">
              <button onClick={() => setEditing(null)} className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"><X className="h-3.5 w-3.5" /> 取消</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-500/20 hover:shadow-md disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} 保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}
