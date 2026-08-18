import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { sendPushNotification } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "معرف الحجز (booking_id) مطلوب" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // 1. جلب البطاقات المعلقة لهذا الحجز مع بيانات المستخدمين
      const ticketsResult = await client.query(
        `SELECT t.number, t.user_id, u.name, u.push_token
         FROM tickets t
         LEFT JOIN users u ON t.user_id = u.id
         WHERE t.booking_id = $1 AND t.status = 'pending'`,
        [bookingId]
      );

      if (ticketsResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "لا توجد بطاقات معلقة بهذا الحجز" },
          { status: 404 }
        );
      }

      const tickets = ticketsResult.rows;
      const ticketNumbers = tickets.map(t => t.number);

      // 2. تحديث حالة البطاقات إلى 'sold'
      await client.query(
        `UPDATE tickets 
         SET status = 'sold', updated_at = NOW() 
         WHERE booking_id = $1 AND status = 'pending'`,
        [bookingId]
      );

      // 3. تحديث حالة الحجز في جدول bookings
      await client.query(
        `UPDATE bookings SET status = 'approved' WHERE id = $1`,
        [bookingId]
      );

      // 4. إرسال إشعارات للمستخدمين
      const pushPromises = tickets
        .filter(t => t.push_token)
        .map(t => 
          sendPushNotification(
            t.push_token,
            "✅ تم قبول طلبك",
            `تم قبول بطاقتك رقم #${t.number}`
          ).catch(err => console.error(`❌ Failed to send push to user ${t.user_id}:`, err))
        );

      await Promise.allSettled(pushPromises);

      // 5. إرجاع الرد مع التفاصيل
      return NextResponse.json({
        success: true,
        message: `تم قبول ${tickets.length} بطاقة بنجاح`,
        bookingId,
        acceptedTickets: ticketNumbers,
        totalAccepted: tickets.length,
        // معلومات إضافية للمسؤول
        details: tickets.map(t => ({
          ticketNumber: t.number,
          userName: t.name || "غير معروف",
          userId: t.user_id,
        })),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Error in batch approve:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
