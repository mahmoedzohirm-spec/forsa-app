import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      // جلب البطاقات المباعة (مع LIMIT للأمان)
      const tickets = await client.query(
        "SELECT number, user_name, contact_phone FROM tickets WHERE status = 'sold' ORDER BY number ASC LIMIT 5000"
      );
      // جلب آخر 20 سحب
      const history = await client.query(
        "SELECT * FROM draw_history ORDER BY drawn_at DESC LIMIT 20"
      );
      return NextResponse.json({
        success: true,
        tickets: tickets.rows,
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

export async function POST(req: NextRequest) {
  try {
    const { prize, ticketNumber, winnerName, winnerPhone } = await req.json();
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