import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT value FROM app_settings WHERE key = 'draw_schedule'"
      );
      return NextResponse.json({
        success: true,
        schedule: result.rows[0]?.value || null,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("GET /api/admin/draw-schedule error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { schedule } = await req.json();

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: "الموعد مطلوب" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO app_settings (key, value)
         VALUES ('draw_schedule', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
        [schedule]
      );

      const usersResult = await client.query(
        "SELECT id FROM users WHERE is_banned = FALSE"
      );

      const title = "📢 موعد السحب القادم";
      const message = `تم تحديد موعد السحب القادم في: ${new Date(schedule).toLocaleString("ar-SA")}`;
      const type = "draw_announcement";

      for (const user of usersResult.rows) {
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type, data)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id, title, message, type, JSON.stringify({ schedule })]
        );
      }

      return NextResponse.json({
        success: true,
        message: `تم حفظ الموعد وإرسال إشعار لـ ${usersResult.rows.length} مستخدم`,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("POST /api/admin/draw-schedule error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
