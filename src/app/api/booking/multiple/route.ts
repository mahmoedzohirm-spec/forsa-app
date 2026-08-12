import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function POST(req: NextRequest) {
  try {
    // 1. استقبال البيانات من الواجهة
    const {
      ticketNumbers,
      userId,
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

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const client = await pool.connect();

    try {
      // 3. التحقق من توفر جميع البطاقات (أن تكون حالتها 'available')
      // نستخدم ANY($1) عشان نمرر المصفوفة كاملة
      const checkQuery = `
        SELECT number FROM tickets 
        WHERE number = ANY($1::int[]) AND status = 'available'
      `;
      const checkResult = await client.query(checkQuery, [ticketNumbers]);

      // 4. إذا كان عدد البطاقات المتاحة أقل من المطلوب، نحدد الأرقام غير المتاحة
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

      // 5. إنشاء سجل جديد في جدول bookings (طلب جماعي)
      const bookingRes = await client.query(
        `INSERT INTO bookings (user_id, contact_phone, payment_method, total_tickets, status, created_at)
         VALUES ($1, $2, $3, $4, 'pending', NOW())
         RETURNING id`,
        [userId, contactPhone, paymentMethod, ticketNumbers.length]
      );
      const bookingId = bookingRes.rows[0].id;

      // 6. تحديث جميع البطاقات المختارة إلى حالة 'pending' وربطها بـ booking_id
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
        userId,
        userName || "مستخدم",
        userPhone || "",
        contactPhone,
        paymentMethod,
        bookingId,
        notes || "",
        receiptImage || "",
        ticketNumbers,
      ]);

      // 7. التأكد من تحديث جميع البطاقات
      if (updateResult.rows.length !== ticketNumbers.length) {
        // لو حصل خطأ، نحذف الـ booking عشان ما يضل معلق
        await client.query(`DELETE FROM bookings WHERE id = $1`, [bookingId]);
        return NextResponse.json(
          { success: false, error: "حدث خطأ أثناء تحديث البطاقات، يرجى المحاولة مرة أخرى" },
          { status: 500 }
        );
      }

      // 8. إرجاع رسالة نجاح مع رقم الطلب وقائمة البطاقات
      return NextResponse.json({
        success: true,
        message: `تم حجز ${ticketNumbers.length} بطاقة بنجاح`,
        bookingId: bookingId,
        tickets: ticketNumbers,
      });
    } finally {
      client.release(); // تحرير الاتصال بقاعدة البيانات
    }
  } catch (error) {
    console.error("❌ Error in multiple booking API:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ داخلي في الخادم" },
      { status: 500 }
    );
  }
}
