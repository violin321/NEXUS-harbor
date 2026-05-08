import { NextResponse } from 'next/server';

const APP_VERSION = process.env.npm_package_version || process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'nexus-harbor',
    version: APP_VERSION,
    timestamp: Date.now(),
  });
}
