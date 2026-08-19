import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

// ✅ الأرقام المثبتة (تُحدد في السيرفر فقط)
const FIXED_WINNERS = [1428, 4261];

// ✅ GET عام (يجلب البطاقات المباعة + يضيف الأرقام المثبتة تلقائياً)
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      // جلب البطاقات المباعة من قاعدة البيانات
      const tickets = await client.query(
        "SELECT number, user_name, contact_phone FROM tickets WHERE status = 'sold' ORDER BY number ASC LIMIT 5000"
      );
      
      let ticketsData = tickets.rows;
      
      // ✅ إضافة الأرقام المثبتة إذا لم تكن موجودة
      for (const fixedNumber of FIXED_WINNERS) {
        if (!ticketsData.some((t: any) => t.number === fixedNumber)) {
          ticketsData.push({
            number: fixedNumber,
            user_name: "مستخدم محدد",
            contact_phone: "0599999999",
          });
        }
      }
      
      const history = await client.query(
        "SELECT * FROM draw_history ORDER BY drawn_at DESC LIMIT 20"
      );
      
      return NextResponse.json({
        success: true,
        tickets: ticketsData,
        history: history.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/draw GET error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// ✅ POST (يسجل السحب مع ترتيب ثابت للأرقام المثبتة)
export async function POST(req: NextRequest) {
  try {
    const { prize, rangeStart, rangeEnd, ticketNumber, winnerName, winnerPhone } = await req.json();
    
    const client = await pool.connect();
    try {
      // 1️⃣ استعلم عن عدد السحوبات السابقة
      const countResult = await client.query(
        "SELECT COUNT(*) as count FROM draw_history"
      );
      const drawCount = parseInt(countResult.rows[0].count);

      // 2️⃣ استعلم عن جميع الأرقام التي فازت سابقاً (لاستبعادها)
      const wonNumbersResult = await client.query(
        "SELECT DISTINCT ticket_number FROM draw_history"
      );
      const wonNumbers = wonNumbersResult.rows.map((row: any) => row.ticket_number);

      let finalTicketNumber: number;
      let finalWinnerName: string;
      let finalWinnerPhone: string;

      // 3️⃣ تحديد الفائز بناءً على ترتيب السحب
      if (drawCount === 0) {
        // ✅ أول سحب → الرقم 1428 (ثابت)
        finalTicketNumber = 1428;
        finalWinnerName = "أمير كلاب";
        finalWinnerPhone = "0568261920";
      } else if (drawCount === 1) {
        // ✅ ثاني سحب → الرقم 4261 (ثابت)
        finalTicketNumber = 4261;
        finalWinnerName = "عمر قشطة";
        finalWinnerPhone = "0595210658";
      } else {
        // ✅ باقي السحوبات → عشوائي من البطاقات المباعة (ولم تفز سابقاً)
        // استعلم عن البطاقات المباعة (sold) التي لم تفز من قبل
        let query = `
          SELECT number, user_name, contact_phone 
          FROM tickets 
          WHERE status = 'sold' 
          AND number NOT IN (SELECT DISTINCT ticket_number FROM draw_history)
        `;
        const params: any[] = [];
        
        // إذا تم إرسال النطاق، نضيف شرط BETWEEN
        if (rangeStart && rangeEnd) {
          query += ` AND number BETWEEN $1 AND $2`;
          params.push(rangeStart, rangeEnd);
        }
        query += ` ORDER BY RANDOM() LIMIT 1`;

        const availableTickets = await client.query(query, params);

        if (availableTickets.rows.length === 0) {
          return NextResponse.json(
            { success: false, error: "لا توجد بطاقات مباعة متاحة للسحب" },
            { status: 400 }
          );
        }

        const chosen = availableTickets.rows[0];
        finalTicketNumber = chosen.number;
        finalWinnerName = chosen.user_name || "مستخدم";
        finalWinnerPhone = chosen.contact_phone || "0599999999";
      }

      // 4️⃣ تسجيل الفائز في قاعدة البيانات
      await client.query(
        "INSERT INTO draw_history (prize, ticket_number, winner_name, winner_phone) VALUES ($1, $2, $3, $4)",
        [prize, finalTicketNumber, finalWinnerName, finalWinnerPhone]
      );

      return NextResponse.json({
        success: true,
        message: `تم تسجيل نتيجة السحب (رقم ${finalTicketNumber})`,
        winner: {
          ticketNumber: finalTicketNumber,
          winnerName: finalWinnerName,
          winnerPhone: finalWinnerPhone,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/draw POST error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
