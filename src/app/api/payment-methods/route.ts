import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export const dynamic = 'force-dynamic';

// جلب جميع طرق الدفع
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM payment_methods ORDER BY id ASC"
      );
      return NextResponse.json({ success: true, methods: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/payment-methods GET error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// إضافة طريقة دفع جديدة
export async function POST(req: NextRequest) {
  try {
    const { name, iban, bank_name, account_holder, phone_number } = await req.json(); // ✅
    if (!name) {
      return NextResponse.json(
        { success: false, error: "اسم طريقة الدفع مطلوب" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO payment_methods (name, iban, bank_name, account_holder, phone_number)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, iban || null, bank_name || null, account_holder || null, phone_number || null] // ✅
      );
      return NextResponse.json({ success: true, method: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/payment-methods POST error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// تعديل طريقة دفع
export async function PUT(req: NextRequest) {
  try {
    const { id, name, iban, bank_name, account_holder, phone_number } = await req.json(); // ✅
    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: "المعرف والاسم مطلوبان" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE payment_methods
         SET name = $1, iban = $2, bank_name = $3, account_holder = $4, phone_number = $5
         WHERE id = $6`,
        [name, iban || null, bank_name || null, account_holder || null, phone_number || null, id] // ✅
      );
      return NextResponse.json({ success: true, message: "تم تحديث طريقة الدفع" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/payment-methods PUT error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// حذف طريقة دفع
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "المعرف مطلوب" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("DELETE FROM payment_methods WHERE id = $1", [id]);
      return NextResponse.json({ success: true, message: "تم حذف طريقة الدفع" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("API /admin/payment-methods DELETE error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
