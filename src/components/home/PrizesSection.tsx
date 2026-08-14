import { useTranslations } from 'next-intl';
import { Prize } from "@/types";

interface PrizesSectionProps {
  prizes: Prize[];
  activeSection: string;
}

export function PrizesSection({ prizes, activeSection }: PrizesSectionProps) {
  const t = useTranslations('HomePage.prizes');

  const getRankText = (tier: number) => {
    if (tier === 1) return "المركز الأول";
    if (tier === 2) return "المركز الثاني";
    if (tier === 3) return "المركز الثالث";
    return `المركز ${tier}`;
  };

  return (
    <section style={{ padding: activeSection === "prizes" ? "60px 24px" : "0 24px 80px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 5vw, 44px)",
              fontWeight: "900",
              color: "#fff",
              marginBottom: "12px",
            }}
          >
            {t('title')}
          </h2>
          <p style={{ color: "#9ca3af", fontSize: "16px" }}>{t('subtitle')}</p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {prizes.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center", gridColumn: "1/-1" }}>
              {t('no_prizes')}
            </p>
          ) : (
            prizes.map((prize) => {
              const emojiMap: Record<number, string> = { 1: "🚗", 2: "✈️", 3: "📱" };
              const iconMap: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
              const colors: Record<number, string> = {
                1: "#f59e0b",
                2: "#d1d5db",
                3: "#d97706",
              };
              const borderColors: Record<number, string> = {
                1: "rgba(245, 158, 11, 0.5)",
                2: "rgba(156, 163, 175, 0.4)",
                3: "rgba(217, 119, 6, 0.4)",
              };
              const glowColors: Record<number, string> = {
                1: "rgba(245, 158, 11, 0.2)",
                2: "rgba(156, 163, 175, 0.1)",
                3: "rgba(217, 119, 6, 0.1)",
              };
              const gradients: Record<number, string> = {
                1: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))",
                2: "linear-gradient(135deg, rgba(156,163,175,0.15), rgba(107,114,128,0.08))",
                3: "linear-gradient(135deg, rgba(217,119,6,0.15), rgba(146,64,14,0.08))",
              };

              const tier = prize.tier || 1;
              const emoji = emojiMap[tier] || "🎁";
              const icon = iconMap[tier] || "🏅";

              return (
                <div
                  key={prize.id}
                  style={{
                    background: gradients[tier] || "rgba(30,20,53,0.6)",
                    border: `1px solid ${borderColors[tier] || "rgba(124,58,237,0.3)"}`,
                    borderRadius: "24px",
                    padding: "36px 28px",
                    textAlign: "center",
                    boxShadow: `0 0 40px ${glowColors[tier] || "rgba(124,58,237,0.1)"}`,
                    transition: "transform 0.3s, box-shadow 0.3s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-8px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 60px ${
                      glowColors[tier] || "rgba(124,58,237,0.2)"
                    }`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${
                      glowColors[tier] || "rgba(124,58,237,0.1)"
                    }`;
                  }}
                >
                  {prize.image ? (
                    <img
                      src={prize.image}
                      alt={prize.title}
                      style={{
                        width: "100%",
                        maxHeight: "180px",
                        objectFit: "contain",
                        borderRadius: "12px",
                        marginBottom: "16px",
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: "64px", marginBottom: "8px" }}>{emoji}</div>
                  )}
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>{icon}</div>
                  
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: colors[tier] || "#f59e0b",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                    }}
                  >
                    {getRankText(tier)}
                  </p>
                  
                  <h3
                    style={{
                      fontSize: "22px",
                      fontWeight: "900",
                      color: "#fff",
                      marginBottom: "8px",
                    }}
                  >
                    {prize.title}
                  </h3>
                  <p style={{ color: "#c4b5fd", fontSize: "15px", marginBottom: "20px" }}>
                    {prize.description || ""}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
