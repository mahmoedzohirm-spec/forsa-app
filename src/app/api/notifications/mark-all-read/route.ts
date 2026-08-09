import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function PUT(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 401 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
        [parseInt(userId)]
      );
      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("PUT /api/notifications/mark-all-read error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}