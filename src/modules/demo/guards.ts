import { NextResponse } from 'next/server';
import { isDemoReadOnly } from '@/modules/demo';

export function createDemoReadOnlyResponse() {
  return NextResponse.json(
    {
      error: 'Demo mode is read-only',
      code: 'DEMO_READ_ONLY',
    },
    { status: 403 }
  );
}

export function enforceDemoReadOnly() {
  if (isDemoReadOnly()) {
    throw createDemoReadOnlyResponse();
  }
}
