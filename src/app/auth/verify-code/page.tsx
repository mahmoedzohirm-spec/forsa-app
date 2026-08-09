"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// تعطيل الـ prerendering لهذه الصفحة (لأنها تستخدم useSearchParams)
export const dynamic = "force-dynamic";

// المكون الداخلي الذي يستخدم useSearchParams
function VerifyCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [success, setSuccess] = useState(false);

  // إذا لم يوجد بريد إلكتروني، نعيد التوجيه
  useEffect(() => {
    if (!email) {
      router.push("/auth/forgot-password");
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("يرجى إدخال الكود المكون من 6 أرقام");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setMessage("✅ تم التحقق بنجاح، جاري التوجيه...");
        setTimeout(() => {
          router.push(`/auth/reset-password?token=${data.token}`);
        }, 1500);
      } else {
        setAttempts((prev) => prev + 1);
        setError(data.error || "الكود غير صحيح");
        if (attempts >= 2) {
          setError("لقد تجاوزت عدد المحاولات المسموح بها. يرجى طلب كود جديد.");
        }
      }
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ تم إرسال كود جديد إلى بريدك الإلكتروني");
        setAttempts(0);
      } else {
        setError(data.error || "حدث خطأ");
      }
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0a1c 0%, #080510 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "rgba(30, 20, 53, 0.8)", border: "1px solid rgba(124, 58, 237, 0.3)", borderRadius: "20px", padding: "40px", maxWidth: "440px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontSize: "48px" }}>🔐</span>
          <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: "800", marginTop: "12px" }}>
            تحقق من هويتك
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "8px" }}>
            أدخل الكود المكون من 6 أرقام الذي تم إرساله إلى بريدك الإلكتروني
          </p>
          <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px" }}>
            {email}
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
              <span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>✅</span>
              <p style={{ color: "#10b981", fontSize: "16px", fontWeight: "600" }}>{message}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", color: "#fca5a5" }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", color: "#10b981" }}>
                {message}
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: "#c4b5fd", fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                كود التحقق (6 أرقام)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="مثال: 123456"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(15, 10, 28, 0.8)",
                  border: "1px solid rgba(124, 58, 237, 0.3)",
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "20px",
                  textAlign: "center",
                  letterSpacing: "8px",
                  fontFamily: "monospace",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || attempts >= 3}
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
                opacity: loading || attempts >= 3 ? 0.7 : 1,
                cursor: loading || attempts >= 3 ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "جارٍ التحقق..." : "تحقق"}
            </button>

            {attempts >= 3 && (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <p style={{ color: "#f87171", fontSize: "14px", marginBottom: "8px" }}>
                  لقد تجاوزت عدد المحاولات المسموح بها.
                </p>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f59e0b",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "14px",
                    textDecoration: "underline",
                  }}
                >
                  إعادة إرسال الكود
                </button>
              </div>
            )}

            {attempts < 3 && attempts > 0 && (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9ca3af",
                    fontSize: "14px",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  لم يصلك الكود؟ أعد الإرسال
                </button>
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <Link href="/auth/forgot-password" style={{ color: "#9ca3af", fontSize: "14px", textDecoration: "none" }}>
                ← تغيير البريد الإلكتروني
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// المكون الرئيسي مع Suspense
export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>جاري التحميل...</div>}>
      <VerifyCodeForm />
    </Suspense>
  );
}