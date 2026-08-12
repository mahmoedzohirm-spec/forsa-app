import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

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
      // تحديث جميع البطاقات المرتبطة بـ booking_id إلى 'sold'
      const updateResult = await client.query(
        `UPDATE tickets 
         SET status = 'sold', updated_at = NOW() 
         WHERE booking_id = $1 AND status = 'pending'
         RETURNING number`,
        [bookingId]
      );

      if (updateResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "لا توجد بطاقات معلقة بهذا الحجز" },
          { status: 404 }
        );
      }

      // تحديث حالة الحجز في جدول bookings
      await client.query(
        `UPDATE bookings SET status = 'approved' WHERE id = $1`,
        [bookingId]
      );

      return NextResponse.json({
        success: true,
        message: `تم قبول ${updateResult.rows.length} بطاقة بنجاح`,
        tickets: updateResult.rows.map((row) => row.number),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error approving batch:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
