"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// تعطيل الـ prerendering لهذه الصفحة (لأنها تستخدم useSearchParams)
export const dynamic = "force-dynamic";

// المكون الداخلي الذي يستخدم useSearchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // إذا لم يوجد token، نعيد التوجيه
  useEffect(() => {
    if (!token) {
      router.push("/auth/forgot-password");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("يرجى تعبئة جميع الحقول");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمة المرور غير متطابقة");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setMessage(data.message);
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        setError(data.error || "حدث خطأ");
      }
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0a1c 0%, #080510 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "rgba(30, 20, 53, 0.8)", border: "1px solid rgba(124, 58, 237, 0.3)", borderRadius: "20px", padding: "40px", maxWidth: "440px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontSize: "48px" }}>🔄</span>
          <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: "800", marginTop: "12px" }}>
            إعادة تعيين كلمة المرور
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "8px" }}>
            أدخل كلمة مرور جديدة لحسابك
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
              <span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>✅</span>
              <p style={{ color: "#10b981", fontSize: "16px", fontWeight: "600" }}>{message}</p>
              <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "8px" }}>
                جاري تحويلك إلى الصفحة الرئيسية...
              </p>
            </div>
            <Link href="/" style={{ color: "#f59e0b", fontWeight: "700", textDecoration: "none" }}>
              ← العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#c4b5fd", fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(15, 10, 28, 0.8)",
                  border: "1px solid rgba(124, 58, 237, 0.3)",
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: "#c4b5fd", fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                تأكيد كلمة المرور
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(15, 10, 28, 0.8)",
                  border: "1px solid rgba(124, 58, 237, 0.3)",
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "14px",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "جارٍ المعالجة..." : "إعادة تعيين كلمة المرور"}
            </button>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <Link href="/" style={{ color: "#9ca3af", fontSize: "14px", textDecoration: "none" }}>
                ← العودة إلى الصفحة الرئيسية
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// المكون الرئيسي مع Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>جاري التحميل...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}