import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function POST(req: NextRequest) {
  try {
    const { count } = await req.json();

    if (!count || count < 1 || count > 500) {
      return NextResponse.json(
        { success: false, error: "يجب اختيار عدد بين 1 و 500" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT number FROM tickets 
         WHERE status = 'available' 
         ORDER BY RANDOM() 
         LIMIT $1`,
        [count]
      );

      if (result.rows.length < count) {
        return NextResponse.json(
          { success: false, error: `لا يوجد سوى ${result.rows.length} بطاقات متاحة فقط` },
          { status: 400 }
        );
      }

      const tickets = result.rows.map((row) => row.number);
      return NextResponse.json({ success: true, tickets });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error selecting random tickets:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
