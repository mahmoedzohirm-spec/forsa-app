import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { sendPushNotification } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { title, message, type } = await req.json();

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "العنوان والرسالة مطلوبان" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const usersResult = await client.query(
        "SELECT id, push_token FROM users WHERE is_banned = FALSE"
      );

      if (usersResult.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: "لا يوجد مستخدمين نشطين لإرسال الإشعار لهم",
        });
      }

      const insertPromises = usersResult.rows.map((user) => {
        return client.query(
          `INSERT INTO notifications (user_id, title, message, type, data)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id, title, message, type || "announcement", null]
        );
      });
      await Promise.all(insertPromises);

      const pushPromises = usersResult.rows
        .filter((user) => user.push_token)
        .map((user) => {
          return sendPushNotification(user.push_token, title, message);
        });

      await Promise.allSettled(pushPromises);

      return NextResponse.json({
        success: true,
        message: `تم إرسال الإشعار إلى ${usersResult.rows.length} مستخدم`,
        usersCount: usersResult.rows.length,
        pushCount: usersResult.rows.filter((u) => u.push_token).length,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Announcement error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
