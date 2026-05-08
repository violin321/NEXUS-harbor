import { NextResponse } from 'next/server';
import { requireAdmin, toAuthErrorResponse } from '@/modules/auth/server';
import { collectSystemInfo } from '@/modules/system';

export async function GET() {
  try {
    await requireAdmin();
    const data = await collectSystemInfo();
    return NextResponse.json(data);
  } catch (e) {
    const authResponse = toAuthErrorResponse(e);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
