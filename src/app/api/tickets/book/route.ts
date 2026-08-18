import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { verifyToken } from "@/lib/auth"; // استيراد دالة التحقق من التوكن

export async function POST(req: NextRequest) {
  try {
    // ============================================
    // 1️⃣ استخراج التوكن والتحقق منه
    // ============================================
    const token =
      req.cookies.get('token')?.value ||
      req.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, error: "توكن غير صالح أو منتهي الصلاحية" },
        { status: 401 }
      );
    }

    const userId = decoded.id; // ✅ معرف المستخدم من التوكن

    // ============================================
    // 2️⃣ استقبال البيانات من الواجهة
    // ============================================
    const {
      ticketNumber,
      userName,
      userPhone,
      contactPhone,
      paymentMethod,
      receiptImage,
      notes,
    } = await req.json();

    // التحقق من الحقول المطلوبة
    if (!ticketNumber || !userName || !userPhone || !contactPhone || !paymentMethod || !receiptImage) {
      return NextResponse.json(
        { success: false, error: "جميع الحقول المطلوبة يجب تعبئتها" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // بدء المعاملة
      await client.query("BEGIN");

      // التحقق من توفر البطاقة
      const ticketCheck = await client.query(
        "SELECT status FROM tickets WHERE number = $1 FOR UPDATE",
        [ticketNumber]
      );
      if (ticketCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "البطاقة غير موجودة" },
          { status: 404 }
        );
      }
      if (ticketCheck.rows[0].status !== "available") {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "هذه البطاقة غير متاحة" },
          { status: 409 }
        );
      }

      // تحديث البطاقة مع ربطها بالمستخدم الحقيقي
      await client.query(
        `UPDATE tickets SET
          status = 'pending',
          user_id = $1,
          user_name = $2,
          user_phone = $3,
          contact_phone = $4,
          payment_method = $5,
          receipt_image = $6,
          notes = $7,
          updated_at = NOW()
        WHERE number = $8`,
        [
          userId, // ✅ الآن userId مؤكد وصحيح
          userName,
          userPhone,
          contactPhone,
          paymentMethod,
          receiptImage,
          notes || null,
          ticketNumber,
        ]
      );

      await client.query("COMMIT");
      return NextResponse.json({
        success: true,
        message: "تم حجز البطاقة بنجاح وهي قيد المراجعة",
        booking: {
          ticketNumber,
          userId,
          userName,
          status: "pending",
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ API /tickets/book error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
