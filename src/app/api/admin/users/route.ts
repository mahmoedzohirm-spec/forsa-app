import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function GET() {
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
