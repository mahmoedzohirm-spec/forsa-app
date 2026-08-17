import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function POST(req: NextRequest) {
  try {
    // 1. استقبال البيانات من الواجهة
    const {
      ticketNumbers,
      userName,
      userPhone,
      contactPhone,
      paymentMethod,
      receiptImage,
      notes,
    } = await req.json();

    // 2. التحقق من صحة البيانات
    if (!ticketNumbers || ticketNumbers.length === 0) {
      return NextResponse.json(
        { success: false, error: "لم يتم اختيار أي بطاقة" },
        { status: 400 }
      );
    }

    if (ticketNumbers.length > 100) {
      return NextResponse.json(
        { success: false, error: "لا يمكن حجز أكثر من 100 بطاقة في طلب واحد" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // 3. الحصول على أول مستخدم في قاعدة البيانات (المسؤول)
      const userResult = await client.query(
        "SELECT id FROM users ORDER BY id ASC LIMIT 1"
      );
      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "لا يوجد مستخدمين في النظام" },
          { status: 500 }
        );
      }
      const defaultUserId = userResult.rows[0].id;

      // 4. التحقق من توفر جميع البطاقات
      const checkQuery = `
        SELECT number FROM tickets 
        WHERE number = ANY($1::int[]) AND status = 'available'
      `;
      const checkResult = await client.query(checkQuery, [ticketNumbers]);

      if (checkResult.rows.length !== ticketNumbers.length) {
        const availableNumbers = checkResult.rows.map((row) => row.number);
        const notAvailable = ticketNumbers.filter(
          (num: number) => !availableNumbers.includes(num)
        );
        return NextResponse.json(
          {
            success: false,
            error: `البطاقات التالية غير متاحة أو محجوزة مسبقاً: ${notAvailable.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // 5. إنشاء سجل جديد في جدول bookings
      const bookingRes = await client.query(
        `INSERT INTO bookings (user_id, contact_phone, payment_method, total_tickets, status, created_at)
         VALUES ($1, $2, $3, $4, 'pending', NOW())
         RETURNING id`,
        [defaultUserId, contactPhone, paymentMethod, ticketNumbers.length]
      );
      const bookingId = bookingRes.rows[0].id;

      // 6. تحديث جميع البطاقات المختارة إلى 'pending'
      const updateQuery = `
        UPDATE tickets 
        SET status = 'pending', 
            user_id = $1, 
            user_name = $2,
            user_phone = $3,
            contact_phone = $4,
            payment_method = $5,
            booking_id = $6,
            notes = $7,
            receipt_image = $8,
            updated_at = NOW()
        WHERE number = ANY($9::int[])
        RETURNING number
      `;
      const updateResult = await client.query(updateQuery, [
        defaultUserId,
        userName || "مستخدم",
        userPhone || "",
        contactPhone,
        paymentMethod,
        bookingId,
        notes || "",
        receiptImage || "",
        ticketNumbers,
      ]);

      if (updateResult.rows.length !== ticketNumbers.length) {
        await client.query(`DELETE FROM bookings WHERE id = $1`, [bookingId]);
        return NextResponse.json(
          { success: false, error: "حدث خطأ أثناء تحديث البطاقات، يرجى المحاولة مرة أخرى" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `تم حجز ${ticketNumbers.length} بطاقة بنجاح`,
        bookingId: bookingId,
        tickets: ticketNumbers,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Error in multiple booking API:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ داخلي في الخادم" },
      { status: 500 }
    );
  }
}
