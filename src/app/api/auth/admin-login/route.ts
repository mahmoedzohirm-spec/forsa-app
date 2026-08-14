import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import bcrypt from "bcryptjs";
import { generateToken, setTokenCookie } from "@/lib/auth";

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
      // ✅ نبحث عن المستخدم أولاً
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
      
      // ✅ التحقق من كلمة المرور باستخدام bcrypt
      const isValid = await bcrypt.compare(secretKey, user.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "بيانات المسؤول غير صحيحة" },
          { status: 401 }
        );
      }

      delete user.password;

      // ✅ توليد التوكن وحفظه في الكوكي
      const token = generateToken(user);
      await setTokenCookie(token);

      return NextResponse.json({ success: true, user });
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
