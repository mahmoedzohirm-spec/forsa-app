import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import bcrypt from "bcryptjs";

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
        "SELECT id, name, email, phone, is_admin, created_at, password FROM users WHERE (email = $1 OR name = $1) AND is_admin = TRUE",
        [username]
      );
      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "بيانات المسؤول غير صحيحة" },
          { status: 401 }
        );
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(secretKey, user.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "بيانات المسؤول غير صحيحة" },
          { status: 401 }
        );
      }

      delete user.password;

      // ✅ حفظ Session المسؤول في Cookie (بدون JWT)
      const response = NextResponse.json({ success: true, user });
      response.cookies.set('adminSession', JSON.stringify(user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 يوم
        path: '/',
      });

      return response;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
