import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = body?.count || 5000; // ← القيمة الافتراضية 5000 لو ما اجت

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

      // Ensure tickets exist using the dynamic count
      const values: string[] = [];
      for (let i = 1; i <= count; i++) {
        values.push(`(${i}, 'available')`);
      }
      
      const batchSize = 500;
      for (let b = 0; b < values.length; b += batchSize) {
        const batch = values.slice(b, b + batchSize).join(",");
        await client.query(
          `INSERT INTO tickets (number, status) VALUES ${batch} 
           ON CONFLICT (number) DO UPDATE SET 
             status = 'available', 
             user_id = NULL, 
             user_name = NULL, 
             updated_at = NOW()`
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: `تمت إعادة تهيئة ${count} بطاقة بنجاح` 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
