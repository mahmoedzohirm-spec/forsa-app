import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function POST(req: NextRequest) {
  try {
    const client = await pool.connect();
    try {
      // Reset all tickets to available
      await client.query(`
        UPDATE tickets SET
          status = 'available',
          user_id = NULL,
          user_name = NULL,
          user_phone = NULL,
          contact_phone = NULL,
          payment_method = NULL,
          receipt_image = NULL,
          notes = NULL,
          rejection_reason = NULL,
          updated_at = NOW()
      `);

      // Ensure all 3000 tickets exist
      const values: string[] = [];
      for (let i = 1; i <= 5000; i++) {
        values.push(`(${i}, 'available')`);
      }
      const batchSize = 500;
      for (let b = 0; b < values.length; b += batchSize) {
        const batch = values.slice(b, b + batchSize).join(",");
        await client.query(
          `INSERT INTO tickets (number, status) VALUES ${batch} ON CONFLICT (number) DO UPDATE SET status = 'available', user_id = NULL, user_name = NULL, updated_at = NOW()`
        );
      }

      return NextResponse.json({ success: true, message: "تمت إعادة تهيئة جميع البطاقات بنجاح" });
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
