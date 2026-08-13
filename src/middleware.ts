import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// قائمة الـ APIs التي تتطلب صلاحيات Admin
const adminRoutes = [
  '/api/admin',
  '/api/admin/users',
  '/api/admin/tickets/approve',
  '/api/admin/tickets/reject',
  '/api/admin/tickets/approve-batch',
  '/api/admin/tickets/reject-batch',
  '/api/admin/draw',
  '/api/admin/draw/clear',
  '/api/admin/prizes',
  '/api/admin/settings',
  '/api/admin/announce',
  '/api/payment-methods',
  '/api/admin/payment-methods',
  '/api/booking/multiple',
];

// Rate Limiting: تخزين مؤقت للطلبات
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW = 60 * 1000;

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;

  // ===== Rate Limiting =====
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const rateKey = `${ip}:${pathname}`;
  const rateData = rateLimit.get(rateKey);

  if (rateData) {
    if (now > rateData.resetTime) {
      rateLimit.set(rateKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else if (rateData.count >= RATE_LIMIT) {
      return new NextResponse(
        JSON.stringify({ error: 'الرجاء الانتظار قبل إرسال طلبات إضافية' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      rateData.count++;
      rateLimit.set(rateKey, rateData);
    }
  } else {
    rateLimit.set(rateKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  }

  // ===== التحقق من صلاحيات المسؤول =====
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (isAdminRoute) {
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'غير مصرح، يرجى تسجيل الدخول' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const decoded = verifyToken(token);
      if (!decoded || !decoded.is_admin) {
        return new NextResponse(
          JSON.stringify({ error: 'صلاحيات غير كافية' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      return new NextResponse(
        JSON.stringify({ error: 'توكن غير صالح' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // ===== CORS =====
  const response = NextResponse.next();
  const allowedOrigins = [
    'https://forsa-app-ten.vercel.app',
    'http://localhost:3000',
  ];
  const origin = request.headers.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
