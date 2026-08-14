import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

// ✅ نظام Rate Limiting (تخزين في الذاكرة)
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // عدد الطلبات المسموحة
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 ثانية

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
  const method = request.method; // ✅ الحصول على نوع الطلب

  // ============================================
  // 1️⃣ Rate Limiting (لجميع الطلبات)
  // ============================================
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const now = Date.now();
  const rateKey = `${ip}:${pathname}`;
  const rateData = rateLimit.get(rateKey);

  if (rateData) {
    if (now > rateData.resetTime) {
      rateLimit.set(rateKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else if (rateData.count >= RATE_LIMIT) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'تم تجاوز عدد الطلبات المسموحة. الرجاء الانتظار دقيقة ثم المحاولة مرة أخرى.' 
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    } else {
      rateData.count++;
      rateLimit.set(rateKey, rateData);
    }
  } else {
    rateLimit.set(rateKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  }

  // ============================================
  // 2️⃣ حماية APIs الإدارية (فقط لـ POST, PUT, DELETE)
  // ============================================
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  // ✅ استثناء طلبات GET (عامة للقراءة)
  if (method === 'GET') {
    return NextResponse.next();
  }

  // ✅ التحقق من الصلاحيات لـ POST, PUT, DELETE
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
