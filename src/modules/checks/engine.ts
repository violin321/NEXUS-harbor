import { createDbClient } from '@/lib/db';

export interface CheckResult {
  ok: boolean;
  latency: number;
  status: number;
  error: string | null;
  message?: string;
  details?: Record<string, unknown>;
}

export interface ServiceConfig {
  id: string;
  name: string;
  url: string;
  check_level: number;
  check_path: string;
  expected_status: number;
  api_config: any;
  script_content: string | null;
}

export type CheckRunner = (service: ServiceConfig) => Promise<CheckResult>;

function getDbClient() {
  return createDbClient();
}

function getByPath(obj: any, path: string): any {
  if (!path) return obj;
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export async function runL0Check(): Promise<CheckResult> {
  return { ok: true, latency: 0, status: 200, error: null, message: 'L0 跳过主动探测' };
}

export async function runL1Check(service: ServiceConfig): Promise<CheckResult> {
  const url = `${service.url}${service.check_path || '/'}`;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    return {
      ok: res.status === (service.expected_status || 200),
      latency,
      status: res.status,
      error: null,
    };
  } catch (e: any) {
    return {
      ok: false,
      latency: Date.now() - start,
      status: 0,
      error: e?.message || '检测失败',
    };
  }
}

export async function runL2Check(service: ServiceConfig): Promise<CheckResult> {
  const start = Date.now();
  const apiConfig = service.api_config || {};
  const endpoint = apiConfig.endpoint || '/';
  const method = apiConfig.method || 'GET';
  const responsePath = apiConfig.response_path || '';
  const expectedValue = apiConfig.expected_value;

  const url = `${service.url}${endpoint}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method,
      headers: apiConfig.headers || {},
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const latency = Date.now() - start;

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      const text = await res.text();
      return {
        ok: expectedValue ? text === expectedValue : res.ok,
        latency,
        status: res.status,
        error: null,
        message: text.slice(0, 100),
      };
    }

    const actualValue = responsePath ? getByPath(json, responsePath) : json;
    const ok = expectedValue !== undefined ? String(actualValue) === String(expectedValue) : res.ok;

    return {
      ok,
      latency,
      status: res.status,
      error: null,
      message: ok ? '检测通过' : `期望: ${expectedValue}, 实际: ${actualValue}`,
      details: { actual: actualValue, expected: expectedValue },
    };
  } catch (e: any) {
    return {
      ok: false,
      latency: Date.now() - start,
      status: 0,
      error: e?.message || 'API 请求失败',
    };
  }
}

export async function runL3Check(service: ServiceConfig): Promise<CheckResult> {
  return {
    ok: false,
    latency: 0,
    status: 501,
    error: null,
    message: `L3 script execution is disabled until sandbox worker design is implemented: ${service.name}`,
    details: {
      disabled: true,
      placeholder: true,
      reason: 'sandbox_worker_not_implemented',
      scriptConfigured: Boolean(service.script_content?.trim()),
    },
  };
}

export function getCheckRunner(level: number): CheckRunner {
  switch (level) {
    case 0:
      return () => runL0Check();
    case 1:
      return runL1Check;
    case 2:
      return runL2Check;
    case 3:
      return runL3Check;
    default:
      return runL1Check;
  }
}

export async function runCheck(service: ServiceConfig): Promise<CheckResult> {
  const level = service.check_level ?? 1;
  return getCheckRunner(level)(service);
}

export async function saveCheckResult(serviceId: string, result: CheckResult): Promise<void> {
  const client = getDbClient();
  try {
    await client.connect();
    await client.query(
      `INSERT INTO check_results (service_id, latency_ms, status_code, ok, error_message, checked_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [serviceId, result.latency, result.status, result.ok, result.error]
    );
  } finally {
    await client.end().catch(() => {});
  }
}

export async function checkAllServices(): Promise<Array<{ id: string; name: string; result: CheckResult }>> {
  const client = getDbClient();
  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT id, name, url, check_level, check_path, expected_status, api_config, script_content
       FROM service_checks WHERE enabled = true`
    );

    const results = await Promise.all(
      rows.map(async (row) => {
        const service: ServiceConfig = {
          id: row.id,
          name: row.name,
          url: row.url,
          check_level: row.check_level ?? 1,
          check_path: row.check_path,
          expected_status: row.expected_status,
          api_config: row.api_config,
          script_content: row.script_content,
        };
        const result = await runCheck(service);
        await saveCheckResult(service.id, result);
        return { id: service.id, name: service.name, result };
      })
    );

    return results;
  } finally {
    await client.end().catch(() => {});
  }
}
