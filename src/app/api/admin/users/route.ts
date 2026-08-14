import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";

export async function GET() {
  const token = await getTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const decoded = verifyToken(token);
  if (!decoded?.is_admin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, name, email, phone, is_admin, is_banned, created_at
         FROM users
         ORDER BY created_at DESC
         LIMIT 1000`
      );
      return NextResponse.json({ success: true, users: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/users GET error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
