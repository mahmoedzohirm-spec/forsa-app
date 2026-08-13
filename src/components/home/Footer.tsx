import { useTranslations } from 'next-intl';
import { TrophyIcon } from "@/components/ui/Icons";
import { AppSettings } from "@/types";
import { QRCodeSVG } from 'qrcode.react'; // ✅ إضافة الباركود

export function Footer({ settings }: { settings: AppSettings }) {
  const t = useTranslations('HomePage.footer');
  const siteUrl = process.env.NEXTAUTH_URL || 'https://forsa-app-ten.vercel.app';

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

      {/* ✅ الدعم الفني عبر واتساب */}
      <p style={{ color: "#4b5563", fontSize: "12px", marginBottom: "16px" }}>
        {t('support_email')}
        <a
          href="https://wa.me/972569992790"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#fbbf24",
            textDecoration: "none",
            fontWeight: "600",
            marginRight: "4px",
          }}
        >
          📱 واتساب 0569992790
        </a>
      </p>

      {/* ✅ باركود (QR Code) لسهولة مشاركة التطبيق */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "20px",
          padding: "12px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "12px",
          maxWidth: "200px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <QRCodeSVG
          value={siteUrl}
          size={120}
          bgColor="transparent"
          fgColor="#fbbf24"
          level="H"
          includeMargin={false}
        />
      </div>
      <p style={{ color: "#6b7280", fontSize: "11px", marginTop: "8px", opacity: 0.7 }}>
        {t('scan_to_visit') || 'امسح الباركود لزيارة المنصة'}
      </p>
    </footer>
  );
}
