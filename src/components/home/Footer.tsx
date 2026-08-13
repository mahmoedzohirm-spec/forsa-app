import { useTranslations } from 'next-intl';
import { TrophyIcon } from "@/components/ui/Icons";
import { AppSettings } from "@/types";
import { QRCodeSVG } from 'qrcode.react';

export function Footer({ settings }: { settings: AppSettings }) {
  const t = useTranslations('HomePage.footer');
  const siteUrl = process.env.NEXTAUTH_URL || 'https://forsa-app-ten.vercel.app';

  // ✅ دالة المشاركة
  const handleShare = async () => {
    const shareData = {
      title: settings.site_name || 'فرصة العمر',
      text: 'انضم إلى منصة السحوبات واربح جوائز قيمة!',
      url: siteUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(siteUrl);
        alert('تم نسخ الرابط، شاركه مع أصدقائك!');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share error:', error);
      }
    }
  };

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

      {/* ✅ الباركود + زر المشاركة جنب بعض (صف واحد) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          flexWrap: "wrap",
          marginTop: "12px",
        }}
      >
        {/* الباركود */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "16px",
          }}
        >
          <QRCodeSVG
            value={siteUrl}
            size={140}
            bgColor="rgba(0,0,0,0)"
            fgColor="#fbbf24"
            level="H"
            includeMargin={false}
          />
        </div>

        {/* ✅ زر مشاركة التطبيق جنب الباركود */}
        <button
          onClick={handleShare}
          style={{
            padding: "14px 28px",
            borderRadius: "50px",
            fontSize: "16px",
            fontWeight: "700",
            fontFamily: "Cairo, Inter, sans-serif",
            background: "rgba(245,158,11,0.15)",
            border: "2px solid rgba(245,158,11,0.5)",
            color: "#fbbf24",
            cursor: "pointer",
            transition: "all 0.3s",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = "rgba(245,158,11,0.3)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = "rgba(245,158,11,0.15)";
          }}
        >
          <span>📤</span> مشاركة التطبيق
        </button>
      </div>
    </footer>
  );
}
