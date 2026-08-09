import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function POST(req: NextRequest) {
  try {
    const { userId, title, message, type, data } = await req.json();

    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { success: false, error: "البيانات غير مكتملة" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, title, message, type, data || null]
      );
      return NextResponse.json({
        success: true,
        message: "تم إرسال الإشعار",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}