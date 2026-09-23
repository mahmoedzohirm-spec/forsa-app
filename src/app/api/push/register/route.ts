import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function POST(req: NextRequest) {
  try {
    const { userId, subscription } = await req.json();

    if (!userId || !subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json(
        { success: false, error: "بيانات ناقصة" },
        { status: 400 }
      );
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { success: false, error: "بيانات الاشتراك ناقصة" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (endpoint) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           p256dh_key = EXCLUDED.p256dh_key,
           auth_key = EXCLUDED.auth_key,
           updated_at = CURRENT_TIMESTAMP`,
        [userId, endpoint, p256dh, auth]
      );

      return NextResponse.json({ success: true, message: "تم حفظ الاشتراك" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error registering push subscription:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ success: false, error: "endpoint مطلوب" }, { status: 400 });
    }
    await pool.query("DELETE FROM push_subscriptions WHERE endpoint = $1", [endpoint]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
