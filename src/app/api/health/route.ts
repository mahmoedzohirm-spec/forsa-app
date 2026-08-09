import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db-init";

let initialized = false;

export async function GET() {
  if (!initialized) {
    try {
      await initializeDatabase();
      initialized = true;
    } catch (e) {
      console.error("DB init error:", e);
    }
  }
  return NextResponse.json({ status: "ok" });
}
