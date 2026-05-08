import { NextResponse, type NextRequest } from 'next/server';

function isInternalIP(ip: string): boolean {
  return ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') || ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') || ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') || ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') || ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') || ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') || ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') || ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') || ip.startsWith('172.31.') ||
    ip.startsWith('127.') || ip.startsWith('::1') ||
    ip.startsWith('localhost');
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const forwarded = request.headers.get('x-forwarded-for');
  const host = request.headers.get('host') || '';
  const ip = forwarded?.split(',')[0]?.trim() || '';
  const isInternal = isInternalIP(ip)
    || host.startsWith('192.168.')
    || host.startsWith('10.')
    || host.startsWith('localhost')
    || host.startsWith('127.');

  response.cookies.set('network_type', isInternal ? 'internal' : 'external', {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
