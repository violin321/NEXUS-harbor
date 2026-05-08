import { redirect } from 'next/navigation';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

function parseAllowlist(value?: string): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isTruthy(value?: string): boolean {
  if (!value) return false;

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function getAdminConfig() {
  const adminEmails = parseAllowlist(process.env.ADMIN_EMAILS);
  const adminUserIds = parseAllowlist(process.env.ADMIN_USER_IDS);
  const allowUnrestrictedAdmin = isTruthy(process.env.ALLOW_UNRESTRICTED_ADMIN);
  const configured = adminEmails.length > 0 || adminUserIds.length > 0;

  return {
    adminEmails,
    adminUserIds,
    configured,
    allowUnrestrictedAdmin,
  };
}

function isAdminUser(user: User): boolean {
  const { adminEmails, adminUserIds, configured, allowUnrestrictedAdmin } = getAdminConfig();

  if (!configured) {
    return allowUnrestrictedAdmin;
  }

  const email = user.email?.trim().toLowerCase();
  const userId = user.id.trim().toLowerCase();

  return (email ? adminEmails.includes(email) : false) || adminUserIds.includes(userId);
}

export interface SessionContext {
  session: Session;
  user: User;
  isAdmin: boolean;
  adminAllowlistConfigured: boolean;
  allowUnrestrictedAdmin: boolean;
}

export async function getCurrentSession(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { configured, allowUnrestrictedAdmin } = getAdminConfig();

  return {
    session,
    user: session.user,
    isAdmin: isAdminUser(session.user),
    adminAllowlistConfigured: configured,
    allowUnrestrictedAdmin,
  };
}

export async function requireSession(options?: { redirectTo?: string }): Promise<SessionContext> {
  const context = await getCurrentSession();

  if (!context) {
    if (options?.redirectTo) {
      redirect(options.redirectTo);
    }

    throw new AuthError(401, '未登录');
  }

  return context;
}

export async function requireAdmin(options?: { redirectTo?: string }): Promise<SessionContext> {
  const context = await requireSession(options);

  if (!context.isAdmin) {
    if (options?.redirectTo) {
      redirect(options.redirectTo);
    }

    const message = !context.adminAllowlistConfigured && !context.allowUnrestrictedAdmin
      ? '需要管理员权限：请配置 ADMIN_EMAILS 或 ADMIN_USER_IDS；仅限本地临时调试时可显式设置 ALLOW_UNRESTRICTED_ADMIN=true'
      : '需要管理员权限';

    throw new AuthError(403, message);
  }

  return context;
}

export function toAuthErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    });
  }

  return null;
}
