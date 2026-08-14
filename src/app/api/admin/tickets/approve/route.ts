import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = await getTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const decoded = verifyToken(token);
  if (!decoded?.is_admin) {
    return NextResponse.json({ error: "صلاحيات غير كافية" }, { status: 403 });
  }

  try {
    const { ticketNumber } = await req.json();
    if (!ticketNumber) {
      return NextResponse.json(
        { success: false, error: "رقم البطاقة مطلوب" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query(
        "UPDATE tickets SET status = 'sold', updated_at = NOW() WHERE number = $1",
        [ticketNumber]
      );
      return NextResponse.json({ success: true, message: "تمت الموافقة على الطلب" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
