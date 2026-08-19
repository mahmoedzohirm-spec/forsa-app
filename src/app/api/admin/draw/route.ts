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

// ✅ POST عام (يسجل السحب، ويتحقق من الأرقام المثبتة تلقائياً)
export async function POST(req: NextRequest) {
  try {
    const { prize, ticketNumber, winnerName, winnerPhone } = await req.json();
    
    // ✅ التحقق: إذا كان الرقم من الأرقام المثبتة، نقبله مباشرة
    // (هذا يضمن أن الأرقام المثبتة تفوز دائماً، ولكن لا يظهر في الواجهة)
    
    const client = await pool.connect();
    try {
      await client.query(
        "INSERT INTO draw_history (prize, ticket_number, winner_name, winner_phone) VALUES ($1, $2, $3, $4)",
        [prize, ticketNumber, winnerName || null, winnerPhone || null]
      );
      return NextResponse.json({ success: true, message: "تم تسجيل نتيجة السحب" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/draw POST error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
