// ========== Global Type Definitions ==========

export type CheckLevel = 0 | 1 | 2 | 3;

export interface TimelinePoint {
  latency: number | null;
  status: number;
  ok: boolean;
  checkedAt: string;
}

export interface ServiceLatest {
  latency: number | null;
  status: number;
  ok: boolean;
  error: string | null;
  message?: string;
  details?: Record<string, unknown>;
  checkedAt: string;
}

export interface Service {
  id: string;
  name: string;
  icon: string;
  group: string;
  enabled: boolean;
  url?: string;  // internal/local URL, admin/internal only
  publicUrl?: string;
  linkLabel?: string;
  checkLevel: CheckLevel;
  latest: ServiceLatest | null;
  timeline: TimelinePoint[];
  script_config?: Record<string, unknown>; // L3 自定义脚本配置（JSONB）
}

export type PublicService = Omit<Service, 'url'>;

export interface DashboardData {
  groups: Record<string, PublicService[]>;
  timestamp: number;
}
