import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني والكود مطلوبان" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const userResult = await client.query(
        `SELECT id FROM users 
         WHERE email = $1 AND reset_code = $2 AND reset_code_expiry > NOW()`,
        [email, code]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "الكود غير صالح أو منتهي الصلاحية" },
          { status: 400 }
        );
      }

      const user = userResult.rows[0];

      // إنشاء token آمن لإعادة التعيين
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // صالح لمدة 15 دقيقة

      // حفظ token في قاعدة البيانات ومسح الكود
      await client.query(
        `UPDATE users 
         SET reset_token = $1, reset_token_expiry = $2, reset_code = NULL, reset_code_expiry = NULL
         WHERE id = $3`,
        [resetToken, resetTokenExpiry, user.id]
      );

      return NextResponse.json({
        success: true,
        token: resetToken,
        message: "تم التحقق بنجاح",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}