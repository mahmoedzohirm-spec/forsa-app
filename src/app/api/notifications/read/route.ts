import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

function getUserIdFromRequest(req: NextRequest): number | null {
  try {
    const cookie = req.cookies.get("user");
    if (cookie) {
      const userData = JSON.parse(decodeURIComponent(cookie.value));
      return userData.id;
    }
    return null;
  } catch {
    return null;
  }
}

export async function PUT(req: NextRequest) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "غير مصرح" },
      { status: 401 }
    );
  }

  try {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );

      return NextResponse.json({
        success: true,
        message: "تم تحديد جميع الإشعارات كمقروءة",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}