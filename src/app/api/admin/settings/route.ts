import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/lib/config';
import { requireAdmin, toAuthErrorResponse } from '@/modules/auth/server';
import { enforceDemoReadOnly } from '@/modules/demo/guards';
import { getBooleanSetting, setBooleanSetting } from '@/modules/settings';

const SYSTEM_STATUS_PUBLIC_KEY = 'system_status_public';

export async function GET() {
  try {
    await requireAdmin();
    const systemStatusPublic = await getBooleanSetting(SYSTEM_STATUS_PUBLIC_KEY, true);
    return NextResponse.json({ systemStatusPublic, demoMode: appConfig.demoMode, demoReadOnly: appConfig.demoReadOnly });
  } catch (e) {
    const authResponse = toAuthErrorResponse(e);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    enforceDemoReadOnly();
    const body = await req.json();
    await setBooleanSetting(SYSTEM_STATUS_PUBLIC_KEY, !!body.systemStatusPublic);
    return NextResponse.json({ ok: true, systemStatusPublic: !!body.systemStatusPublic });
  } catch (e) {
    if (e instanceof Response) return e;
    const authResponse = toAuthErrorResponse(e);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
