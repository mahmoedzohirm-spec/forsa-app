import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { sendPushNotification } from "@/lib/firebase-admin"; 

export async function POST(req: NextRequest) {
  try {
    const { ticketNumber } = await req.json();
    if (!ticketNumber) {
      return NextResponse.json(
        { success: false, error: "رقم البطاقة مطلوب" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // جلب بيانات البطاقة والمستخدم
      const ticketResult = await client.query(
        `SELECT t.number, t.user_id, u.name, u.push_token
         FROM tickets t
         LEFT JOIN users u ON t.user_id = u.id
         WHERE t.number = $1`,
        [ticketNumber]
      );

      if (ticketResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "البطاقة غير موجودة" },
          { status: 404 }
        );
      }

      const ticket = ticketResult.rows[0];

      // تحديث الحالة
      await client.query(
        "UPDATE tickets SET status = 'sold', updated_at = NOW() WHERE number = $1",
        [ticketNumber]
      );

      // إرسال إشعار للمستخدم (إذا كان لديه push_token)
      if (ticket.push_token) {
        try {
          await sendPushNotification(
            ticket.push_token,
            "✅ تم قبول طلبك",
            `تم قبول طلبك للبطاقة رقم #${ticketNumber}`
          );
        } catch (pushError) {
          console.error("❌ Push notification error:", pushError);
        }
      }

      return NextResponse.json({
        success: true,
        message: "تمت الموافقة على الطلب وإرسال إشعار للمستخدم",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Approve error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
