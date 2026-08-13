import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import bcrypt from "bcryptjs";
import { generateToken, setTokenCookie } from "@/lib/auth"; // ✅ استيراد الدوال الجديدة

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني/اسم المستخدم وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // البحث باستخدام البريد الإلكتروني أو اسم المستخدم
      const result = await client.query(
        `SELECT id, name, email, phone, is_admin, is_banned, created_at, password 
         FROM users 
         WHERE email = $1 OR name = $1`,
        [email]
      );
      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "بيانات الدخول غير صحيحة" },
          { status: 401 }
        );
      }

      const user = result.rows[0];
      if (user.is_banned) {
        return NextResponse.json(
          { success: false, error: "هذا الحساب محظور" },
          { status: 403 }
        );
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "بيانات الدخول غير صحيحة" },
          { status: 401 }
        );
      }

      // ✅ حذف كلمة المرور من الكائن
      delete user.password;

      // ✅ توليد توكن JWT وحفظه في HttpOnly Cookie
      const token = generateToken(user);
      setTokenCookie(token);

      // ✅ إرجاع البيانات مع نجاح العملية
      return NextResponse.json({ success: true, user });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
