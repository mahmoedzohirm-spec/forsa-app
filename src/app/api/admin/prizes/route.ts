import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

// منع التخزين المؤقت في Turbopack
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      // ✅ جلب كل الأعمدة ما عدا image عشان السرعة
      const result = await client.query(
        "SELECT id, tier, title, description, image, is_active FROM prizes ORDER BY tier ASC LIMIT 100"
      );
      return NextResponse.json({ success: true, prizes: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/prizes GET error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tier, title, description, image } = await req.json();
    const client = await pool.connect();
    try {
      const result = await client.query(
        "INSERT INTO prizes (tier, title, description, image) VALUES ($1, $2, $3, $4) RETURNING *",
        [tier, title, description || null, image || null]
      );
      return NextResponse.json({ success: true, prize: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/prizes POST error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, tier, title, description, image } = await req.json();
    const client = await pool.connect();
    try {
      await client.query(
        "UPDATE prizes SET tier = $1, title = $2, description = $3, image = $4 WHERE id = $5",
        [tier, title, description || null, image || null, id]
      );
      return NextResponse.json({ success: true, message: "تم تحديث الجائزة" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/prizes PUT error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const client = await pool.connect();
    try {
      await client.query("DELETE FROM prizes WHERE id = $1", [id]);
      return NextResponse.json({ success: true, message: "تم حذف الجائزة" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/prizes DELETE error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
