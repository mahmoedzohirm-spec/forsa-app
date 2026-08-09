import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function POST(req: NextRequest) {
  try {
    const { userId, ban } = await req.json();
    const client = await pool.connect();
    try {
      await client.query(
        "UPDATE users SET is_banned = $1 WHERE id = $2",
        [ban !== false, userId]
      );
      return NextResponse.json({ success: true, message: ban !== false ? "تم حظر المستخدم" : "تم رفع الحظر" });
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
