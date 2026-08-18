import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function POST(req: NextRequest) {
  try {
    // ============================================
    // 1️⃣ استقبال البيانات من الواجهة
    // ============================================
    const {
      ticketNumber,
      userId,        // ✅ نحتاج userId من الواجهة
      userName,
      userPhone,
      contactPhone,
      paymentMethod,
      receiptImage,
      notes,
    } = await req.json();

    // التحقق من الحقول المطلوبة (بما فيها userId)
    if (!ticketNumber || !userId || !userName || !userPhone || !contactPhone || !paymentMethod || !receiptImage) {
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

      // تحديث البطاقة مع ربطها بالمستخدم
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
          userId, // ✅ userId من الواجهة
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
