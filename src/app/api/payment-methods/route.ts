import { NextResponse } from "next/server";
import { pool } from "@/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM payment_methods WHERE is_active = TRUE ORDER BY id ASC"
      );
      return NextResponse.json({ success: true, methods: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /payment-methods GET error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}