import { NextResponse } from 'next/server';
import { collectSystemInfo, sanitizeSystemInfo } from '@/modules/system';
import { getBooleanSetting } from '@/modules/settings';

const SYSTEM_STATUS_PUBLIC_KEY = 'system_status_public';

/**
 * Public system status API — controlled by admin setting.
 * Defaults to private and only exposes reduced, non-sensitive metrics when enabled.
 */
export async function GET() {
  try {
    const isPublic = await getBooleanSetting(SYSTEM_STATUS_PUBLIC_KEY, false);
    if (!isPublic) {
      return NextResponse.json({ error: '本机状态未公开' }, { status: 403 });
    }

    const data = await collectSystemInfo();
    return NextResponse.json(sanitizeSystemInfo(data));
  } catch {
    return NextResponse.json({ error: '本机状态未公开' }, { status: 403 });
  }
}
