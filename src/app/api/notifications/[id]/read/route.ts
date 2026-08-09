import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // 👈 تأكد من أن params هو Promise
) {
  try {
    const { id } = await params;  // 👈 استخدم await لاستخراج id
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 401 }
      );
    }

    const notificationId = parseInt(id);
    if (isNaN(notificationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid notification ID" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE notifications SET is_read = TRUE
         WHERE id = $1 AND user_id = $2`,
        [notificationId, parseInt(userId)]
      );
      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("PUT /api/notifications/[id]/read error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}