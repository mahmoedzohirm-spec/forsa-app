import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW = 60 * 1000;

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
  // 2️⃣ السماح بكل الطلبات (بدون أي تحقق توكن)
  // ============================================
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
