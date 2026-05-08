import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, toAuthErrorResponse } from '@/modules/auth/server';
import { createService, deleteService, listServices, updateService } from '@/modules/services';

export async function GET() {
  try {
    await requireAdmin();
    const rows = await listServices();
    return NextResponse.json(rows);
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
    const { action, data, id } = body;

    if (action === 'create') {
      const created = await createService(data);
      return NextResponse.json(created);
    }

    if (action === 'update') {
      const updated = await updateService(data);
      return NextResponse.json(updated);
    }

    if (action === 'delete') {
      await deleteService(id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    const authResponse = toAuthErrorResponse(e);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
