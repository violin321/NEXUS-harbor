import { NextRequest, NextResponse } from 'next/server';
import { createDbClient } from '@/lib/db';
import { requireSession, toAuthErrorResponse } from '@/modules/auth/server';

function getLocalClient() {
  return createDbClient();
}

export async function GET() {
  try {
    const { user } = await requireSession();

    const client = getLocalClient();
    try {
      await client.connect();
      const { rows } = await client.query(
        `SELECT user_id, display_name, avatar_url, preferences, github_username, created_at FROM user_profiles WHERE user_id = $1`,
        [user.id]
      );
      await client.end();

      const profile = rows[0] || {};
      return NextResponse.json({
        user_id: user.id,
        email: user.email,
        display_name: profile.display_name || '',
        avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || '',
        github_username: profile.github_username || user.user_metadata?.user_name || '',
        preferences: profile.preferences || { theme: 'system' },
        created_at: profile.created_at || user.created_at,
      });
    } catch (e) {
      await client.end().catch(() => {});
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  } catch (e) {
    const authResponse = toAuthErrorResponse(e);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, session } = await requireSession();
    if (!user || !session) {
      return NextResponse.json({ error: '未登录或会话已过期' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '无效的请求数据' }, { status: 400 });
    }

    const client = getLocalClient();
    try {
      await client.connect();

      await client.query(
        `INSERT INTO user_profiles (user_id, display_name, preferences)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET
           display_name = $2,
           preferences = COALESCE($3, user_profiles.preferences),
           updated_at = NOW()`,
        [
          user.id,
          body.display_name || null,
          body.preferences ? JSON.stringify(body.preferences) : null,
        ]
      );
      await client.end();
      return NextResponse.json({ ok: true });
    } catch (e: any) {
      await client.end().catch(() => {});
      console.error('[profile PATCH] Error:', e?.message);
      return NextResponse.json({ error: e?.message || '数据库错误' }, { status: 500 });
    }
  } catch (e) {
    const authResponse = toAuthErrorResponse(e);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
