import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = await getTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const decoded = verifyToken(token);
  if (!decoded?.is_admin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT key, value FROM app_settings");
      const settings: Record<string, string> = {};
      for (const row of result.rows) {
        settings[row.key] = row.value;
      }
      return NextResponse.json({ success: true, settings });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/settings GET error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = await getTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const decoded = verifyToken(token);
  if (!decoded?.is_admin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const { settings } = await req.json();
    const client = await pool.connect();
    try {
      for (const [key, value] of Object.entries(settings)) {
        await client.query(
          `INSERT INTO app_settings (key, value, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
          [key, value]
        );
      }
      return NextResponse.json({ success: true, message: "تم حفظ الإعدادات" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/settings POST error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
