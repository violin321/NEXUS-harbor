import { NextResponse } from 'next/server';
import { getServicesForDashboard } from '@/modules/services';

export async function GET() {
  try {
    const data = await getServicesForDashboard();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
