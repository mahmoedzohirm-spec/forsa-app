import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "الرمز وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const userResult = await client.query(
        `SELECT id FROM users 
         WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
        [token]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "الرمز غير صالح أو منتهي الصلاحية" },
          { status: 400 }
        );
      }

      const user = userResult.rows[0];

      // 🔐 تشفير كلمة المرور الجديدة
      const hashedPassword = await bcrypt.hash(password, 10);

      await client.query(
        `UPDATE users 
         SET password = $1, reset_token = NULL, reset_token_expiry = NULL 
         WHERE id = $2`,
        [hashedPassword, user.id]
      );

      return NextResponse.json({
        success: true,
        message: "تم إعادة تعيين كلمة المرور بنجاح",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}