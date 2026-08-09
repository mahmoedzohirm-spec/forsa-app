import { useTranslations, useLocale } from 'next-intl';

interface HowItWorksSectionProps {
  ticketPrice: string;
  // نستغني عن currency، لأننا سنأخذها من الترجمة
}

export function HowItWorksSection({ ticketPrice }: HowItWorksSectionProps) {
  const t = useTranslations('HomePage.how');
  const locale = useLocale();

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale).format(num);
  };

  const steps = [
    {
      num: "01",
      title: t('steps.0.title'),
      desc: t('steps.0.desc'),
      icon: "👤",
      color: "#7c3aed",
    },
    {
      num: "02",
      title: t('steps.1.title'),
      desc: t('steps.1.desc', { price: formatNumber(parseInt(ticketPrice)), currency: t('currency') }),
      icon: "💳",
      color: "#f59e0b",
    },
    {
      num: "03",
      title: t('steps.2.title'),
      desc: t('steps.2.desc'),
      icon: "🎡",
      color: "#10b981",
    },
  ];

  return (
    <section style={{ padding: "0 24px 80px" }}>
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
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {steps.map((step) => (
            <div
              key={step.num}
              style={{
                background: "rgba(30, 20, 53, 0.6)",
                border: "1px solid rgba(124, 58, 237, 0.2)",
                borderRadius: "20px",
                padding: "36px 28px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "20px",
                  fontSize: "80px",
                  fontWeight: "900",
                  color: "rgba(255,255,255,0.04)",
                  lineHeight: 1,
                  fontFamily: "Inter",
                }}
              >
                {step.num}
              </div>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>{step.icon}</div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: step.color,
                  marginBottom: "12px",
                }}
              >
                {step.title}
              </h3>
              <p style={{ color: "#9ca3af", fontSize: "15px", lineHeight: 1.7 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}