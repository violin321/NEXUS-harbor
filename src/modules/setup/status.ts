import { createDbClient } from '@/lib/db';

export type SetupState = 'complete' | 'action_required' | 'warning' | 'error';

export interface SetupItem {
  key: string;
  label: string;
  status: SetupState;
  message: string;
  command?: string;
}

export interface SetupStatus {
  generatedAt: string;
  overallStatus: SetupState;
  items: SetupItem[];
}

function isTruthy(value?: string): boolean {
  if (!value) return false;

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function hasValue(value?: string): boolean {
  return !!value?.trim();
}

function getOverallStatus(items: SetupItem[]): SetupState {
  if (items.some((item) => item.status === 'error')) return 'error';
  if (items.some((item) => item.status === 'action_required')) return 'action_required';
  if (items.some((item) => item.status === 'warning')) return 'warning';
  return 'complete';
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const items: SetupItem[] = [];

  const supabaseUrlConfigured = hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKeyConfigured = hasValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceRoleConfigured = hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const databaseUrlConfigured = hasValue(process.env.DATABASE_URL);
  const siteUrlConfigured = hasValue(process.env.NEXT_PUBLIC_SITE_URL);
  const adminEmailsConfigured = hasValue(process.env.ADMIN_EMAILS);
  const adminUserIdsConfigured = hasValue(process.env.ADMIN_USER_IDS);
  const adminAllowlistConfigured = adminEmailsConfigured || adminUserIdsConfigured;
  const allowUnrestrictedAdmin = isTruthy(process.env.ALLOW_UNRESTRICTED_ADMIN);

  items.push({
    key: 'env.supabase_url',
    label: 'NEXT_PUBLIC_SUPABASE_URL',
    status: supabaseUrlConfigured ? 'complete' : 'action_required',
    message: supabaseUrlConfigured ? '已配置。' : '未配置，登录能力不可用。',
    command: supabaseUrlConfigured ? undefined : 'cp .env.example .env.local',
  });

  items.push({
    key: 'env.supabase_anon_key',
    label: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    status: supabaseAnonKeyConfigured ? 'complete' : 'action_required',
    message: supabaseAnonKeyConfigured ? '已配置。' : '未配置，浏览器端认证不可用。',
    command: supabaseAnonKeyConfigured ? undefined : 'cp .env.example .env.local',
  });

  items.push({
    key: 'env.supabase_service_role',
    label: 'SUPABASE_SERVICE_ROLE_KEY',
    status: serviceRoleConfigured ? 'complete' : 'action_required',
    message: serviceRoleConfigured ? '已配置。' : '未配置，部分服务端认证/管理能力将不可用。',
    command: serviceRoleConfigured ? undefined : 'cp .env.example .env.local',
  });

  items.push({
    key: 'env.site_url',
    label: 'NEXT_PUBLIC_SITE_URL',
    status: siteUrlConfigured ? 'complete' : 'warning',
    message: siteUrlConfigured ? '已配置。' : '未配置，将回退到 http://localhost:3000。公开部署前请显式设置。',
    command: siteUrlConfigured ? undefined : 'cp .env.example .env.local',
  });

  items.push({
    key: 'env.database_url',
    label: 'DATABASE_URL',
    status: databaseUrlConfigured ? 'complete' : 'action_required',
    message: databaseUrlConfigured ? '已配置。' : '未配置，数据库驱动的功能会直接失败。',
    command: databaseUrlConfigured ? undefined : 'cp .env.example .env.local',
  });

  items.push({
    key: 'admin.allowlist',
    label: '管理员 allowlist',
    status: adminAllowlistConfigured ? 'complete' : allowUnrestrictedAdmin ? 'warning' : 'action_required',
    message: adminAllowlistConfigured
      ? '已配置 ADMIN_EMAILS 和/或 ADMIN_USER_IDS，admin 保持 fail-closed。'
      : allowUnrestrictedAdmin
        ? '未配置 allowlist，但已显式开启 ALLOW_UNRESTRICTED_ADMIN=true。仅建议本地临时调试使用。'
        : '未配置 ADMIN_EMAILS / ADMIN_USER_IDS，admin 将保持 fail-closed，直到显式配置。',
    command: adminAllowlistConfigured ? undefined : 'cp .env.example .env.local',
  });

  if (!databaseUrlConfigured) {
    items.push({
      key: 'db.connection',
      label: '数据库连接',
      status: 'action_required',
      message: '跳过检测：请先配置 DATABASE_URL。',
      command: 'psql "$DATABASE_URL" -f db/migrations/001_init.sql',
    });

    items.push({
      key: 'db.schema',
      label: '核心表结构',
      status: 'action_required',
      message: '跳过检测：数据库尚未配置。',
      command: 'psql "$DATABASE_URL" -f db/migrations/001_init.sql',
    });

    items.push({
      key: 'db.seed',
      label: '演示服务数据',
      status: 'action_required',
      message: '跳过检测：数据库尚未配置。',
      command: 'psql "$DATABASE_URL" -f db/seeds/demo.sql',
    });

    return {
      generatedAt: new Date().toISOString(),
      overallStatus: getOverallStatus(items),
      items,
    };
  }

  const client = createDbClient();

  try {
    await client.connect();

    items.push({
      key: 'db.connection',
      label: '数据库连接',
      status: 'complete',
      message: '连接成功。',
    });

    const tablesResult = await client.query<{ table_name: string }>(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])`,
      [['service_checks', 'check_results', 'app_settings', 'user_profiles']]
    );

    const existingTables = new Set(tablesResult.rows.map((row) => row.table_name));
    const requiredTables = ['service_checks', 'check_results', 'app_settings', 'user_profiles'];
    const missingTables = requiredTables.filter((tableName) => !existingTables.has(tableName));

    items.push({
      key: 'db.schema',
      label: '核心表结构',
      status: missingTables.length === 0 ? 'complete' : 'action_required',
      message: missingTables.length === 0
        ? '核心表已就绪。'
        : `缺少数据表：${missingTables.join(', ')}。请先执行 migration。`,
      command: missingTables.length === 0 ? undefined : 'psql "$DATABASE_URL" -f db/migrations/001_init.sql',
    });

    if (missingTables.includes('service_checks')) {
      items.push({
        key: 'db.seed',
        label: '演示服务数据',
        status: 'action_required',
        message: 'service_checks 表尚未创建，暂时无法检查是否已有演示数据。',
        command: 'psql "$DATABASE_URL" -f db/seeds/demo.sql',
      });
    } else {
      const serviceChecksResult = await client.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM service_checks');
      const serviceChecksCount = Number(serviceChecksResult.rows[0]?.count || '0');

      items.push({
        key: 'db.seed',
        label: '演示服务数据',
        status: serviceChecksCount > 0 ? 'complete' : 'action_required',
        message: serviceChecksCount > 0
          ? `service_checks 已有 ${serviceChecksCount} 条记录。`
          : 'service_checks 为空；首次启动建议导入 demo seed，避免 dashboard 没有任何服务。',
        command: serviceChecksCount > 0 ? undefined : 'psql "$DATABASE_URL" -f db/seeds/demo.sql',
      });
    }
  } catch (error) {
    console.error('[setup] Database readiness check failed:', error instanceof Error ? error.message : error);

    items.push({
      key: 'db.connection',
      label: '数据库连接',
      status: 'error',
      message: '连接失败。请检查 DATABASE_URL 是否已配置、数据库是否可达，以及凭据是否正确。',
      command: 'psql "$DATABASE_URL" -f db/migrations/001_init.sql',
    });

    items.push({
      key: 'db.schema',
      label: '核心表结构',
      status: 'action_required',
      message: '数据库连接失败，无法确认 migration 是否已执行。',
      command: 'psql "$DATABASE_URL" -f db/migrations/001_init.sql',
    });

    items.push({
      key: 'db.seed',
      label: '演示服务数据',
      status: 'action_required',
      message: '数据库连接失败，无法确认 seed 是否已导入。',
      command: 'psql "$DATABASE_URL" -f db/seeds/demo.sql',
    });
  } finally {
    await client.end().catch(() => {});
  }

  return {
    generatedAt: new Date().toISOString(),
    overallStatus: getOverallStatus(items),
    items,
  };
}
