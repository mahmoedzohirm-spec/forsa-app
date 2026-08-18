import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { sendPushNotification } from "@/lib/firebase-admin"; // ✅ إضافة الاستيراد

export async function POST(req: NextRequest) {
  try {
    const { ticketNumber, reason } = await req.json();
    if (!ticketNumber) {
      return NextResponse.json(
        { success: false, error: "رقم البطاقة مطلوب" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // 1️⃣ جلب بيانات البطاقة والمستخدم (لإرسال الإشعار)
      const ticketResult = await client.query(
        `SELECT t.number, t.user_id, u.name, u.push_token
         FROM tickets t
         LEFT JOIN users u ON t.user_id = u.id
         WHERE t.number = $1`,
        [ticketNumber]
      );

      const ticket = ticketResult.rows[0];

      // 2️⃣ تحديث حالة البطاقة إلى 'available' (رفض)
      await client.query(
        `UPDATE tickets SET
          status = 'available',
          user_id = NULL,
          user_name = NULL,
          user_phone = NULL,
          contact_phone = NULL,
          payment_method = NULL,
          receipt_image = NULL,
          notes = NULL,
          rejection_reason = $1,
          updated_at = NOW()
        WHERE number = $2`,
        [reason || "تم رفض الطلب", ticketNumber]
      );

      // 3️⃣ إرسال إشعار للمستخدم (إذا كان لديه push_token)
      if (ticket?.push_token) {
        try {
          await sendPushNotification(
            ticket.push_token,
            "❌ تم رفض طلبك",
            `تم رفض طلبك للبطاقة رقم #${ticketNumber}`
          );
        } catch (pushError) {
          console.error("❌ Push notification error:", pushError);
        }
      }

      return NextResponse.json({
        success: true,
        message: "تم رفض الطلب وإرسال إشعار للمستخدم",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Reject error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
