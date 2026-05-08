import { Client } from 'pg';
import { createDbClient } from '@/lib/db';

function getClient() {
  return createDbClient();
}

export async function ensureAppSettingsTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function getBooleanSetting(key: string, defaultValue: boolean): Promise<boolean> {
  const client = getClient();
  try {
    await client.connect();
    await ensureAppSettingsTable(client);
    const { rows } = await client.query('SELECT value FROM app_settings WHERE key = $1', [key]);
    if (!rows[0]) return defaultValue;
    return rows[0].value === 'true';
  } finally {
    await client.end().catch(() => {});
  }
}

export async function setBooleanSetting(key: string, value: boolean) {
  const client = getClient();
  try {
    await client.connect();
    await ensureAppSettingsTable(client);
    await client.query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, value ? 'true' : 'false']
    );
  } finally {
    await client.end().catch(() => {});
  }
}
