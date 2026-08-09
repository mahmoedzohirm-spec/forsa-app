"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const switchLanguage = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "rgba(124, 58, 237, 0.2)",
          border: "1px solid rgba(124, 58, 237, 0.3)",
          borderRadius: "8px",
          padding: "8px 12px",
          color: "#c4b5fd",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
          fontFamily: "Cairo, Inter, sans-serif",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>🌐</span>
        <span>{locale === "ar" ? "العربية" : "English"}</span>
        <span style={{ fontSize: "12px" }}>▾</span>
      </button>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: "0",
            background: "rgba(15, 10, 28, 0.98)",
            border: "1px solid rgba(124, 58, 237, 0.3)",
            borderRadius: "8px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            overflow: "hidden",
            zIndex: 999,
            minWidth: "140px",
          }}
        >
          <button
            onClick={() => { switchLanguage("ar"); setIsOpen(false); }}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 16px",
              background: locale === "ar" ? "rgba(124,58,237,0.3)" : "transparent",
              border: "none",
              color: locale === "ar" ? "#fbbf24" : "#c4b5fd",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              fontFamily: "Cairo, Inter, sans-serif",
              textAlign: "right",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,58,237,0.2)")}
            onMouseLeave={(e) => {
              if (locale !== "ar") e.currentTarget.style.background = "transparent";
              else e.currentTarget.style.background = "rgba(124,58,237,0.3)";
            }}
          >
            🇸🇦 العربية
          </button>
          <button
            onClick={() => { switchLanguage("en"); setIsOpen(false); }}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 16px",
              background: locale === "en" ? "rgba(124,58,237,0.3)" : "transparent",
              border: "none",
              color: locale === "en" ? "#fbbf24" : "#c4b5fd",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              fontFamily: "Cairo, Inter, sans-serif",
              textAlign: "right",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,58,237,0.2)")}
            onMouseLeave={(e) => {
              if (locale !== "en") e.currentTarget.style.background = "transparent";
              else e.currentTarget.style.background = "rgba(124,58,237,0.3)";
            }}
          >
            🇬🇧 English
          </button>
        </div>
      )}
    </div>
  );
}