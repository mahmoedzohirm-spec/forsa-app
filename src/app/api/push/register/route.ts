import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function POST(req: NextRequest) {
  try {
    const { userId, token } = await req.json();

    if (!userId || !token) {
      return NextResponse.json(
        { success: false, error: "User ID and token are required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // أضف عمود push_token إذا لم يكن موجوداً
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'push_token'
          ) THEN
            ALTER TABLE users ADD COLUMN push_token TEXT;
          END IF;
        END $$;
      `);

      // تحديث token للمستخدم
      await client.query(
        "UPDATE users SET push_token = $1 WHERE id = $2",
        [token, userId]
      );

      return NextResponse.json({ 
        success: true, 
        message: "Push token registered successfully" 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error registering push token:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}