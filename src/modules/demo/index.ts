import type { DashboardData } from '@/types';

const nowIso = new Date().toISOString();

export function isDemoModeEnabled(): boolean {
  const value = process.env.DEMO_MODE ?? process.env.NEXT_PUBLIC_DEMO_MODE;
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function isDemoReadOnly(): boolean {
  if (isDemoModeEnabled()) return true;
  const value = process.env.DEMO_READ_ONLY;
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function getDemoDashboardData(): DashboardData {
  return {
    groups: {
      web: [
        {
          id: 'demo-web-harbor',
          name: 'Harbor Public Demo',
          icon: 'layout',
          group: 'web',
          enabled: true,
          publicUrl: 'https://demo.example.com',
          linkLabel: '打开演示',
          checkLevel: 1,
          latest: {
            latency: 84,
            status: 200,
            ok: true,
            error: null,
            checkedAt: nowIso,
          },
          timeline: buildTimeline([82, 90, 76, 88, 81, 85], true),
        },
      ],
      api: [
        {
          id: 'demo-api-search',
          name: 'Search API (Demo)',
          icon: 'search',
          group: 'api',
          enabled: true,
          publicUrl: 'https://api.demo.example.com/docs',
          linkLabel: '查看文档',
          checkLevel: 2,
          latest: {
            latency: 121,
            status: 200,
            ok: true,
            error: null,
            checkedAt: nowIso,
          },
          timeline: buildTimeline([118, 125, 122, 119, 127, 121], true),
        },
        {
          id: 'demo-api-agent',
          name: 'Agent Events (Demo)',
          icon: 'gateway',
          group: 'api',
          enabled: true,
          publicUrl: 'https://events.demo.example.com',
          linkLabel: '查看事件流',
          checkLevel: 1,
          latest: {
            latency: 146,
            status: 200,
            ok: true,
            error: null,
            checkedAt: nowIso,
          },
          timeline: buildTimeline([141, 150, 145, 148, 143, 146], true),
        },
      ],
      core: [
        {
          id: 'demo-core-status',
          name: 'System Summary (Synthetic)',
          icon: 'monitor',
          group: 'core',
          enabled: true,
          publicUrl: 'https://status.example.com',
          linkLabel: '查看状态页',
          checkLevel: 0,
          latest: {
            latency: null,
            status: 200,
            ok: true,
            error: null,
            checkedAt: nowIso,
            message: 'Synthetic demo data only',
          },
          timeline: buildTimeline([0, 0, 0, 0, 0, 0], true, true),
        },
      ],
    },
    timestamp: Date.now(),
  };
}

export function getDemoSystemStatus() {
  return {
    mode: 'demo' as const,
    cpu: { percent: 23.4, cores: 8, model: 'Demo Compute Node' },
    memory: { total: 16 * 1024 ** 3, used: Math.round(6.4 * 1024 ** 3), percent: 40.1 },
    disk: [{ mount: '/demo', total: 256 * 1024 ** 3, used: Math.round(103 * 1024 ** 3), percent: 40.2 }],
    network: { rxBytes: 312 * 1024 ** 2, txBytes: 128 * 1024 ** 2 },
    docker: {
      total: 3,
      running: 3,
      stopped: 0,
      containers: [
        { name: 'demo-web', status: 'running' },
        { name: 'demo-api', status: 'running' },
        { name: 'demo-worker', status: 'running' },
      ],
    },
    uptime: '3d 4h 12m',
    timestamp: Date.now(),
  };
}

function buildTimeline(values: number[], ok: boolean, zeroLatency = false) {
  return values.map((latency, index) => ({
    latency: zeroLatency ? null : latency,
    status: 200,
    ok,
    checkedAt: new Date(Date.now() - (values.length - index) * 5 * 60 * 1000).toISOString(),
  }));
}
