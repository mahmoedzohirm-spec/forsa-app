import { useState, useEffect } from "react";
import { PaymentMethod } from "@/types";

interface PaymentMethodsTabProps {
  showToast: (msg: string) => void;
}

export function PaymentMethodsTab({ showToast }: PaymentMethodsTabProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    iban: "",
    bank_name: "",
    account_holder: "",
    phone_number: "",
  });

  const loadMethods = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payment-methods", {
        credentials: "include", // ✅ إضافة
      });
      const data = await res.json();
      if (data.success) setMethods(data.methods);
    } catch (error) {
      showToast("⚠️ فشل تحميل طرق الدفع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast("⚠️ اسم طريقة الدفع مطلوب");
      return;
    }

    try {
      const url = `/api/admin/payment-methods`;
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { id: editingId, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ إضافة
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingId ? "✅ تم تحديث طريقة الدفع" : "✅ تم إضافة طريقة الدفع");
        setFormData({ name: "", iban: "", bank_name: "", account_holder: "", phone_number: "" });
        setEditingId(null);
        loadMethods();
      } else {
        showToast(`⚠️ ${data.error || "حدث خطأ"}`);
      }
    } catch (error) {
      showToast("⚠️ خطأ في الاتصال بالخادم");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف طريقة الدفع هذه؟")) return;
    try {
      const res = await fetch("/api/admin/payment-methods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ إضافة
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("✅ تم حذف طريقة الدفع");
        loadMethods();
      } else {
        showToast(`⚠️ ${data.error || "حدث خطأ"}`);
      }
    } catch (error) {
      showToast("⚠️ خطأ في الاتصال بالخادم");
    }
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

  const cardStyle: React.CSSProperties = {
    background: "rgba(30, 20, 53, 0.8)",
    border: "1px solid rgba(124, 58, 237, 0.2)",
    borderRadius: "16px",
    padding: "24px",
  };

  return (
    <div>
      <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#f59e0b", marginBottom: "28px" }}>
        💳 إدارة طرق الدفع
      </h1>

      <div style={{ ...cardStyle, marginBottom: "24px" }}>
        <h3 style={{ color: "#c4b5fd", fontWeight: "700", marginBottom: "16px" }}>
          {editingId ? "تعديل طريقة الدفع" : "إضافة طريقة دفع جديدة"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                الاسم *
              </label>
              <input
                style={inputStyle}
                type="text"
                placeholder="مثال: تحويل بنكي"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                رقم الآيبان (اختياري)
              </label>
              <input
                style={inputStyle}
                type="text"
                placeholder="SA0000000000000000000000"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              />
            </div>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                اسم البنك (اختياري)
              </label>
              <input
                style={inputStyle}
                type="text"
                placeholder="البنك الأهلي السعودي"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                اسم صاحب الحساب (اختياري)
              </label>
              <input
                style={inputStyle}
                type="text"
                placeholder="شركة فرصة العمر"
                value={formData.account_holder}
                onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
              />
            </div>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                رقم الجوال (اختياري)
              </label>
              <input
                style={inputStyle}
                type="tel"
                placeholder="059XXXXXXX"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              type="submit"
              className="btn-gold"
              style={{ padding: "10px 24px", borderRadius: "10px", fontSize: "14px", fontFamily: "Cairo, Inter, sans-serif" }}
            >
              {editingId ? "💾 تحديث" : "➕ إضافة"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: "", iban: "", bank_name: "", account_holder: "", phone_number: "" });
                }}
                style={{
                  padding: "10px 24px",
                  background: "rgba(124,58,237,0.2)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(124,58,237,0.3)",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontFamily: "Cairo, Inter, sans-serif",
                  fontSize: "14px",
                }}
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={cardStyle}>
        <h3 style={{ color: "#c4b5fd", fontWeight: "700", marginBottom: "16px" }}>
          طرق الدفع المتاحة ({methods.length})
        </h3>
        {loading ? (
          <p style={{ color: "#9ca3af" }}>جارٍ التحميل...</p>
        ) : methods.length === 0 ? (
          <p style={{ color: "#6b7280" }}>لا توجد طرق دفع مضافة بعد</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {methods.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "10px",
                  border: "1px solid rgba(124,58,237,0.1)",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#fff", fontWeight: "700" }}>{m.name}</p>
                  {m.iban && <p style={{ color: "#9ca3af", fontSize: "13px" }}>آيبان: {m.iban}</p>}
                  {m.bank_name && <p style={{ color: "#9ca3af", fontSize: "13px" }}>البنك: {m.bank_name}</p>}
                  {m.account_holder && <p style={{ color: "#9ca3af", fontSize: "13px" }}>صاحب الحساب: {m.account_holder}</p>}
                  {m.phone_number && <p style={{ color: "#9ca3af", fontSize: "13px" }}>📱 الجوال: {m.phone_number}</p>}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setEditingId(m.id);
                      setFormData({
                        name: m.name || "",
                        iban: m.iban || "",
                        bank_name: m.bank_name || "",
                        account_holder: m.account_holder || "",
                        phone_number: m.phone_number || "",
                      });
                    }}
                    style={{
                      padding: "6px 14px",
                      background: "rgba(59,130,246,0.2)",
                      color: "#93c5fd",
                      border: "1px solid rgba(59,130,246,0.3)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontFamily: "Cairo, Inter, sans-serif",
                      fontSize: "13px",
                    }}
                  >
                    ✏️ تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    style={{
                      padding: "6px 14px",
                      background: "rgba(239,68,68,0.2)",
                      color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontFamily: "Cairo, Inter, sans-serif",
                      fontSize: "13px",
                    }}
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
