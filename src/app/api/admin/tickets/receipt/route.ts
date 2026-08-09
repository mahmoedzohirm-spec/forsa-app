import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const ticketNumber = searchParams.get("ticketNumber");

  if (!ticketNumber) {
    return NextResponse.json(
      { success: false, error: "رقم البطاقة مطلوب" },
      { status: 400 }
    );
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT receipt_image FROM tickets WHERE number = $1",
        [parseInt(ticketNumber)]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "البطاقة غير موجودة" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        receipt_image: result.rows[0].receipt_image || null,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}