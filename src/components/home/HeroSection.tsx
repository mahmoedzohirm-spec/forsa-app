import { useTranslations, useLocale } from 'next-intl';
import { TrophyIcon } from "@/components/ui/Icons";
import { AppSettings } from "@/types";

interface HeroSectionProps {
  settings: AppSettings;
  ticketPrice: string;
  currency: string;
  user: any;
  onLogin: () => void;
  scrollToTickets: () => void;
  setActiveSection: (section: string) => void;
}

export function HeroSection({
  settings,
  ticketPrice,
  user,
  onLogin,
  scrollToTickets,
  setActiveSection,
}: HeroSectionProps) {
  const t = useTranslations('HomePage.hero');
  const locale = useLocale();

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale).format(num);
  };

  return (
    <section style={{ minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(124,58,237,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "10%", right: "5%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "5%", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: "800px" }}>
        <div className="float-anim" style={{ fontSize: "80px", marginBottom: "24px" }}>🏆</div>
        <h1 className="shimmer-text" style={{ fontSize: "clamp(48px, 10vw, 96px)", fontWeight: "900", lineHeight: 1.1, marginBottom: "24px" }}>
          {t('title')}
        </h1>
        <p style={{ fontSize: "clamp(16px, 3vw, 22px)", color: "#c4b5fd", lineHeight: 1.7, marginBottom: "40px", fontWeight: "500" }}>
          {t('subtitle')}
          <br />
          <span style={{ color: "#fbbf24", fontWeight: "700" }}>
            {t('price', { price: formatNumber(parseInt(ticketPrice)), currency: t('currency') })}
          </span>
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => { if (user) scrollToTickets(); else onLogin(); }}
            className="btn-gold pulse-gold"
            style={{ padding: "16px 36px", borderRadius: "50px", fontSize: "18px", fontWeight: "800", fontFamily: "Cairo, Inter, sans-serif", display: "flex", alignItems: "center", gap: "10px" }}
          >
            {user ? t('button_buy') : t('button_signup')}
            <span style={{ fontSize: "20px" }}>←</span>
          </button>
          <button
            onClick={() => setActiveSection("prizes")}
            style={{ padding: "16px 36px", borderRadius: "50px", fontSize: "18px", fontWeight: "800", fontFamily: "Cairo, Inter, sans-serif", background: "transparent", border: "2px solid rgba(245,158,11,0.5)", color: "#fbbf24", cursor: "pointer", transition: "all 0.3s" }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(245,158,11,0.1)"; (e.target as HTMLButtonElement).style.borderColor = "#f59e0b"; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "transparent"; (e.target as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.5)"; }}
          >
            {t('button_prizes')}
          </button>
        </div>
      </div>
    </section>
  );
}
