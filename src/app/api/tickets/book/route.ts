import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function POST(req: NextRequest) {
  try {
    // ============================================
    // 1️⃣ استخراج userId من كوكي user
    // ============================================
    const userCookie = req.cookies.get('user')?.value;
    if (!userCookie) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    let userData;
    try {
      userData = JSON.parse(decodeURIComponent(userCookie));
    } catch {
      return NextResponse.json(
        { success: false, error: "بيانات المستخدم غير صالحة" },
        { status: 401 }
      );
    }

    const userId = userData.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "بيانات المستخدم غير مكتملة" },
        { status: 401 }
      );
    }

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

    if (!ticketNumber || !userName || !userPhone || !contactPhone || !paymentMethod || !receiptImage) {
      return NextResponse.json(
        { success: false, error: "جميع الحقول المطلوبة يجب تعبئتها" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

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
        [userId, userName, userPhone, contactPhone, paymentMethod, receiptImage, notes || null, ticketNumber]
      );

      await client.query("COMMIT");
      return NextResponse.json({
        success: true,
        message: "تم حجز البطاقة بنجاح وهي قيد المراجعة",
        booking: { ticketNumber, userId, userName, status: "pending" },
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
