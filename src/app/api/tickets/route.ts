import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';

export async function GET(req: NextRequest) {
  try {
    // استخراج page و limit من الـ URL
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '200');
    const offset = (page - 1) * limit;

    const client = await pool.connect();
    try {
      // ✅ جلب البطاقات مع Pagination
      const result = await client.query(
        `SELECT id, number, status, user_name, user_phone, contact_phone, 
                payment_method, notes, updated_at, user_id, receipt_image, booking_id
         FROM tickets 
         ORDER BY number ASC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      // ✅ جلب العدد الإجمالي للبطاقات (لحساب عدد الصفحات)
      const countResult = await client.query('SELECT COUNT(*) as total FROM tickets');
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      // ✅ إحصائيات البطاقات (available, pending, sold)
      const statsResult = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold
        FROM tickets
      `);
      const stats = statsResult.rows[0];

      // ✅ التعديل: إزالة الكاش نهائياً عشان التحديث الفوري
      return NextResponse.json(
        {
          success: true,
          tickets: result.rows,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
          },
          counts: {
            total: stats.total || '0',
            available: stats.available || '0',
            pending: stats.pending || '0',
            sold: stats.sold || '0',
          },
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate', // ✅ بدون كاش
          },
        }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API /tickets GET error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
