import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import webpush from "web-push";

// تهيئة web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@forsa.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

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
      // 1️⃣ إدراج الإشعار الداخلي
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, title, message, type, data || null]
      );

      // 2️⃣ جلب اشتراكات Push للمستخدم
      const subsResult = await client.query(
        "SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = $1",
        [userId]
      );

      const payload = JSON.stringify({
        title,
        body: message,
        url: data?.url || "/",
        tag: type,
      });

      // 3️⃣ إرسال Push لكل اشتراك
      const results = [];
      for (const sub of subsResult.rows) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
            },
            payload
          );
          results.push({ endpoint: sub.endpoint, status: "sent" });
        } catch (err: any) {
          console.error("[Push] خطأ:", err.statusCode, err.body);
          // اشتراك منتهي → احذفه
          if (err.statusCode === 410 || err.statusCode === 404) {
            await client.query("DELETE FROM push_subscriptions WHERE endpoint = $1", [sub.endpoint]);
            results.push({ endpoint: sub.endpoint, status: "expired_removed" });
          } else {
            results.push({ endpoint: sub.endpoint, status: "failed", error: String(err) });
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "تم الإرسال",
        pushResults: results,
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

// ===== GET: جلب الإشعارات =====
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID مطلوب" }, { status: 400 });
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
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
