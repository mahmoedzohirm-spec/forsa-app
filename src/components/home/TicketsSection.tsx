import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Ticket, TicketCounts, User } from "@/types";
import { SkeletonTicketGrid } from "@/components/ui/Skeleton";

interface TicketsSectionProps {
  tickets: Ticket[];
  counts: TicketCounts;
  loading: boolean;
  user: User | null;
  userTicketCount: number;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  search: string;
  setSearch: (search: string) => void;
  visibleCount: number;
  setVisibleCount: (count: number) => void;
  showMyTickets: boolean;
  setShowMyTickets: (show: boolean) => void;
  filteredTickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onSelectMultipleTickets: (ticketNumbers: number[]) => void;
}

export function TicketsSection({
  tickets,
  counts,
  loading,
  user,
  userTicketCount,
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
  visibleCount,
  setVisibleCount,
  showMyTickets,
  setShowMyTickets,
  filteredTickets,
  onSelectTicket,
  onSelectMultipleTickets,
}: TicketsSectionProps) {
  const t = useTranslations('HomePage.tickets');
  const locale = useLocale();

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale).format(num);
  };

  // حساب القيم المنسقة
  const totalTickets = parseInt(counts.total || "0");
  const availableTickets = parseInt(counts.available || "0");
  const pendingTickets = parseInt(counts.pending || "0");
  const soldTickets = parseInt(counts.sold || "0");
  const remainingCount = filteredTickets.length - visibleCount;

  // ===== حالة الحجز المتعدد =====
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedCount, setSelectedCount] = useState(1);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);

  // ===== دالة اختيار عشوائي =====
  const handleRandomSelect = async () => {
    if (selectedCount < 1 || selectedCount > 500) {
      alert("⚠️ يرجى اختيار عدد بين 1 و 500");
      return;
    }
    setIsLoadingRandom(true);
    try {
      const res = await fetch("/api/tickets/random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: selectedCount }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTickets(data.tickets);
      } else {
        alert("⚠️ " + data.error);
      }
    } catch {
      alert("⚠️ حدث خطأ أثناء اختيار البطاقات");
    } finally {
      setIsLoadingRandom(false);
    }
  };

  // ===== دالة الاختيار اليدوي (إضافة/إزالة بطاقة) =====
  const handleManualSelect = (ticketNumber: number) => {
    setSelectedTickets((prev) => {
      if (prev.includes(ticketNumber)) {
        // إلغاء تحديد البطاقة
        return prev.filter((num) => num !== ticketNumber);
      } else {
        // تحديد البطاقة (مع التحقق من الحد الأقصى 500)
        if (prev.length >= 500) {
          alert("⚠️ لا يمكنك اختيار أكثر من 500 بطاقة");
          return prev;
        }
        return [...prev, ticketNumber];
      }
    });
  };

  // ===== دالة تحديد ألوان البطاقة (تعتمد فقط على الحالة) =====
  const getTicketStyle = (ticket: Ticket) => {
    switch (ticket.status) {
      case "available":
        return {
          background: "rgba(34, 197, 94, 0.12)",
          border: "1.5px solid #22c55e",
          color: "#4ade80",
          fontWeight: "700",
        };
      case "pending":
        return {
          background: "rgba(250, 204, 21, 0.18)",
          border: "1.5px solid #facc15",
          color: "#facc15",
          fontWeight: "700",
        };
      case "sold":
        return {
          background: "rgba(107, 114, 128, 0.15)",
          border: "1px solid #4b5563",
          color: "#6b7280",
          fontWeight: "400",
        };
      default:
        return {
          background: "rgba(30, 20, 53, 0.5)",
          border: "1px solid rgba(124, 58, 237, 0.3)",
          color: "#c4b5fd",
          fontWeight: "500",
        };
    }
  };

  return (
    <section style={{ padding: "60px 24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
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
          <p style={{ color: "#9ca3af", fontSize: "16px" }}>
            {t('subtitle', { total: formatNumber(totalTickets) })}
          </p>
          {user && (
            <p style={{ color: "#c4b5fd", fontSize: "14px", marginTop: "8px" }}>
              {t('my_tickets_count', { count: formatNumber(userTicketCount) })}
            </p>
          )}
        </div>

        {/* الفلاتر والبحث */}
        <div
          style={{
            background: "rgba(30, 20, 53, 0.6)",
            border: "1px solid rgba(124, 58, 237, 0.2)",
            borderRadius: "16px",
            padding: "20px 24px",
            marginBottom: "24px",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { key: "all", label: `${t('filters.all')} (${formatNumber(totalTickets)})` },
              { key: "available", label: `${t('filters.available')} (${formatNumber(availableTickets)})` },
              { key: "pending", label: `${t('filters.pending')} (${formatNumber(pendingTickets)})` },
              { key: "sold", label: `${t('filters.sold')} (${formatNumber(soldTickets)})` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setStatusFilter(f.key);
                  setShowMyTickets(false);
                  setVisibleCount(300);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "700",
                  fontFamily: "Cairo, Inter, sans-serif",
                  transition: "all 0.2s",
                  background:
                    statusFilter === f.key && !showMyTickets
                      ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                      : "rgba(255,255,255,0.05)",
                  color: statusFilter === f.key && !showMyTickets ? "#fff" : "#9ca3af",
                }}
              >
                {f.label}
              </button>
            ))}
            {user && (
              <button
                onClick={() => {
                  setShowMyTickets(!showMyTickets);
                  setStatusFilter("all");
                  setVisibleCount(300);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "700",
                  fontFamily: "Cairo, Inter, sans-serif",
                  transition: "all 0.2s",
                  background: showMyTickets
                    ? "linear-gradient(135deg, #f59e0b, #d97706)"
                    : "rgba(255,255,255,0.05)",
                  color: showMyTickets ? "#fff" : "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {t('filters.my_tickets')}
                {userTicketCount > 0 && (
                  <span
                    style={{
                      fontSize: "12px",
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: "12px",
                      padding: "0 8px",
                    }}
                  >
                    {formatNumber(userTicketCount)}
                  </span>
                )}
              </button>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <input
              type="number"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "10px 44px 10px 16px",
                background: "rgba(15, 10, 28, 0.8)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "14px",
                width: "220px",
                fontFamily: "Cairo, Inter, sans-serif",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6b7280",
                fontSize: "16px",
              }}
            >
              🔍
            </span>
          </div>
        </div>

        {/* ===== Multi-select toolbar ===== */}
        <div
          style={{
            background: "rgba(30, 20, 53, 0.6)",
            border: "1px solid rgba(124, 58, 237, 0.3)",
            borderRadius: "16px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setMultiSelectMode(!multiSelectMode);
                if (multiSelectMode) {
                  setSelectedTickets([]);
                  setSelectedCount(1);
                }
              }}
              className={multiSelectMode ? "btn-gold" : "btn-purple"}
              style={{
                padding: "8px 20px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "700",
                fontFamily: "Cairo, Inter, sans-serif",
                border: "none",
                cursor: "pointer",
                background: multiSelectMode
                  ? "linear-gradient(135deg, #f59e0b, #d97706)"
                  : "rgba(124, 58, 237, 0.3)",
                color: multiSelectMode ? "#1a0a3c" : "#c4b5fd",
              }}
            >
              {multiSelectMode ? "❌ إلغاء الاختيار المتعدد" : "🎯 اختيار متعدد"}
            </button>

            {multiSelectMode && (
              <>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={selectedCount}
                  onChange={(e) => setSelectedCount(parseInt(e.target.value) || 1)}
                  style={{
                    width: "80px",
                    padding: "8px 12px",
                    background: "rgba(15, 10, 28, 0.8)",
                    border: "1px solid rgba(124, 58, 237, 0.3)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "14px",
                    fontFamily: "Cairo, Inter, sans-serif",
                  }}
                />
                <button
                  onClick={handleRandomSelect}
                  disabled={isLoadingRandom}
                  className="btn-gold"
                  style={{
                    padding: "8px 20px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "700",
                    fontFamily: "Cairo, Inter, sans-serif",
                    border: "none",
                    cursor: isLoadingRandom ? "not-allowed" : "pointer",
                    background: isLoadingRandom
                      ? "rgba(124, 58, 237, 0.3)"
                      : "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: isLoadingRandom ? "#6b7280" : "#1a0a3c",
                  }}
                >
                  {isLoadingRandom ? "جارٍ..." : "🎲 اختر عشوائياً"}
                </button>
              </>
            )}
          </div>

          {selectedTickets.length > 0 && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#fbbf24", fontSize: "14px", fontWeight: "700" }}>
                ✅ تم اختيار {selectedTickets.length} بطاقة
              </span>
              <button
                onClick={() => {
                  if (selectedTickets.length > 0) {
                    onSelectMultipleTickets(selectedTickets);
                  }
                }}
                className="btn-gold pulse-gold"
                style={{
                  padding: "8px 24px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "700",
                  fontFamily: "Cairo, Inter, sans-serif",
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#1a0a3c",
                }}
              >
                📦 حجز البطاقات المختارة
              </button>
              <button
                onClick={() => setSelectedTickets([])}
                style={{
                  padding: "6px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  fontFamily: "Cairo, Inter, sans-serif",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  cursor: "pointer",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#f87171",
                }}
              >
                ✕ إلغاء
              </button>
            </div>
          )}
        </div>

        {/* شبكة البطاقات */}
        {loading ? (
          <SkeletonTicketGrid />
        ) : (
          <>
            <div className="ticket-grid">
              {filteredTickets.slice(0, visibleCount).map((t) => {
                const isUserTicket = !!(user && t.user_id === user.id);
                const style = getTicketStyle(t);
                const isClickable = t.status === "available" || isUserTicket;
                const isSelected = selectedTickets.includes(t.number);

                return (
                  <div
                    key={t.number}
                    onClick={() => {
                      // ✅ وضع الاختيار المتعدد + البطاقة متاحة
                      if (multiSelectMode && t.status === "available") {
                        handleManualSelect(t.number);
                        return;
                      }
                      // الوضع العادي (اختيار بطاقة واحدة)
                      if (isClickable && !multiSelectMode) {
                        onSelectTicket(t);
                      }
                    }}
                    style={{
                      borderRadius: "12px",
                      padding: "12px 4px",
                      textAlign: "center",
                      cursor: (multiSelectMode && t.status === "available") || isClickable ? "pointer" : "default",
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      ...style,
                      border: isSelected ? "2px solid #f59e0b" : style.border,
                      boxShadow: isSelected ? "0 0 20px rgba(245, 158, 11, 0.4)" : "none",
                      minHeight: "60px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      if (isClickable || (multiSelectMode && t.status === "available")) {
                        e.currentTarget.style.transform = "scale(1.08)";
                        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isClickable || (multiSelectMode && t.status === "available")) {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                  >
                    <p
                      style={{
                        fontSize: "16px",
                        fontWeight: style.fontWeight || "800",
                        color: style.color,
                        lineHeight: 1.2,
                        marginBottom: "2px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {t.number}
                    </p>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        color:
                          t.status === "available"
                            ? "#4ade80"
                            : t.status === "pending"
                            ? "#facc15"
                            : "#6b7280",
                        opacity: t.status === "available" ? 0.8 : 0.6,
                      }}
                    >
                      {t.status === "available"
                        ? "●"
                        : t.status === "pending"
                        ? "⏳"
                        : "🔒"}
                    </div>
                  </div>
                );
              })}
            </div>

            {!search && filteredTickets.length > visibleCount && (
              <div style={{ textAlign: "center", marginTop: "32px" }}>
                <button
                  onClick={() => setVisibleCount(visibleCount + 300)}
                  className="btn-purple"
                  style={{
                    padding: "12px 32px",
                    borderRadius: "50px",
                    fontSize: "15px",
                    fontFamily: "Cairo, Inter, sans-serif",
                  }}
                >
                  {t('load_more', { remaining: formatNumber(remainingCount) })}
                </button>
              </div>
            )}

            {filteredTickets.length === 0 && !loading && (
              <div style={{ textAlign: "center", padding: "60px" }}>
                <p style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</p>
                <p style={{ color: "#9ca3af", fontSize: "16px" }}>
                  {showMyTickets ? t('no_my_tickets') : t('no_results')}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
