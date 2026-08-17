import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

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
      return NextResponse.json({ success: true, message: "تم رفض الطلب" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
