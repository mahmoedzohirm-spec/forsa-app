import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function POST(req: NextRequest) {
  try {
    const { username, secretKey } = await req.json();
    if (!username || !secretKey) {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم والمفتاح السري مطلوبان" },
        { status: 400 }
      );
    }
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, name, email, phone, is_admin, created_at FROM users WHERE (email = $1 OR name = $1) AND password = $2 AND is_admin = TRUE",
        [username, secretKey]
      );
      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "بيانات المسؤول غير صحيحة" },
          { status: 401 }
        );
      }
      return NextResponse.json({ success: true, user: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
