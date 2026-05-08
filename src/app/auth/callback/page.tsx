"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const next = new URLSearchParams(window.location.search).get("next") || "/admin";

    const handle = async () => {
      try {
        // Supabase redirects back with tokens in URL fragment:
        // #access_token=xxx&expires_in=3600&refresh_token=xxx&token_type=bearer&type=access_token
        const hash = window.location.hash;

        if (hash && hash.length > 1) {
          const params = new URLSearchParams(hash.slice(1));
          const err = params.get("error");
          if (err) {
            setError(decodeURIComponent(params.get("error_description") || err));
            return;
          }

          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (access_token && refresh_token) {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();

            // Parse fragment tokens and set session (this writes cookies)
            const { error: setErr } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (setErr) { setError(setErr.message); return; }

            // Also set httpOnly cookies via server route
            const res = await fetch("/auth/set-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ access_token, refresh_token }),
            });

            if (res.ok) router.push(next);
            else { const d = await res.json(); setError(d.error || "设置失败"); }
            return;
          }
        }

        // Fallback: try getSession (for other auth flows)
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) { setError("未收到登录凭证"); return; }

        const { access_token, refresh_token } = data.session;
        const res = await fetch("/auth/set-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token, refresh_token }),
        });
        if (res.ok) router.push(next);
        else { const d = await res.json(); setError(d.error || "设置失败"); }
      } catch (e: any) {
        setError(e?.message || "登录失败");
      }
    };

    handle();
  }, [router]);

  if (!mounted) return null;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => router.push("/admin/login")} className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white">返回登录</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
      <p className="text-muted-foreground text-sm">登录中...</p>
    </div>
  );
}
