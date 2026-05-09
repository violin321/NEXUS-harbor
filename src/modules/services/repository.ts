import { createDbClient } from '@/lib/db';
import type { CheckLevel, DashboardData, PublicService, TimelinePoint } from '@/types';

export interface ServiceRecord {
  id: string;
  name: string;
  url: string;
  icon: string;
  group_name: string;
  enabled: boolean;
  check_path: string;
  expected_status: number;
  public_url: string | null;
  link_label: string | null;
  check_level: CheckLevel;
  api_config: Record<string, unknown> | null;
  script_content: string | null;
  created_at?: string;
}

export interface ServiceMutationInput {
  id?: string;
  name: string;
  url: string;
  icon?: string;
  group_name?: string;
  enabled?: boolean;
  check_path?: string;
  expected_status?: number;
  public_url?: string | null;
  link_label?: string;
  check_level?: CheckLevel;
  api_config?: Record<string, unknown> | null;
  script_content?: string | null;
}

function getClient() {
  return createDbClient();
}

export async function listServices(): Promise<ServiceRecord[]> {
  const client = getClient();
  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT id, name, url, icon, group_name, enabled, check_path, expected_status, public_url, link_label, check_level, api_config, script_content, created_at
       FROM service_checks
       ORDER BY group_name, name`
    );
    return rows;
  } finally {
    await client.end().catch(() => {});
  }
}

export async function createService(data: ServiceMutationInput): Promise<ServiceRecord> {
  const client = getClient();
  try {
    await client.connect();
    const { rows } = await client.query(
      `INSERT INTO service_checks (name, url, icon, group_name, enabled, check_path, expected_status, public_url, link_label, check_level, api_config, script_content)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        data.name,
        data.url,
        data.icon || 'zap',
        data.group_name || 'default',
        data.enabled ?? true,
        data.check_path || '/',
        data.expected_status || 200,
        data.public_url || null,
        data.link_label || '访问',
        data.check_level ?? 1,
        data.api_config ? JSON.stringify(data.api_config) : null,
        data.script_content || null,
      ]
    );
    return rows[0];
  } finally {
    await client.end().catch(() => {});
  }
}

export async function updateService(data: ServiceMutationInput & { id: string }): Promise<ServiceRecord | null> {
  const client = getClient();
  try {
    await client.connect();
    const { rows } = await client.query(
      `UPDATE service_checks
       SET name=$1, url=$2, icon=$3, group_name=$4, enabled=$5, check_path=$6, expected_status=$7, public_url=$8, link_label=$9, check_level=$10, api_config=$11, script_content=$12
       WHERE id=$13
       RETURNING *`,
      [
        data.name,
        data.url,
        data.icon,
        data.group_name,
        data.enabled,
        data.check_path,
        data.expected_status,
        data.public_url,
        data.link_label,
        data.check_level ?? 1,
        data.api_config ? JSON.stringify(data.api_config) : null,
        data.script_content || null,
        data.id,
      ]
    );
    return rows[0] ?? null;
  } finally {
    await client.end().catch(() => {});
  }
}

export async function deleteService(id: string): Promise<void> {
  const client = getClient();
  try {
    await client.connect();
    await client.query(`DELETE FROM service_checks WHERE id = $1`, [id]);
  } finally {
    await client.end().catch(() => {});
  }
}

export async function getServicesForDashboard(): Promise<DashboardData> {
  const client = getClient();
  try {
    await client.connect();

    const [servicesRes, latestRes, timelineRes] = await Promise.all([
      client.query(
        `SELECT id, name, icon, group_name, enabled, public_url, link_label, check_level
         FROM service_checks
         ORDER BY group_name, name`
      ),
      client.query(`
        SELECT DISTINCT ON (service_id) service_id, latency_ms, status_code, ok, error_message, checked_at
        FROM check_results
        ORDER BY service_id, checked_at DESC
      `),
      client.query(`
        SELECT service_id, latency_ms, status_code, ok, checked_at
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY service_id ORDER BY checked_at DESC) as rn
          FROM check_results
        ) sub WHERE rn <= 24
        ORDER BY service_id, checked_at ASC
      `),
    ]);

    const services: PublicService[] = servicesRes.rows.map((serviceRow) => {
      const latest = latestRes.rows.find((row) => row.service_id === serviceRow.id);
      const timeline: TimelinePoint[] = timelineRes.rows
        .filter((row) => row.service_id === serviceRow.id)
        .map((row) => ({
          latency: row.latency_ms,
          status: row.status_code,
          ok: row.ok,
          checkedAt: row.checked_at,
        }));

      return {
        id: serviceRow.id,
        name: serviceRow.name,
        icon: serviceRow.icon,
        group: serviceRow.group_name,
        enabled: serviceRow.enabled,
        publicUrl: serviceRow.public_url,
        linkLabel: serviceRow.link_label || '访问',
        checkLevel: (serviceRow.check_level ?? 1) as CheckLevel,
        latest: latest
          ? {
              latency: latest.latency_ms,
              status: latest.status_code,
              ok: latest.ok,
              error: latest.error_message,
              checkedAt: latest.checked_at,
            }
          : null,
        timeline,
      };
    });

    const groups = services.reduce<Record<string, PublicService[]>>((acc, service) => {
      if (!acc[service.group]) acc[service.group] = [];
      acc[service.group].push(service);
      return acc;
    }, {});

    return {
      groups,
      timestamp: Date.now(),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
