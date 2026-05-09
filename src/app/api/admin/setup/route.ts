import { NextResponse } from 'next/server';
import { requireAdmin, toAuthErrorResponse } from '@/modules/auth/server';
import { getSetupStatus } from '@/modules/setup/status';

export async function GET() {
  try {
    await requireAdmin();
    const status = await getSetupStatus();
    return NextResponse.json(status);
  } catch (e) {
    const authResponse = toAuthErrorResponse(e);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
