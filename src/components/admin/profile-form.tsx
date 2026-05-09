"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import {
  Shield, Sun, Moon, Laptop, LogOut,
  Save, Loader2, User, KeyRound, Palette,
} from "lucide-react";

type ProfileUser = {
  email?: string;
};

interface ProfileFormProps {
  user: ProfileUser;
  initialDisplayName: string;
  initialTheme: string;
  initialAvatar: string;
  initialGithub: string;
}

export function ProfileForm({ user, initialDisplayName, initialTheme, initialAvatar, initialGithub }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const { setTheme } = useTheme();

  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const saveProfile = async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          display_name: displayName,
          preferences: { theme: selectedTheme },
        }),
      });
      if (res.ok) {
        setMsg("保存成功");
        setTheme(selectedTheme);
      } else {
        const d = await res.json().catch(() => ({}));
        setMsg(d.error || `保存失败 (${res.status})`);
      }
    } catch {
      setMsg("保存失败");
    }
    setSaving(false);
  };

  const changePassword = async () => {
    setPwMsg("");
    if (newPw !== confirmPw) { setPwMsg("两次密码不一致"); return; }
    if (newPw.length < 6) { setPwMsg("密码至少 6 位"); return; }
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) { setPwMsg(error.message); }
      else { setPwMsg("密码修改成功"); setNewPw(""); setConfirmPw(""); }
    } catch (e) {
      setPwMsg(e instanceof Error ? e.message : "修改失败");
    }
    setChangingPw(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen relative bg-[#fafafa] text-zinc-900 dark:bg-[#0a0a0a] dark:text-white">
      <div className="pointer-events-none fixed inset-0 [background-size:24px_24px] [background-image:linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)]" />

      {/* Nav */}
      <nav className="relative border-b backdrop-blur-xl border-zinc-200 bg-white/80 dark:border-white/[0.06] dark:bg-[#0a0a0a]/80">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-3 py-4 sm:px-6 lg:px-12">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors">
              返回管理
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">个人资料</h1>
              <p className="text-[11px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button onClick={signOut} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors">
            <LogOut className="h-3.5 w-3.5" /> 退出
          </button>
        </div>
      </nav>

      <main className="relative mx-auto max-w-2xl px-3 py-8 sm:px-6">
        {/* Basic Info */}
        <section className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-xl p-6 mb-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><User className="h-4 w-4" /> 基本信息</h2>
          {initialAvatar && (
            <div className="flex items-center gap-3 mb-4">
              <Image src={initialAvatar} alt="avatar" width={48} height={48} className="h-12 w-12 rounded-full ring-2 ring-zinc-200 dark:ring-white/10" unoptimized />
              <span className="text-xs text-muted-foreground">GitHub 头像</span>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">显示名称</label>
              <input className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="你的显示名称" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">邮箱</label>
              <div className="w-full rounded-xl border px-3.5 py-2.5 text-sm bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-white/[0.02] dark:border-white/[0.04] dark:text-zinc-500">{user.email}</div>
            </div>
            {initialGithub && (
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">GitHub</label>
                <div className="w-full rounded-xl border px-3.5 py-2.5 text-sm bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-white/[0.02] dark:border-white/[0.04] dark:text-zinc-500">@{initialGithub}</div>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={saveProfile} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-500/20 hover:shadow-md disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} 保存
              </button>
            </div>
            {msg && <p className="text-xs text-emerald-400 text-right">{msg}</p>}
          </div>
        </section>

        {/* Theme */}
        <section className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-xl p-6 mb-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Palette className="h-4 w-4" /> 主题偏好</h2>
          <div className="flex gap-3">
            {[
              { value: "light", label: "浅色", icon: Sun },
              { value: "dark", label: "深色", icon: Moon },
              { value: "system", label: "跟随系统", icon: Laptop },
            ].map(t => (
              <button
                key={t.value}
                onClick={() => { setSelectedTheme(t.value); setTheme(t.value); }}
                className={`flex-1 flex flex-col items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium transition-all ${
                  selectedTheme === t.value
                    ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
                    : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-400"
                }`}
              >
                <t.icon className="h-5 w-5" />
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Change Password */}
        <section className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-xl p-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><KeyRound className="h-4 w-4" /> 修改密码</h2>
          <div className="space-y-3">
            <input type="password" className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" placeholder="新密码" value={newPw} onChange={e => setNewPw(e.target.value)} />
            <input type="password" className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-white" placeholder="确认新密码" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
            <div className="flex justify-end">
              <button onClick={changePassword} disabled={changingPw} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-500/20 hover:shadow-md disabled:opacity-50">
                {changingPw ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />} 修改密码
              </button>
            </div>
            {pwMsg && <p className="text-xs text-emerald-400 text-right">{pwMsg}</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
