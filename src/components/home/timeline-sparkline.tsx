"use client";

import { TimelinePoint } from "@/types";

export function TimelineSparkline({ data }: { data: TimelinePoint[] }) {
  if (!data || data.length === 0) return null;
  const maxLatency = Math.max(...data.map(d => d.latency || 0), 1);
  const h = 32;
  const w = 200;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = h - ((d.latency || 0) / maxLatency) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        points={points}
        className="text-foreground/30"
      />
      {data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * w;
        const y = h - ((d.latency || 0) / maxLatency) * (h - 4) - 2;
        const color = d.ok ? "text-emerald-400" : "text-red-400";
        return <circle key={i} cx={x} cy={y} r="1.5" className={color} fill="currentColor" />;
      })}
    </svg>
  );
}
