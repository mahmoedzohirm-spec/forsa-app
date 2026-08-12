import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function DELETE(req: NextRequest) {
  try {
    const client = await pool.connect();
    try {
      await client.query("DELETE FROM draw_history");
      return NextResponse.json({
        success: true,
        message: "تم حذف جميع سجلات السحوبات بنجاح",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error clearing draw history:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
