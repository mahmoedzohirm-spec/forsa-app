import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

// ✅ قائمة المسارات الإدارية
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

  // 1️⃣ استثناء طلبات GET (عامة للقراءة)
  if (method === 'GET') {
    return NextResponse.next();
  }

  // 2️⃣ التحقق من أن المسار إداري
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  // 3️⃣ التحقق من Session المسؤول (بدون JWT)
  const adminSession = request.cookies.get('adminSession')?.value;
  if (adminSession) {
    try {
      const adminData = JSON.parse(adminSession);
      if (adminData.is_admin) {
        return NextResponse.next(); // ✅ السماح للمسؤول بدون توكن
      }
    } catch {
      // تجاهل
    }
  }

  // 4️⃣ التحقق من التوكن للمستخدمين العاديين
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
