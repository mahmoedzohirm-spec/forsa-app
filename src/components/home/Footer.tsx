import { useTranslations } from 'next-intl';
import { TrophyIcon } from "@/components/ui/Icons";
import { AppSettings } from "@/types";

export function Footer({ settings }: { settings: AppSettings }) {
  // 👇 تصحيح: استخدم 'HomePage.footer'
  const t = useTranslations('HomePage.footer');

  return (
    <footer
      style={{
        borderTop: "1px solid rgba(124, 58, 237, 0.2)",
        padding: "40px 24px",
        textAlign: "center",
        background: "rgba(8, 5, 16, 0.8)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <span style={{ color: "#f59e0b" }}>
          <TrophyIcon />
        </span>
        <span className="shimmer-text" style={{ fontSize: "22px", fontWeight: "900" }}>
          {settings.site_name || "فرصة العمر"}
        </span>
      </div>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "8px" }}>
        {t('copyright', { year: new Date().getFullYear() })}
      </p>
      <p style={{ color: "#4b5563", fontSize: "12px" }}>
        {t('support_email')}
      </p>
    </footer>
  );
}