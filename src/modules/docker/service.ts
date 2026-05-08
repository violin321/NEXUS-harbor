import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export interface DockerContainerInfo {
  name: string;
  status: string;
  image: string;
  ports: string;
}

export interface DockerInfo {
  total: number;
  running: number;
  stopped: number;
  containers: DockerContainerInfo[];
}

export async function collectDockerInfo(): Promise<DockerInfo> {
  const dockerInfo: DockerInfo = { total: 0, running: 0, stopped: 0, containers: [] };

  try {
    const { stdout } = await exec('docker', ['ps', '-a', '--format', '{{json .}}']);
    const lines = stdout.trim().split('\n').filter(Boolean);
    dockerInfo.containers = lines
      .map((line) => {
        try {
          const parsed = JSON.parse(line);
          return {
            name: parsed.Names || '',
            status: parsed.State || '',
            image: parsed.Image || '',
            ports: parsed.Ports || '',
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as DockerContainerInfo[];

    dockerInfo.total = dockerInfo.containers.length;
    dockerInfo.running = dockerInfo.containers.filter((container) => container.status === 'running').length;
    dockerInfo.stopped = dockerInfo.total - dockerInfo.running;
  } catch {
    // docker unavailable
  }

  return dockerInfo;
}

export function sanitizeDockerInfo(docker: DockerInfo) {
  return {
    total: docker.total,
    running: docker.running,
    stopped: docker.stopped,
    containers: docker.containers.map((container) => ({
      name: container.name,
      status: container.status,
    })),
  };
}
