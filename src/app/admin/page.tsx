import { AdminDashboard } from "@/components/admin/dashboard";
import { appConfig } from "@/lib/config";
import { createDbClient } from "@/lib/db";
import { requireAdmin } from "@/modules/auth/server";
import { ensureAppSettingsTable } from "@/modules/settings";
import { getSetupStatus } from "@/modules/setup";

function getLocalClient() {
  return createDbClient();
}

export default async function AdminPage() {
  await requireAdmin({ redirectTo: "/admin/login" });

  const setupStatus = await getSetupStatus();

  // Fetch from local PG (not Supabase)
  const client = getLocalClient();
  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT id, name, url, icon, group_name, enabled, check_path, expected_status, public_url, link_label, check_level, created_at FROM service_checks ORDER BY group_name, name`
    );
    await ensureAppSettingsTable(client);
    const settingsRes = await client.query(`SELECT value FROM app_settings WHERE key = 'system_status_public'`);
    const initialSettings = {
      systemStatusPublic: settingsRes.rows[0]?.value !== 'false',
      demoMode: appConfig.demoMode,
      demoReadOnly: appConfig.demoReadOnly,
    };
    await client.end();
    return <AdminDashboard initialServices={rows} initialSettings={initialSettings} initialSetupStatus={setupStatus} />;
  } catch (e) {
    await client.end().catch(() => {});
    console.error("[/admin] Failed to fetch services:", (e as Error).message);
    return <AdminDashboard initialServices={[]} initialSettings={{ systemStatusPublic: true, demoMode: appConfig.demoMode, demoReadOnly: appConfig.demoReadOnly }} initialSetupStatus={setupStatus} />;
  }
}
