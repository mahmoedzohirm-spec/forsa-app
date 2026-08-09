import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const existing = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (existing.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: "البريد الإلكتروني مسجل مسبقاً" },
          { status: 409 }
        );
      }

      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await client.query(
        `INSERT INTO users (name, email, phone, password)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, phone, is_admin, created_at`,
        [name, email, phone || null, hashedPassword]
      );
      return NextResponse.json({ success: true, user: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}