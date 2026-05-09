"use client";

import { ExternalLink, Search, Command } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicService } from "@/types";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  services: PublicService[];
  groupLabels?: Record<string, string>;
  showTrigger?: boolean;
}

interface PaletteItem {
  id: string;
  name: string;
  group: string;
  groupLabel: string;
  linkLabel: string;
  publicUrl: string;
  visibleUrl: string;
  searchText: string;
}

function normalize(input: string) {
  return input.trim().toLowerCase();
}

function getVisibleUrl(publicUrl: string) {
  if (!publicUrl) return "";

  try {
    const url = new URL(publicUrl);
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return publicUrl;
  }
}

function scoreMatch(item: PaletteItem, query: string) {
  if (!query) return 1;

  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 1;

  let score = 0;
  for (const token of tokens) {
    if (!item.searchText.includes(token)) return -1;
    if (item.name.toLowerCase().includes(token)) score += 6;
    else if (item.groupLabel.toLowerCase().includes(token)) score += 3;
    else if (item.linkLabel.toLowerCase().includes(token)) score += 2;
    else if (item.visibleUrl.toLowerCase().includes(token)) score += 1;
  }

  return score;
}

export function CommandPalette({ services, groupLabels = {}, showTrigger = true }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    return services
      .filter((service) => service.enabled && Boolean(service.publicUrl))
      .map((service) => {
        const visibleUrl = getVisibleUrl(service.publicUrl ?? "");
        const groupLabel = groupLabels[service.group] || service.group;
        const linkLabel = service.linkLabel || "访问";

        return {
          id: service.id,
          name: service.name,
          group: service.group,
          groupLabel,
          linkLabel,
          publicUrl: service.publicUrl ?? "",
          visibleUrl,
          searchText: normalize([
            service.name,
            service.group,
            groupLabel,
            linkLabel,
            visibleUrl,
            service.publicUrl,
          ].filter(Boolean).join(" ")),
        };
      });
  }, [groupLabels, services]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(query);

    return items
      .map((item) => ({ item, score: scoreMatch(item, normalizedQuery) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.item.name.localeCompare(b.item.name, "zh-CN");
      })
      .map((entry) => entry.item);
  }, [items, query]);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const updateQuery = useCallback((value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  }, []);

  const openItem = useCallback((item: PaletteItem | undefined) => {
    if (!item?.publicUrl) return;
    window.open(item.publicUrl, "_blank", "noopener,noreferrer");
    closePalette();
  }, [closePalette]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        setOpen((current) => {
          const next = !current;
          if (next) {
            setQuery("");
            setSelectedIndex(0);
          } else {
            setQuery("");
            setSelectedIndex(0);
          }
          return next;
        });
        return;
      }

      if (!open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((current) => Math.min(current + 1, Math.max(filteredItems.length - 1, 0)));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((current) => Math.max(current - 1, 0));
        return;
      }

      if (event.key === "Enter") {
        const target = filteredItems[selectedIndex] ?? filteredItems[0];
        if (target) {
          event.preventDefault();
          openItem(target);
        }
      }
    };

    const handleOpenEvent = () => {
      setOpen(true);
      setSelectedIndex(0);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("harbor:open-command-palette", handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("harbor:open-command-palette", handleOpenEvent);
    };
  }, [closePalette, filteredItems, open, openItem, selectedIndex]);

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          onClick={openPalette}
          className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-xs text-muted-foreground shadow-sm transition hover:border-border hover:text-foreground"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="global-command-palette"
        >
          <Search className="h-3.5 w-3.5" />
          <span>搜索</span>
          <span className="hidden items-center gap-1 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex">
            <Command className="h-3 w-3" />K
          </span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 py-16 backdrop-blur-sm"
          onClick={closePalette}
          role="presentation"
        >
          <div
            id="global-command-palette"
            role="dialog"
            aria-modal="true"
            aria-label="全局命令面板"
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border/50 bg-background/95 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="搜索服务、分组、链接文案或公开域名…"
                className="h-10 w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => openItem(item)}
                    className={cn(
                      "flex w-full items-start justify-between rounded-xl px-3 py-3 text-left transition",
                      index === selectedIndex ? "bg-muted text-foreground" : "text-foreground hover:bg-muted/70"
                    )}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{item.name}</span>
                        <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                          {item.groupLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{item.linkLabel}</span>
                        {item.visibleUrl && <span className="font-mono">{item.visibleUrl}</span>}
                      </div>
                    </div>
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  没有匹配的公开服务，试试名称、分组或域名关键词。
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border/50 px-4 py-3 text-[11px] text-muted-foreground">
              <span>Enter 打开 · ↑↓ 切换 · Esc 关闭</span>
              <span>仅搜索公开字段</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
