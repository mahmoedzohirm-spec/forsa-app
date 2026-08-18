import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// قائمة المسارات الإدارية (المسموحة بدون توكن)
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
  '/api/admin/tickets/reset',
  '/api/admin/tickets/receipt',
];

// Rate Limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW = 60 * 1000;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ============================================
  // 1️⃣ Rate Limiting
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
  // 2️⃣ السماح للمسارات الإدارية (بدون توكن)
  // ============================================
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (isAdminRoute) {
    return NextResponse.next();
  }

  // ============================================
  // 3️⃣ استثناء مسار تسجيل الدخول
  // ============================================
  if (pathname === '/api/auth/login') {
    return NextResponse.next();
  }

  // ============================================
  // 4️⃣ التحقق من التوكن لباقي المسارات
  // ============================================
  try {
    const token = request.cookies.get('token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'غير مصرح. الرجاء تسجيل الدخول.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return new NextResponse(
        JSON.stringify({ error: 'توكن غير صالح أو منتهي الصلاحية.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error('❌ Middleware error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'خطأ في المصادقة.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
