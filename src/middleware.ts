import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

const adminRoutes = [
  '/api/admin',
  '/api/admin/announce',
  '/api/admin/draw',
  '/api/admin/draw-schedule',
  '/api/admin/payment-methods',
  '/api/admin/prizes',
  '/api/admin/settings',
  '/api/admin/users',
  '/api/admin/tickets',
  '/api/admin/tickets/approve',
  '/api/admin/tickets/reject',
  '/api/admin/tickets/approve-batch',
  '/api/admin/tickets/reject-batch',
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // ✅ استثناء طلبات GET (عامة للقراءة)
  if (method === 'GET') {
    return NextResponse.next();
  }

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
