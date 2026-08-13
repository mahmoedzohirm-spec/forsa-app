import { NextResponse } from "next/server";
import { pool } from "@/db";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT COUNT(*) as count FROM users");
      return NextResponse.json({ count: parseInt(result.rows[0].count) });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching users count:", error);
    return NextResponse.json({ error: "Failed to fetch users count" }, { status: 500 });
  }
}
