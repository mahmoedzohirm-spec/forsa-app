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
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const token = await getTokenFromCookies();
  if (!token) {
    return NextResponse.json(
      { error: 'غير مصرح، يرجى تسجيل الدخول' },
      { status: 401 }
    );
  }

  const decoded = verifyToken(token);
  if (!decoded?.is_admin) {
    return NextResponse.json(
      { error: 'صلاحيات غير كافية' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
