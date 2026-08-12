import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "200"), 5000); // حد أقصى 1000
    const offset = (page - 1) * limit;

    const client = await pool.connect();
    try {
      // ✅ تمت إضافة booking_id إلى الاستعلام
      let query = `SELECT id, number, status, user_id, user_name, user_phone, contact_phone, 
                      payment_method, notes, rejection_reason, created_at, updated_at, booking_id
               FROM tickets`;
      const params: (string | number)[] = [];
      const conditions: string[] = [];

      if (status && status !== "all") {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }
      if (search) {
        params.push(parseInt(search) || 0);
        conditions.push(`number = $${params.length}`);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY number ASC";
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      // Get counts (محسّن)
      const countsResult = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold
        FROM tickets
      `);

      // Get subscribers count (محسّن)
      const subsResult = await client.query(
        "SELECT COUNT(DISTINCT user_id) as count FROM tickets WHERE user_id IS NOT NULL"
      );

      return NextResponse.json({
        success: true,
        tickets: result.rows,
        counts: countsResult.rows[0],
        subscribers: subsResult.rows[0].count,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /tickets error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
