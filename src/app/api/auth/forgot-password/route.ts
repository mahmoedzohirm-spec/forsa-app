import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const userResult = await client.query(
        "SELECT id, email FROM users WHERE email = $1",
        [email]
      );

      if (userResult.rows.length === 0) {
        // لأسباب أمنية، لا نخبر المستخدم أن البريد غير موجود
        return NextResponse.json({
          success: true,
          message: "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال كود التحقق",
        });
      }

      const user = userResult.rows[0];

      // إنشاء كود 6 أرقام
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // صالح لمدة 10 دقائق

      // حفظ الكود في قاعدة البيانات
      await client.query(
        "UPDATE users SET reset_code = $1, reset_code_expiry = $2 WHERE id = $3",
        [resetCode, resetCodeExpiry, user.id]
      );

      // إرسال البريد الإلكتروني
      const emailHtml = `
        <div style="direction: rtl; font-family: 'Cairo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f0a1c; border-radius: 16px; border: 1px solid rgba(124,58,237,0.3);">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 48px;">🔐</span>
            <h1 style="color: #f59e0b; font-weight: 900; margin: 10px 0;">فرصة العمر</h1>
          </div>
          
          <h2 style="color: #fff; font-weight: 700; margin-bottom: 20px;">🔑 كود التحقق</h2>
          
          <p style="color: #c4b5fd; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">
            مرحباً،
            <br /><br />
            استخدم الكود التالي لإعادة تعيين كلمة المرور الخاصة بك:
          </p>
          
          <div style="text-align: center; margin: 30px 0; padding: 20px; background: rgba(245, 158, 11, 0.1); border-radius: 12px; border: 2px dashed rgba(245, 158, 11, 0.4);">
            <span style="font-size: 48px; font-weight: 900; color: #fbbf24; letter-spacing: 8px; font-family: 'Inter', monospace;">
              ${resetCode}
            </span>
          </div>
          
          <p style="color: #9ca3af; font-size: 14px; line-height: 1.7;">
            هذا الكود صالح لمدة <strong style="color: #fbbf24;">10 دقائق</strong>.
            <br />
            إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد بأمان.
          </p>
          
          <hr style="border: 1px solid rgba(124,58,237,0.2); margin: 30px 0;" />
          
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            هذا بريد إلكتروني تلقائي، يرجى عدم الرد عليه.
            <br />
            © ${new Date().getFullYear()} فرصة العمر - جميع الحقوق محفوظة
          </p>
        </div>
      `;

      await sendEmail({
        to: email,
        subject: "🔑 كود التحقق - فرصة العمر",
        html: emailHtml,
      });

      return NextResponse.json({
        success: true,
        message: "تم إرسال كود التحقق إلى بريدك الإلكتروني",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}