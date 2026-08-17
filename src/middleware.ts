import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

// ✅ نظام Rate Limiting (تخزين في الذاكرة)
// ملاحظة: هذا الحل مناسب للبداية، لكن لو التطبيق كبر، أنصحك تستخدم Upstash Redis
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // عدد الطلبات المسموحة لكل IP في الدقيقة
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 ثانية

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
      // إعادة تعيين العداد
      rateLimit.set(rateKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else if (rateData.count >= RATE_LIMIT) {
      // تجاوز الحد الأقصى
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
  // 2️⃣ استثناء طلبات GET (عامة للقراءة)
  // ============================================
  if (method === 'GET') {
    return NextResponse.next();
  }

  // ============================================
  // 3️⃣ حماية APIs الإدارية
  // ============================================
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  // ✅ التحقق من Session المسؤول (بدون JWT)
  const adminSession = request.cookies.get('adminSession')?.value;
  if (adminSession) {
    try {
      const adminData = JSON.parse(adminSession);
      if (adminData.is_admin) {
        return NextResponse.next(); // السماح للمسؤول بدون توكن
      }
    } catch {
      // تجاهل
    }
  }

  // ✅ التحقق من التوكن للمستخدمين العاديين
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
