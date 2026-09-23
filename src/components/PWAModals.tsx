"use client";

import { useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";

interface Props {
  userId: number | null;
}

export default function PWAModals({ userId }: Props) {
  const {
    showInstallModal,
    showNotifModal,
    startFlow,
    acceptInstall,
    dismissInstall,
    acceptNotifications,
    dismissNotifications,
  } = usePWA();

  // ✅ نطلق السيناريو أول ما يسجّل المستخدم دخوله
  useEffect(() => {
    if (!userId) return;
    const timer = setTimeout(() => startFlow(userId), 1200);
    return () => clearTimeout(timer);
  }, [userId, startFlow]);

  // ============ نافذة التثبيت ============
  if (showInstallModal) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1e1435, #0f0a1c)",
            border: "1px solid rgba(245,158,11,0.4)",
            borderRadius: "20px",
            padding: "32px 24px",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>📲</div>
          <h2
            style={{
              color: "#fbbf24",
              fontSize: "22px",
              fontWeight: "900",
              marginBottom: "12px",
              fontFamily: "Cairo, sans-serif",
            }}
          >
            ثبّت التطبيق على جهازك
          </h2>
          <p
            style={{
              color: "#c4b5fd",
              fontSize: "15px",
              lineHeight: 1.7,
              marginBottom: "24px",
              fontFamily: "Cairo, sans-serif",
            }}
          >
            عشان توصلك إشعارات الفوز فوراً، وتفتح التطبيق بضغطة وحدة من شاشة
            جهازك بدون متصفح.
          </p>
          <button
            onClick={acceptInstall}
            className="btn-gold"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "800",
              marginBottom: "10px",
              fontFamily: "Cairo, sans-serif",
            }}
          >
            ✅ ثبّت الآن
          </button>
          <button
            onClick={dismissInstall}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              background: "transparent",
              border: "1px solid rgba(196,181,253,0.3)",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: "Cairo, sans-serif",
            }}
          >
            لاحقاً
          </button>
        </div>
      </div>
    );
  }

  // ============ نافذة الإشعارات ============
  if (showNotifModal && userId) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1e1435, #0f0a1c)",
            border: "1px solid rgba(124,58,237,0.4)",
            borderRadius: "20px",
            padding: "32px 24px",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔔</div>
          <h2
            style={{
              color: "#a78bfa",
              fontSize: "22px",
              fontWeight: "900",
              marginBottom: "12px",
              fontFamily: "Cairo, sans-serif",
            }}
          >
            فعّل الإشعارات
          </h2>
          <p
            style={{
              color: "#c4b5fd",
              fontSize: "15px",
              lineHeight: 1.7,
              marginBottom: "24px",
              fontFamily: "Cairo, sans-serif",
            }}
          >
            عشان نبلغك فوراً إذا فزت في أي سحب، أو نزلت نتيجة سحب جديد. الإشعارات
            بتوصلك حتى لو التطبيق مسكّر.
          </p>
          <button
            onClick={() => acceptNotifications(userId)}
            className="btn-gold pulse-gold"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "800",
              marginBottom: "10px",
              fontFamily: "Cairo, sans-serif",
            }}
          >
            🔔 فعّل الإشعارات
          </button>
          <button
            onClick={dismissNotifications}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              background: "transparent",
              border: "1px solid rgba(196,181,253,0.3)",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: "Cairo, sans-serif",
            }}
          >
            لاحقاً
          </button>
        </div>
      </div>
    );
  }

  return null;
}
