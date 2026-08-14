import { useTranslations, useLocale } from 'next-intl';
import { TicketIcon, StarIcon, CupIcon, UserGroupIcon } from "@/components/ui/Icons";
import { TicketCounts, User } from "@/types";
import { useState, useEffect } from 'react';

interface StatsSectionProps {
  counts: TicketCounts;
  subscribers: number;
  user: User | null;
}

export function StatsSection({ counts, subscribers: _subscribers, user }: StatsSectionProps) {
  const t = useTranslations('HomePage.stats');
  const locale = useLocale();

  const [userCount, setUserCount] = useState(0);

  // ✅ جلب عدد الأعضاء فقط إذا كان المستخدم مسؤولاً
  useEffect(() => {
    if (user?.is_admin) {
      const fetchUserCount = async () => {
        try {
          const res = await fetch("/api/admin/users/count");
          if (res.ok) {
            const data = await res.json();
            setUserCount(data.count || 0);
          }
        } catch (error) {
          console.error("Error fetching user count:", error);
        }
      };
      fetchUserCount();
    } else {
      setUserCount(0);
    }
  }, [user]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale).format(num);
  };

  return (
    <section style={{ padding: "0 24px 80px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          {[
            {
              label: t('total'),
              value: formatNumber(parseInt(counts.total || "0")),
              icon: <span style={{ color: "#a78bfa" }}><TicketIcon className="w-8 h-8" /></span>,
              color: "#a78bfa",
              bg: "rgba(124, 58, 237, 0.15)",
              border: "rgba(124, 58, 237, 0.3)",
            },
            {
              label: t('available'),
              value: formatNumber(parseInt(counts.available || "0")),
              icon: <span style={{ color: "#10b981" }}><StarIcon className="w-8 h-8" /></span>,
              color: "#10b981",
              bg: "rgba(16, 185, 129, 0.1)",
              border: "rgba(16, 185, 129, 0.3)",
            },
            {
              label: t('sold'),
              value: formatNumber(parseInt(counts.sold || "0")),
              icon: <span style={{ color: "#f59e0b" }}><CupIcon className="w-8 h-8" /></span>,
              color: "#f59e0b",
              bg: "rgba(245, 158, 11, 0.1)",
              border: "rgba(245, 158, 11, 0.3)",
            },
            {
              label: t('subscribers'),
              value: formatNumber(userCount),
              icon: <span style={{ color: "#38bdf8" }}><UserGroupIcon className="w-8 h-8" /></span>,
              color: "#38bdf8",
              bg: "rgba(56, 189, 248, 0.1)",
              border: "rgba(56, 189, 248, 0.3)",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: item.bg,
                border: `1px solid ${item.border}`,
                borderRadius: "20px",
                padding: "28px 24px",
                textAlign: "center",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                {item.icon}
              </div>
              <p style={{ fontSize: "36px", fontWeight: "900", color: item.color, marginBottom: "6px" }}>
                {item.value}
              </p>
              <p style={{ color: "#9ca3af", fontSize: "14px", fontWeight: "600" }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
