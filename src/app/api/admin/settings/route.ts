import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, toAuthErrorResponse } from '@/modules/auth/server';
import { getBooleanSetting, setBooleanSetting } from '@/modules/settings';

const SYSTEM_STATUS_PUBLIC_KEY = 'system_status_public';

export async function GET() {
  try {
    await requireAdmin();
    const systemStatusPublic = await getBooleanSetting(SYSTEM_STATUS_PUBLIC_KEY, true);
    return NextResponse.json({ systemStatusPublic });
  } catch (e) {
    const authResponse = toAuthErrorResponse(e);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    await setBooleanSetting(SYSTEM_STATUS_PUBLIC_KEY, !!body.systemStatusPublic);
    return NextResponse.json({ ok: true, systemStatusPublic: !!body.systemStatusPublic });
  } catch (e) {
    const authResponse = toAuthErrorResponse(e);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
