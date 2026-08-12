import { DrawHistory } from "@/types";
import Link from "next/link";

interface HistorySectionProps {
  winners: DrawHistory[];
}

export function HistorySection({ winners }: HistorySectionProps) {
  if (!winners || winners.length === 0) {
    return null;
  }

  return (
    <section style={{ padding: "60px 24px", background: "rgba(15, 10, 28, 0.5)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: "900", color: "#fff" }}>
              🏆 آخر الفائزين
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "4px" }}>
              شاهد من فاز بالجوائز في السحوبات السابقة
            </p>
          </div>
          <Link href="/winners" style={{ textDecoration: "none" }}>
            <button
              className="btn-gold"
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "700",
                fontFamily: "Cairo, Inter, sans-serif",
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#1a0a3c",
              }}
            >
              عرض الكل →
            </button>
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {winners.map((winner) => (
            <div
              key={winner.id}
              style={{
                background: "rgba(30, 20, 53, 0.7)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                borderRadius: "16px",
                padding: "20px",
                transition: "all 0.3s",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "#f59e0b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "28px" }}>🎖️</span>
                <div>
                  <p style={{ color: "#fbbf24", fontWeight: "800", fontSize: "18px" }}>
                    #{winner.ticket_number}
                  </p>
                  <p style={{ color: "#c4b5fd", fontSize: "14px", fontWeight: "600" }}>
                    {winner.winner_name || "فائز مجهول"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#f59e0b", fontWeight: "700", fontSize: "15px" }}>
                  {winner.prize}
                </span>
                <span style={{ color: "#6b7280", fontSize: "12px" }}>
                  {new Date(winner.drawn_at).toLocaleDateString("ar-SA")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
