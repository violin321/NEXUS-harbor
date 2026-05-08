"use client";

import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <button className="h-9 w-9 rounded-full border border-border/40 bg-background/60 backdrop-blur-sm" />;

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      onClick={cycle}
      className="relative h-9 w-9 rounded-full border border-border/40 bg-background/60 backdrop-blur-sm transition-all hover:bg-background/80"
      title={theme === "system" ? "跟随系统（点击切换）" : theme === "dark" ? "深色模式（点击切换）" : "浅色模式（点击切换）"}
    >
      {theme === "system" ? (
        <Laptop className="absolute inset-0 m-auto h-[1.2rem] w-[1.2rem] transition-all" />
      ) : theme === "dark" ? (
        <Moon className="absolute inset-0 m-auto h-[1.2rem] w-[1.2rem] transition-all" />
      ) : (
        <Sun className="absolute inset-0 m-auto h-[1.2rem] w-[1.2rem] transition-all" />
      )}
    </button>
  );
}
