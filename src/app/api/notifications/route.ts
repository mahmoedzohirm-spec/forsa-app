import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { sendPushNotification } from "@/lib/firebase-admin";

// ===== POST: إرسال إشعار (داخلي + Push) =====
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
      // 1️⃣ إدراج الإشعار الداخلي (الجرس)
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, title, message, type, data || null]
      );

      // 2️⃣ إرسال إشعار الدفع (Push)
      const pushTokenResult = await client.query(
        "SELECT push_token FROM users WHERE id = $1",
        [userId]
      );
      const pushToken = pushTokenResult.rows[0]?.push_token;
      if (pushToken) {
        await sendPushNotification(pushToken, title, message, data);
      }

      return NextResponse.json({
        success: true,
        message: "تم إرسال الإشعار (داخلي + Push)",
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

// ===== GET: جلب الإشعارات لمستخدم =====
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, title, message, type, is_read, data, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [parseInt(userId)]
      );
      return NextResponse.json({ success: true, notifications: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}