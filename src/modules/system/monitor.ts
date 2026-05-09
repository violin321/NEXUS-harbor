import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { collectDockerInfo, sanitizeDockerInfo } from '@/modules/docker/service';

const exec = promisify(execFile);

let cached: { data: SystemData; ts: number } | null = null;

export interface SystemData {
  cpu: { percent: number; cores: number; model: string };
  memory: { total: number; used: number; percent: number };
  disk: Array<{ mount: string; total: number; used: number; percent: number }>;
  network: { rxBytes: number; txBytes: number };
  docker: Awaited<ReturnType<typeof collectDockerInfo>>;
  uptime: string;
  timestamp: number;
}

export async function collectSystemInfo(): Promise<SystemData> {
  const now = Date.now();
  if (cached && now - cached.ts < 5000) return cached.data;

  const cpus = os.cpus();
  const load = os.loadavg();
  const cpuPercent = Math.round((load[0] / (cpus.length || 1)) * 10000) / 100;

  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const memUsed = memTotal - memFree;
  const memPercent = Math.round((memUsed / memTotal) * 10000) / 100;

  let diskInfo: Array<{ mount: string; total: number; used: number; percent: number }> = [];
  try {
    const { stdout } = await exec('df', ['-B1', '--output=source,size,used,pcent,target', '-x', 'tmpfs', '-x', 'devtmpfs']);
    const lines = stdout.trim().split('\n').slice(1);
    diskInfo = lines
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        return {
          mount: parts[4] || '/',
          total: parseInt(parts[1]) || 0,
          used: parseInt(parts[2]) || 0,
          percent: parseInt(parts[3]) || 0,
        };
      })
      .filter((disk) => disk.total > 0);
  } catch {
    // disk info unavailable
  }

  const netInfo = { rxBytes: 0, txBytes: 0 };
  try {
    const netData = await exec('cat', ['/proc/net/dev']);
    const lines = netData.stdout.trim().split('\n').slice(2);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts[0].startsWith('lo:')) continue;
      netInfo.rxBytes += parseInt(parts[1]) || 0;
      netInfo.txBytes += parseInt(parts[9]) || 0;
    }
  } catch {
    // network info unavailable
  }

  const dockerInfo = await collectDockerInfo();

  const uptimeSec = os.uptime();
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const uptimeStr = `${days}d ${hours}h ${minutes}m`;

  const data: SystemData = {
    cpu: { percent: cpuPercent, cores: cpus.length, model: (cpus[0]?.model || 'Unknown').replace(/(TM)|(R)/g, '').trim() },
    memory: { total: memTotal, used: memUsed, percent: memPercent },
    disk: diskInfo.slice(0, 5),
    network: netInfo,
    docker: dockerInfo,
    uptime: uptimeStr,
    timestamp: now,
  };

  cached = { data, ts: now };
  return data;
}

export function sanitizeSystemInfo(data: SystemData) {
  return {
    cpu: data.cpu,
    memory: data.memory,
    disk: data.disk,
    network: data.network,
    docker: sanitizeDockerInfo(data.docker),
    uptime: data.uptime,
    timestamp: data.timestamp,
  };
}
