"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@/hooks/useUser";
import { useTickets } from "@/hooks/useTickets";
import NotificationBell from "@/components/ui/NotificationBell";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/useToast";
import { Spinner } from "@/components/ui/Spinner";
import AuthModal from "@/components/auth/AuthModal";
import BookingModal from "@/components/booking/BookingModal";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsSection } from "@/components/home/StatsSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { PrizesSection } from "@/components/home/PrizesSection";
import { TicketsSection } from "@/components/home/TicketsSection";
import { Footer } from "@/components/home/Footer";
import { TrophyIcon } from "@/components/ui/Icons";
import { requestPushPermission, onPushMessage } from "@/lib/firebase";

const AdminDashboard = dynamic(
  () => import("@/components/dashboard/AdminDashboard"),
  { loading: () => <Spinner />, ssr: false }
);

export default function HomePage() {
  const { user, login, logout, setUser } = useUser();
  const { tickets, counts, subscribers, loading: ticketsLoading, loadTickets } = useTickets();
  const { settings, prizes, loading: settingsLoading, loadSettingsAndPrizes } = useSettings();
  const { toast, showToast } = useToast();

  const [showAuth, setShowAuth] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("home");
  const [initialized, setInitialized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(300);
  const [showMyTickets, setShowMyTickets] = useState(false);

  const ticketPrice = settings.ticket_price || "100";
  const currency = settings.currency || "ريال";

  const hasLoaded = useRef(false);
  const userRef = useRef(user);
  const setUserRef = useRef(setUser);
  const showToastRef = useRef(showToast);

  useEffect(() => {
    userRef.current = user;
    setUserRef.current = setUser;
    showToastRef.current = showToast;
  });

  const parseCookieValue = (value: string): any => {
    let decoded = value;
    for (let i = 0; i < 5; i++) {
      try {
        if (decoded.startsWith("{")) {
          return JSON.parse(decoded);
        }
        const decodedOnce = decodeURIComponent(decoded);
        if (decodedOnce.startsWith("{")) {
          return JSON.parse(decodedOnce);
        }
        decoded = decodedOnce;
      } catch {
        try {
          decoded = decodeURIComponent(decoded);
        } catch {
          break;
        }
      }
    }
    if (decoded && decoded.startsWith("{")) {
      try {
        return JSON.parse(decoded);
      } catch {
        // فشل
      }
    }
    throw new Error("Unable to parse cookie value");
  };

  useEffect(() => {
    const checkUser = () => {
      const saved = localStorage.getItem("forsaUser");
      if (saved && !userRef.current) {
        try {
          const userData = JSON.parse(saved);
          setUserRef.current(userData);
          showToastRef.current("👋 مرحباً! تم تسجيل الدخول بنجاح.");
          console.log("✅ User restored from localStorage:", userData.email);
          return;
        } catch (e) {
          console.error("Error parsing localStorage:", e);
        }
      }

      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user="));
      if (cookie && !userRef.current) {
        try {
          const cookieValue = cookie.substring(cookie.indexOf("=") + 1);
          const userData = parseCookieValue(cookieValue);
          setUserRef.current(userData);
          localStorage.setItem("forsaUser", JSON.stringify(userData));
          showToastRef.current("👋 مرحباً! تم تسجيل الدخول بنجاح.");
          console.log("✅ User restored from cookie:", userData.email);
          document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        } catch (e) {
          console.error("Error parsing cookie:", e);
        }
      }
    };

    checkUser();

    const interval = setInterval(() => {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user="));
      if (cookie && !userRef.current) {
        try {
          const cookieValue = cookie.substring(cookie.indexOf("=") + 1);
          const userData = parseCookieValue(cookieValue);
          setUserRef.current(userData);
          localStorage.setItem("forsaUser", JSON.stringify(userData));
          showToastRef.current("👋 مرحباً! تم تسجيل الدخول بنجاح.");
          document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          console.log("✅ User restored from cookie (interval):", userData.email);
        } catch (e) {
          console.error("Error parsing cookie (interval):", e);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      const bootstrap = async () => {
        try {
          await fetch("/api/init");
          setInitialized(true);
          await loadTickets();
          await loadSettingsAndPrizes();
        } catch (e) {
          console.error(e);
          setInitialized(true);
        }
      };
      bootstrap();
    }
  }, []);

  useEffect(() => {
    if (user) {
      const registerPush = async () => {
        const token = await requestPushPermission();
        if (token) {
          try {
            const res = await fetch("/api/push/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.id, token }),
            });
            if (res.ok) {
              console.log("✅ Push token registered successfully");
            } else {
              console.error("❌ Failed to register push token");
            }
          } catch (error) {
            console.error("❌ Error registering push token:", error);
          }
        }
      };
      registerPush();
    }

    onPushMessage((payload) => {
      console.log("📨 Push message received:", payload);
    });
  }, [user]);

  const handleLogin = (u: any) => {
    login(u);
    showToast("👋 مرحباً! تم تسجيل الدخول بنجاح.");
    if (u.is_admin) setShowDashboard(true);
  };

  const handleLogout = useCallback(() => {
    logout();
    setShowDashboard(false);
    document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    showToast("👋 تم تسجيل الخروج.");
  }, [logout, showToast]);

  const scrollToTickets = () => setActiveSection("tickets");

  const filteredTickets = tickets
    .filter((t) => {
      if (showMyTickets) return user && t.user_id === user.id;
      if (statusFilter === "available") return t.status === "available";
      if (statusFilter === "pending") return t.status === "pending";
      if (statusFilter === "sold") return t.status === "sold";
      return true;
    })
    .filter((t) => (search ? String(t.number).includes(search) : true));

  const displayTickets = search ? filteredTickets : filteredTickets.slice(0, visibleCount);
  const userTicketCount = user ? tickets.filter((t) => t.user_id === user.id).length : 0;

  if (!initialized || settingsLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0a1c 0%, #080510 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px" }}>
        <div style={{ fontSize: "60px" }} className="float-anim">🏆</div>
        <p className="shimmer-text" style={{ fontSize: "24px", fontWeight: "800" }}>{settings.site_name || "فرصة العمر"}</p>
        <Spinner />
        <p style={{ color: "#6b7280", fontSize: "14px" }}>جارٍ تهيئة المنصة...</p>
      </div>
    );
  }

  if (showDashboard && user?.is_admin) {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0a1c 0%, #080510 100%)" }}>
      {toast && (
        <div style={{ position: "fixed", top: "24px", right: "50%", transform: "translateX(50%)", background: "rgba(30, 20, 53, 0.95)", border: "1px solid rgba(245, 158, 11, 0.5)", borderRadius: "12px", padding: "14px 24px", color: "#fbbf24", fontWeight: "700", fontSize: "15px", zIndex: 9000, boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
          {toast}
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />}

      {selectedTicket && (
        <BookingModal
          ticket={selectedTicket}
          user={user}
          ticketPrice={ticketPrice}
          currency={currency}
          onClose={() => setSelectedTicket(null)}
          onSuccess={() => {
            loadTickets();
            showToast("✅ تم إرسال طلب الحجز بنجاح! سيتم مراجعته قريباً.");
          }}
        />
      )}

      {/* ===== القائمة العلوية المعدلة ===== */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(8, 5, 16, 0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(124, 58, 237, 0.2)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 16px", height: "70px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* الشعار */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setActiveSection("home")}>
            <span style={{ color: "#f59e0b" }}><TrophyIcon /></span>
            <span style={{ fontSize: "20px", fontWeight: "900", background: "linear-gradient(135deg, #f59e0b, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {settings.site_name || "فرصة العمر"}
            </span>
          </div>

          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {[
                { id: "home", label: "الرئيسية" },
                { id: "tickets", label: "البطاقات" },
                { id: "prizes", label: "الجوائز" },
                { id: "how", label: "السحوبات" },
              ].map((link) => (
                <button
                  key={link.id}
                  onClick={() => { setActiveSection(link.id); setIsMobileMenuOpen(false); }}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600", fontFamily: "Cairo, Inter, sans-serif", transition: "all 0.2s", background: activeSection === link.id ? "rgba(124,58,237,0.2)" : "transparent", color: activeSection === link.id ? "#f59e0b" : "#9ca3af" }}
                  className="desktop-nav-link"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <NotificationBell />
                  <span style={{ color: "#c4b5fd", fontSize: "14px" }} className="desktop-user-name">👤 {user.name}</span>
                  {user.is_admin && (
                    <button onClick={() => setShowDashboard(true)} className="btn-gold desktop-admin-btn" style={{ padding: "8px 20px", borderRadius: "8px", fontSize: "13px", fontFamily: "Cairo, Inter, sans-serif" }}>
                      🛡️ لوحة التحكم
                    </button>
                  )}
                  <button onClick={handleLogout} className="desktop-logout-btn" style={{ padding: "8px 16px", background: "transparent", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px", color: "#f87171", cursor: "pointer", fontSize: "13px", fontFamily: "Cairo, Inter, sans-serif" }}>
                    خروج
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuth(true)} className="btn-gold" style={{ padding: "10px 24px", borderRadius: "10px", fontSize: "14px", fontFamily: "Cairo, Inter, sans-serif" }}>
                  تسجيل الدخول
                </button>
              )}

              {/* زر الهامبرغر (يظهر على الموبايل) */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                  display: "none",
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: "28px",
                  cursor: "pointer",
                  padding: "8px",
                  lineHeight: 1,
                }}
                className="mobile-menu-btn"
              >
                {isMobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
        </div>

        {/* ===== القائمة المنسدلة للموبايل (تظهر عند الضغط على الهامبرغر) ===== */}
        <div style={{
          display: isMobileMenuOpen ? "block" : "none",
          background: "rgba(8, 5, 16, 0.98)",
          borderTop: "1px solid rgba(124, 58, 237, 0.2)",
          padding: "16px",
          maxHeight: "80vh",
          overflowY: "auto",
        }}>
          {[
            { id: "home", label: "الرئيسية" },
            { id: "tickets", label: "البطاقات" },
            { id: "prizes", label: "الجوائز" },
            { id: "how", label: "السحوبات" },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => { setActiveSection(link.id); setIsMobileMenuOpen(false); }}
              style={{
                display: "block",
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                fontFamily: "Cairo, Inter, sans-serif",
                textAlign: "right",
                background: activeSection === link.id ? "rgba(124,58,237,0.2)" : "transparent",
                color: activeSection === link.id ? "#f59e0b" : "#c4b5fd",
                marginBottom: "4px",
              }}
            >
              {link.label}
            </button>
          ))}
          
          <hr style={{ border: "1px solid rgba(124,58,237,0.2)", margin: "12px 0" }} />
          
          {/* ✅ زر تغيير اللغة داخل القائمة المنسدلة */}
          <div style={{ padding: "8px 16px" }}>
            <LanguageSwitcher />
          </div>
          
          <hr style={{ border: "1px solid rgba(124,58,237,0.2)", margin: "12px 0" }} />
          
          {user ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 16px", color: "#c4b5fd" }}>
                <span>👤 {user.name}</span>
              </div>
              {user.is_admin && (
                <button
                  onClick={() => { setShowDashboard(true); setIsMobileMenuOpen(false); }}
                  className="btn-gold"
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", fontSize: "14px", fontFamily: "Cairo, Inter, sans-serif", marginTop: "8px" }}
                >
                  🛡️ لوحة التحكم
                </button>
              )}
              <button
                onClick={handleLogout}
                style={{ width: "100%", padding: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#f87171", cursor: "pointer", fontSize: "14px", fontFamily: "Cairo, Inter, sans-serif", marginTop: "8px" }}
              >
                خروج
              </button>
            </>
          ) : (
            <button
              onClick={() => { setShowAuth(true); setIsMobileMenuOpen(false); }}
              className="btn-gold"
              style={{ width: "100%", padding: "12px", borderRadius: "8px", fontSize: "14px", fontFamily: "Cairo, Inter, sans-serif" }}
            >
              تسجيل الدخول
            </button>
          )}
        </div>
      </nav>

      {activeSection === "home" && (
        <>
          <HeroSection
            settings={settings}
            ticketPrice={ticketPrice}
            currency={currency}
            user={user}
            onLogin={() => setShowAuth(true)}
            scrollToTickets={scrollToTickets}
            setActiveSection={setActiveSection}
          />
          <StatsSection counts={counts} subscribers={subscribers} />
          <HowItWorksSection ticketPrice={ticketPrice} />
        </>
      )}

      {(activeSection === "prizes" || activeSection === "home") && (
        <PrizesSection prizes={prizes} activeSection={activeSection} />
      )}

      {(activeSection === "tickets" || activeSection === "home") && (
        <TicketsSection
          tickets={displayTickets}
          counts={counts}
          loading={ticketsLoading}
          user={user}
          userTicketCount={userTicketCount}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          search={search}
          setSearch={setSearch}
          visibleCount={visibleCount}
          setVisibleCount={setVisibleCount}
          showMyTickets={showMyTickets}
          setShowMyTickets={setShowMyTickets}
          filteredTickets={filteredTickets}
          onSelectTicket={(t) => {
            if (t.status === "available") {
              if (!user) { setShowAuth(true); return; }
              setSelectedTicket(t);
            }
          }}
        />
      )}

      {activeSection === "how" && (
        <section style={{ padding: "60px 24px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "52px" }}>
              <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: "900", color: "#fff", marginBottom: "12px" }}>
                🎡 آلية السحوبات
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "16px" }}>سحب عشوائي شفاف وعادل للجميع</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px", marginBottom: "60px" }}>
              {[
                {
                  num: "01",
                  title: "سجل واختر بطاقتك",
                  desc: "أنشئ حسابك المجاني واختر رقمك المحظوظ من البطاقات المتاحة",
                  icon: "👤",
                  color: "#7c3aed",
                },
                {
                  num: "02",
                  title: "ادفع وأرسل الإيصال",
                  desc: `حوّل مبلغ البطاقة (${ticketPrice} ${currency}) عبر إحدى طرق الدفع المتاحة وارفع صورة الإيصال`,
                  icon: "💳",
                  color: "#f59e0b",
                },
                {
                  num: "03",
                  title: "انتظر السحب وافز!",
                  desc: "بعد قبول طلبك، انتظر السحب العشوائي بالعجلة الدوارة لتكون الفائز المحظوظ",
                  icon: "🎡",
                  color: "#10b981",
                },
              ].map((step) => (
                <div key={step.num} style={{ background: "rgba(30, 20, 53, 0.6)", border: "1px solid rgba(124, 58, 237, 0.2)", borderRadius: "20px", padding: "36px 28px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: "16px", left: "20px", fontSize: "80px", fontWeight: "900", color: "rgba(255,255,255,0.04)", lineHeight: 1, fontFamily: "Inter" }}>
                    {step.num}
                  </div>
                  <div style={{ fontSize: "40px", marginBottom: "16px" }}>{step.icon}</div>
                  <h3 style={{ fontSize: "20px", fontWeight: "800", color: step.color, marginBottom: "12px" }}>{step.title}</h3>
                  <p style={{ color: "#9ca3af", fontSize: "15px", lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(245,158,11,0.1))", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "24px", padding: "48px", textAlign: "center" }}>
              <h3 style={{ fontSize: "28px", fontWeight: "900", color: "#fff", marginBottom: "16px" }}>هل أنت مستعد للمشاركة؟</h3>
              <p style={{ color: "#c4b5fd", fontSize: "16px", marginBottom: "28px" }}>انضم إلى آلاف المشتركين واحصل على فرصتك للفوز بجوائز مذهلة</p>
              <button onClick={() => setShowAuth(true)} className="btn-gold pulse-gold" style={{ padding: "16px 48px", borderRadius: "50px", fontSize: "18px", fontWeight: "800", fontFamily: "Cairo, Inter, sans-serif" }}>
                🎟️ ابدأ الآن - {ticketPrice} {currency} فقط
              </button>
            </div>
          </div>
        </section>
      )}

      <Footer settings={settings} />
    </div>
  );
}
