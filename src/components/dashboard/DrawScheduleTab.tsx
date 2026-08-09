"use client";

import { useState, useEffect } from "react";

export default function DrawScheduleTab({ showToast }: { showToast: (msg: string) => void }) {
    const [schedule, setSchedule] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/draw-schedule");
            const data = await res.json();
            if (data.success) {
                setSchedule(data.schedule || "");
            }
        } catch (error) {
            console.error("Error fetching schedule:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schedule.trim()) {
            showToast("⚠️ يرجى إدخال موعد السحب");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/admin/draw-schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schedule: schedule.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                showToast("✅ تم حفظ موعد السحب وإرسال الإشعارات للمستخدمين");
            } else {
                showToast(`⚠️ ${data.error || "حدث خطأ"}`);
            }
        } catch (error) {
            showToast("⚠️ خطأ في الاتصال بالخادم");
        } finally {
            setSaving(false);
        }
    };

    const cardStyle: React.CSSProperties = {
        background: "rgba(30, 20, 53, 0.8)",
        border: "1px solid rgba(124, 58, 237, 0.2)",
        borderRadius: "16px",
        padding: "24px",
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "12px 16px",
        background: "rgba(15, 10, 28, 0.8)",
        border: "1px solid rgba(124, 58, 237, 0.3)",
        borderRadius: "10px",
        color: "#fff",
        fontSize: "14px",
        fontFamily: "Cairo, Inter, sans-serif",
    };

    return (
        <div>
            <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#f59e0b", marginBottom: "28px" }}>
                📅 موعد السحب القادم
            </h1>

            <div style={cardStyle}>
                <form onSubmit={handleSubmit}>
                    <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "16px" }}>
                        قم بتحديد موعد السحب القادم، وسيتم إرسال إشعار لجميع المستخدمين.
                    </p>

                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ color: "#c4b5fd", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                            موعد السحب
                        </label>
                        <input
                            type="text"
                            value={schedule}
                            onChange={(e) => setSchedule(e.target.value)}
                            placeholder="مثال: 15 يونيو 2025، الساعة 8:00 مساءً"
                            style={inputStyle}
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving || loading}
                        className="btn-gold"
                        style={{
                            padding: "12px 32px",
                            borderRadius: "10px",
                            fontSize: "15px",
                            fontFamily: "Cairo, Inter, sans-serif",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            opacity: saving || loading ? 0.7 : 1,
                            cursor: saving || loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {saving ? "جارٍ الحفظ..." : "📢 حفظ وإرسال إشعار"}
                    </button>
                </form>

                <div style={{ marginTop: "16px", padding: "12px", background: "rgba(245, 158, 11, 0.05)", borderRadius: "10px" }}>
                    <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                        <span style={{ color: "#fbbf24", fontWeight: "700" }}>📌 ملاحظة:</span> عند حفظ الموعد، سيتم إرسال إشعار فوري لجميع المستخدمين المسجلين.
                    </p>
                </div>
            </div>
        </div>
    );
}