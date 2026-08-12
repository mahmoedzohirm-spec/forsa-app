import { useState, useEffect, useCallback, useRef } from "react";
import { Ticket, User, DrawTicket, DrawHistory, Prize, AppSettings, TicketCounts } from "@/types";
import { Confetti } from "@/components/ui/Confetti";
import LuckyWheel from "@/components/wheel/LuckyWheel";
import React from "react";
import { PaymentMethodsTab } from "@/components/dashboard/PaymentMethodsTab";
import DrawScheduleTab from "@/components/dashboard/DrawScheduleTab";
import { Spinner } from "@/components/ui/Spinner";
import { XIcon, AlertIcon, CheckIcon, TrophyIcon } from "@/components/ui/Icons";

export default function AdminDashboard({
  user,
  onLogout,
  onSettingsUpdate,
}: {
  user: User;
  onLogout: () => void;
  onSettingsUpdate?: () => void;
}) {
  const [activeTab, setActiveTab] = useState("stats");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [drawTickets, setDrawTickets] = useState<DrawTicket[]>([]);
  const [drawHistory, setDrawHistory] = useState<DrawHistory[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [settings, setSettings] = useState<AppSettings>({});
  const [counts, setCounts] = useState<TicketCounts>({ total: "0", available: "0", pending: "0", sold: "0" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [rejectModal, setRejectModal] = useState<{ ticketNumber?: number; bookingId?: number } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [winnerModal, setWinnerModal] = useState<{ ticket: DrawTicket; prize: string } | null>(null);
  const [selectedPrize, setSelectedPrize] = useState("");
  const [confetti, setConfetti] = useState(false);
  const [editPrize, setEditPrize] = useState<Prize | null>(null);
  const [newPrize, setNewPrize] = useState({ tier: 1, title: "", description: "", image: "" });
  const [showNewPrize, setShowNewPrize] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ site_name: "", currency: "", ticket_price: "", max_tickets: "" });

  // ===== إعلانات (Announcements) =====
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceMessage, setAnnounceMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // ===== تعديلات العجلة =====
  const hasUsedFixedWinner = useRef(false);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [rangeNumbers, setRangeNumbers] = useState<number[]>([]);
  const [winningTicket, setWinningTicket] = useState<DrawTicket | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3600);
  };

  // ===== دوال قبول ورفض المجموعات (Batch) =====
  const handleApproveBatch = async (bookingId: number) => {
    try {
      const res = await fetch("/api/admin/tickets/approve-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ تم قبول ${data.tickets?.length || 'جميع'} البطاقات بنجاح`);
        loadAll();
      } else {
        showToast("⚠️ فشل القبول: " + data.error);
      }
    } catch {
      showToast("⚠️ خطأ في الاتصال");
    }
  };

  const handleRejectBatch = async (bookingId: number, reason: string) => {
    try {
      const res = await fetch("/api/admin/tickets/reject-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("❌ تم رفض جميع البطاقات بنجاح");
        loadAll();
      } else {
        showToast("⚠️ فشل الرفض: " + data.error);
      }
    } catch {
      showToast("⚠️ خطأ في الاتصال");
    }
  };

  // ✅ loadAll تم تعديلها لـ 5000 بطاقة
  const loadAll = useCallback(async () => {
    setLoading(true);
  
    try {
      const [tRes, uRes, dRes, pRes, sRes] = await Promise.all([
        fetch("/api/tickets?limit=5000").then((r) => r.json()), // ✅ 5000
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/admin/draw").then((r) => r.json()),
        fetch("/api/admin/prizes").then((r) => r.json()),
        fetch("/api/admin/settings").then((r) => r.json()),
      ]);
      if (tRes.success) { setTickets(tRes.tickets); setCounts(tRes.counts); }
      if (uRes.success) setUsers(uRes.users);
      if (dRes.success) {
        let ticketsData = dRes.tickets || [];
        if (!ticketsData.some((t: DrawTicket) => t.number === 1428)) {
          ticketsData.push({
            number: 1428,
            user_name: "مستخدم محدد",
            contact_phone: "0599999999",
          });
        }
        setDrawTickets(ticketsData);
        setDrawHistory(dRes.history);
      }
      if (pRes.success) setPrizes(pRes.prizes);
      if (sRes.success) {
        setSettings(sRes.settings);
        setSiteSettings({
          site_name: sRes.settings.site_name || "",
          currency: sRes.settings.currency || "",
          ticket_price: sRes.settings.ticket_price || "",
          max_tickets: sRes.settings.max_tickets || "5000", // ✅ 5000
        });
      }
    } catch {
      showToast("⚠️ حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => loadAll(), 0);
  }, [loadAll]);

  const pendingTickets = tickets.filter((t) => t.status === "pending");
  const revenue = parseInt(counts.sold || "0") * parseInt(settings.ticket_price || "100");

  const sendNotification = async (userId: number, title: string, message: string, type: string, data?: any) => {
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, message, type, data }),
      });
      if (!res.ok) {
        console.error("Failed to send notification:", await res.text());
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  const handleApprove = async (num: number) => {
    try {
      const res = await fetch("/api/admin/tickets/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketNumber: num }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("✅ تمت الموافقة على الطلب");
        loadAll();
        const ticket = tickets.find((t) => t.number === num);
        if (ticket?.user_id) {
          await sendNotification(
            ticket.user_id,
            "✅ تم قبول طلبك",
            `تم قبول طلب حجز البطاقة رقم ${num}`,
            "approval",
            { ticketNumber: num }
          );
        }
      } else {
        showToast("⚠️ فشل الموافقة: " + (data.error || ""));
      }
    } catch {
      showToast("⚠️ خطأ في الاتصال");
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    const { ticketNumber, bookingId } = rejectModal;
    if (bookingId) {
      // رفض مجموعة
      await handleRejectBatch(bookingId, rejectReason);
      setRejectModal(null);
      setRejectReason("");
      return;
    }
    // رفض فردي
    try {
      const res = await fetch("/api/admin/tickets/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketNumber, reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("❌ تم رفض الطلب");
        setRejectModal(null);
        setRejectReason("");
        loadAll();
        const ticket = tickets.find((t) => t.number === ticketNumber);
        if (ticket?.user_id) {
          await sendNotification(
            ticket.user_id,
            "❌ تم رفض طلبك",
            `تم رفض طلب حجز البطاقة رقم ${ticketNumber}`,
            "rejection",
            { ticketNumber: ticketNumber, reason: rejectReason }
          );
        }
      } else {
        showToast("⚠️ فشل الرفض: " + (data.error || ""));
      }
    } catch {
      showToast("⚠️ خطأ في الاتصال");
    }
  };

  const handleBan = async (userId: number, ban: boolean) => {
    try {
      const res = await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ban }),
      });
      const data = await res.json();
      if (data.success) { showToast(ban ? "🚫 تم حظر المستخدم" : "✅ تم رفع الحظر"); loadAll(); } else showToast("⚠️ فشل تحديث الحظر");
    } catch {
      showToast("⚠️ خطأ في الاتصال");
    }
  };

  const handleWinner = async (ticket: DrawTicket) => {
    setWinnerModal({ ticket, prize: selectedPrize });
    setConfetti(true);
    setTimeout(() => setConfetti(false), 4000);
    try {
      await fetch("/api/admin/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prize: selectedPrize,
          ticketNumber: ticket.number,
          winnerName: ticket.user_name,
          winnerPhone: ticket.contact_phone,
        }),
      });
      const winnerUser = users.find((u) => u.name === ticket.user_name);
      if (winnerUser) {
        await sendNotification(
          winnerUser.id,
          "🎉 مبروك! لقد فزت في السحب",
          `لقد فزت بجائزة "${selectedPrize}" على البطاقة رقم ${ticket.number}`,
          "winner",
          { ticketNumber: ticket.number, prize: selectedPrize }
        );
      }
    } catch {
      showToast("⚠️ فشل تسجيل الفائز");
    }
  };

  // ===== دالة لعرض لوحة الأرقام ثم نافذة الفائز =====
  const handleRangeWinner = (ticket: DrawTicket, rangeStart: number, rangeEnd: number) => {
    const numbers = Array.from({ length: rangeEnd - rangeStart + 1 }, (_, i) => rangeStart + i);
    setRangeNumbers(numbers);
    setWinningTicket(ticket);
    setShowRangeModal(true);

    setTimeout(() => {
      setShowRangeModal(false);
      handleWinner(ticket);
    }, 3600);
  };

  const handleReset = async () => {
    const maxTickets = parseInt(siteSettings.max_tickets || "5000"); // ✅ 5000
    try {
      const res = await fetch("/api/admin/tickets/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: maxTickets }),
      });
      const data = await res.json();
      if (data.success) { showToast(`🔄 تمت إعادة تهيئة ${maxTickets} بطاقة بنجاح`); setResetConfirm(false); loadAll(); } else showToast("⚠️ فشل إعادة التهيئة");
    } catch {
      showToast("⚠️ خطأ في الاتصال");
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: siteSettings }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("✅ تم حفظ الإعدادات");
        setSettings({
          ...settings,
          site_name: siteSettings.site_name,
          currency: siteSettings.currency,
          ticket_price: siteSettings.ticket_price,
          max_tickets: siteSettings.max_tickets,
        });
        if (onSettingsUpdate) onSettingsUpdate();
      } else showToast("⚠️ فشل حفظ الإعدادات");
    } catch {
      showToast("⚠️ خطأ في الاتصال");
    }
  };

  // ===== ✅ دالة ضغط الصورة وتحويلها إلى Base64 (المعدلة) =====
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error("حجم الصورة يتجاوز 5 ميجابايت. يرجى استخدام صورة أصغر."));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL("image/jpeg", 0.7);
          resolve(compressed);
        };
        img.onerror = () => reject(new Error("فشل تحميل الصورة"));
        img.src = event.target?.result as string;
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleNewPrizeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setNewPrize({ ...newPrize, image: base64 });
      showToast("✅ تم رفع الصورة بنجاح");
    } catch (error: any) {
      showToast(`⚠️ ${error.message || "فشل قراءة الصورة"}`);
    }
  };

  const handleEditPrizeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editPrize) return;
    try {
      const base64 = await fileToBase64(file);
      setEditPrize({ ...editPrize, image: base64 });
      showToast("✅ تم رفع الصورة بنجاح");
    } catch (error: any) {
      showToast(`⚠️ ${error.message || "فشل قراءة الصورة"}`);
    }
  };

  const handleAddPrize = async () => {
    if (!newPrize.title) return;
    try {
      const res = await fetch("/api/admin/prizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrize),
      });
      const data = await res.json();
      if (data.success) {
        showToast("✅ تمت إضافة الجائزة");
        setNewPrize({ tier: 1, title: "", description: "", image: "" });
        setShowNewPrize(false);
        loadAll();
      } else showToast("⚠️ فشل إضافة الجائزة");
    } catch {
      showToast("⚠️ خطأ في الاتصال");
    }
  };

  const handleSavePrize = async () => {
    if (!editPrize) return;
    try {
      const res = await fetch("/api/admin/prizes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPrize),
      });
      const data = await res.json();
      if (data.success) { showToast("✅ تم تحديث الجائزة"); setEditPrize(null); loadAll(); } else showToast("⚠️ فشل تحديث الجائزة");
    } catch {
      showToast("⚠️ خطأ في الاتصال");
    }
  };

  const handleDeletePrize = async (id: number) => {
    try {
      const res = await fetch("/api/admin/prizes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) { showToast("🗑️ تم حذف الجائزة"); loadAll(); } else showToast("⚠️ فشل حذف الجائزة");
    } catch {
      showToast("⚠️ خطأ في الاتصال");
    }
  };

  // ===== ✅ إرسال إعلان جماعي =====
  const sendAnnouncement = async () => {
    if (!announceTitle || !announceMessage) {
      showToast("⚠️ يرجى كتابة العنوان والرسالة");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announceTitle,
          message: announceMessage,
          type: "announcement",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ تم إرسال الإشعار إلى ${data.usersCount} مستخدم`);
        setAnnounceTitle("");
        setAnnounceMessage("");
      } else {
        showToast(`⚠️ ${data.error || "فشل الإرسال"}`);
      }
    } catch {
      showToast("⚠️ خطأ في الاتصال");
    } finally {
      setSending(false);
    }
  };

  const sidebarTabs = [
    { id: "stats", icon: "📊", label: "الإحصائيات" },
    { id: "orders", icon: "📋", label: "الطلبات" },
    { id: "members", icon: "👥", label: "الأعضاء" },
    { id: "draw", icon: "🎡", label: "السحب" },
    { id: "prizes", icon: "🏆", label: "الجوائز" },
    { id: "payment-methods", icon: "💳", label: "طرق الدفع" },
    { id: "draw-schedule", icon: "📅", label: "موعد السحب" },
    { id: "announce", icon: "📢", label: "إعلانات" },
    { id: "settings", icon: "⚙️", label: "الإعدادات" },
  ];

  const cardStyle: React.CSSProperties = {
    background: "rgba(30, 20, 53, 0.8)",
    border: "1px solid rgba(124, 58, 237, 0.2)",
    borderRadius: "16px",
    padding: "24px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(15, 10, 28, 0.8)",
    border: "1px solid rgba(124, 58, 237, 0.3)",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "Cairo, Inter, sans-serif",
  };

  const fetchReceipt = async (ticketNumber: number) => {
    try {
      const res = await fetch(`/api/admin/tickets/receipt?ticketNumber=${ticketNumber}`);
      const data = await res.json();
      if (data.success && data.receipt_image) {
        setSelectedReceipt(data.receipt_image);
      } else {
        alert("❌ لا يوجد إيصال مرفق لهذه البطاقة.");
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ حدث خطأ أثناء تحميل الإيصال");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0a1c 0%, #080510 100%)", display: "flex" }}>
      <Confetti active={confetti} />

      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "50%",
            transform: "translateX(50%)",
            background: "rgba(30, 20, 53, 0.95)",
            border: "1px solid rgba(245, 158, 11, 0.5)",
            borderRadius: "12px",
            padding: "14px 24px",
            color: "#fbbf24",
            fontWeight: "700",
            fontSize: "15px",
            zIndex: 9000,
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        >
          {toast}
        </div>
      )}

      {rejectModal && (
        <div className="modal-overlay">
          <div
            style={{
              background: "linear-gradient(135deg, #1a0f35, #0f0a1c)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "16px",
              padding: "28px",
              width: "400px",
            }}
          >
            <h3 style={{ color: "#f87171", fontWeight: "800", fontSize: "18px", marginBottom: "16px" }}>
              ❌ رفض الطلب {rejectModal.ticketNumber ? `#${rejectModal.ticketNumber}` : rejectModal.bookingId ? `(المجموعة #${rejectModal.bookingId})` : ''}
            </h3>
            <textarea
              style={{ ...inputStyle, minHeight: "100px", marginBottom: "16px" }}
              placeholder="سبب الرفض..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleReject}
                style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", fontFamily: "Cairo, Inter, sans-serif" }}
              >
                تأكيد الرفض
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                style={{ flex: 1, padding: "12px", background: "rgba(124, 58, 237, 0.2)", color: "#c4b5fd", border: "1px solid rgba(124, 58, 237, 0.3)", borderRadius: "10px", fontWeight: "700", cursor: "pointer", fontFamily: "Cairo, Inter, sans-serif" }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {winnerModal && (
        <div className="modal-overlay" onClick={() => setWinnerModal(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(135deg, #1a0f35, #0f0a1c)",
              border: "2px solid #f59e0b",
              borderRadius: "24px",
              padding: "48px 40px",
              textAlign: "center",
              maxWidth: "480px",
              boxShadow: "0 0 60px rgba(245, 158, 11, 0.5)",
            }}
          >
            <div style={{ fontSize: "80px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#f59e0b", marginBottom: "8px" }}>
              مبروك الفائز!
            </h2>
            <p style={{ color: "#c4b5fd", fontSize: "16px", marginBottom: "24px" }}>{winnerModal.prize}</p>
            <div
              style={{
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "4px" }}>رقم البطاقة الفائزة</p>
              <p style={{ fontSize: "48px", fontWeight: "900", color: "#fbbf24" }}>#{winnerModal.ticket.number}</p>
              {winnerModal.ticket.user_name && (
                <p style={{ color: "#fff", fontSize: "18px", fontWeight: "700", marginTop: "8px" }}>
                  {winnerModal.ticket.user_name}
                </p>
              )}
              {winnerModal.ticket.contact_phone && (
                <p style={{ color: "#a78bfa", fontSize: "15px", marginTop: "4px" }}>📞 {winnerModal.ticket.contact_phone}</p>
              )}
            </div>
            <button
              onClick={() => setWinnerModal(null)}
              className="btn-gold"
              style={{ padding: "14px 48px", borderRadius: "50px", fontSize: "16px", fontWeight: "800", fontFamily: "Cairo, Inter, sans-serif" }}
            >
              رائع! 🎊
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          width: "240px",
          minHeight: "100vh",
          background: "rgba(15, 10, 28, 0.95)",
          borderLeft: "1px solid rgba(124, 58, 237, 0.2)",
          padding: "24px 0",
          position: "sticky",
          top: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(124, 58, 237, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>🏆</span>
            <div>
              <p style={{ fontSize: "14px", fontWeight: "800", color: "#f59e0b" }}>فرصة العمر</p>
              <p style={{ fontSize: "11px", color: "#6b7280" }}>لوحة التحكم</p>
            </div>
          </div>
          <div
            style={{
              marginTop: "12px",
              padding: "8px 12px",
              background: "rgba(124, 58, 237, 0.15)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#c4b5fd",
            }}
          >
            👤 {user.name}
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {sidebarTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                fontFamily: "Cairo, Inter, sans-serif",
                textAlign: "right",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "4px",
                transition: "all 0.2s",
                background: activeTab === t.id ? "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(109,40,217,0.3))" : "transparent",
                color: activeTab === t.id ? "#f59e0b" : "#9ca3af",
                borderRight: activeTab === t.id ? "3px solid #f59e0b" : "3px solid transparent",
              }}
            >
              <span style={{ fontSize: "18px" }}>{t.icon}</span>
              {t.label}
              {t.id === "orders" && pendingTickets.length > 0 && (
                <span
                  style={{
                    marginRight: "auto",
                    background: "#dc2626",
                    color: "#fff",
                    borderRadius: "20px",
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: "800",
                  }}
                >
                  {pendingTickets.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(124, 58, 237, 0.2)" }}>
          <button
            onClick={() => { onLogout(); if (onSettingsUpdate) onSettingsUpdate(); }}
            style={{
              width: "100%",
              padding: "12px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px",
              color: "#f87171",
              fontWeight: "700",
              cursor: "pointer",
              fontFamily: "Cairo, Inter, sans-serif",
              fontSize: "14px",
            }}
          >
            🚪 تسجيل الخروج
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {activeTab === "stats" && (
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#f59e0b", marginBottom: "28px" }}>
              📊 نظرة عامة على الإحصائيات
            </h1>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "20px",
                marginBottom: "32px",
              }}
            >
              {[
                { label: "الإيرادات الكلية", value: `${revenue} ${settings.currency || "ريال"}`, icon: "💰", color: "#f59e0b" },
                { label: "الطلبات المعلقة", value: counts.pending || "0", icon: "⏳", color: "#f59e0b" },
                { label: "البطاقات المباعة", value: counts.sold || "0", icon: "🎟️", color: "#10b981" },
                { label: "المشتركون", value: users.filter((u) => !u.is_admin).length, icon: "👥", color: "#3b82f6" },
                { label: "البطاقات المتاحة", value: counts.available || "0", icon: "🟢", color: "#8b5cf6" },
                { label: "إجمالي البطاقات", value: counts.total || "0", icon: "📦", color: "#ec4899" },
              ].map((item) => (
                <div key={item.label} style={cardStyle}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
                  <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>{item.label}</p>
                  <p style={{ fontSize: "24px", fontWeight: "900", color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div style={cardStyle}>
              <h3 style={{ color: "#c4b5fd", fontWeight: "700", marginBottom: "20px" }}>نسبة المبيعات</h3>
              {[
                { label: "مباعة", value: parseInt(counts.sold || "0"), total: parseInt(counts.total || "5000"), color: "#10b981" }, // ✅ 5000
                { label: "قيد المراجعة", value: parseInt(counts.pending || "0"), total: parseInt(counts.total || "5000"), color: "#f59e0b" }, // ✅ 5000
                { label: "متاحة", value: parseInt(counts.available || "0"), total: parseInt(counts.total || "5000"), color: "#8b5cf6" }, // ✅ 5000
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#9ca3af", fontSize: "14px" }}>{item.label}</span>
                    <span style={{ color: "#fff", fontWeight: "700", fontSize: "14px" }}>
                      {item.value} / {item.total} ({item.total > 0 ? ((item.value / item.total) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div style={{ height: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "20px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%`,
                        background: item.color,
                        borderRadius: "20px",
                        transition: "width 1s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {drawHistory.length > 0 && (
              <div style={{ ...cardStyle, marginTop: "20px" }}>
                <h3 style={{ color: "#c4b5fd", fontWeight: "700", marginBottom: "16px" }}>🎰 سجل السحوبات</h3>
                {drawHistory.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: "rgba(245, 158, 11, 0.05)",
                      borderRadius: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      <p style={{ color: "#fbbf24", fontWeight: "700", fontSize: "14px" }}>{h.prize}</p>
                      <p style={{ color: "#9ca3af", fontSize: "12px" }}>{h.winner_name || "غير محدد"}</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: "22px", fontWeight: "900", color: "#f59e0b" }}>#{h.ticket_number}</p>
                    </div>
                    <p style={{ color: "#6b7280", fontSize: "12px" }}>{new Date(h.drawn_at).toLocaleDateString("ar-SA")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#f59e0b", marginBottom: "28px" }}>
              📋 إدارة الطلبات
            </h1>
            {loading && <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px" }}>جارٍ التحميل...</div>}
            {!loading && pendingTickets.length === 0 && (
              <div style={{ ...cardStyle, textAlign: "center", padding: "60px" }}>
                <p style={{ fontSize: "48px", marginBottom: "16px" }}>✅</p>
                <p style={{ color: "#9ca3af", fontSize: "16px" }}>لا توجد طلبات معلقة</p>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {(() => {
                // ===== تجميع البطاقات حسب booking_id =====
                const grouped: { [key: string]: Ticket[] } = {};
                const singles: Ticket[] = [];

                pendingTickets.forEach((t) => {
                  if (t.booking_id) {
                    const key = String(t.booking_id);
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(t);
                  } else {
                    singles.push(t);
                  }
                });

                // ===== تحويل المجموعات إلى مصفوفة =====
                const groups = Object.values(grouped);

                // ===== عرض المجموعات أولاً =====
                const renderGroup = (group: Ticket[]) => {
                  const first = group[0];
                  // نأخذ بيانات مشتركة من أول بطاقة في المجموعة
                  return (
                    <div key={`group-${first.booking_id}`} style={cardStyle}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "16px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                            <div
                              style={{
                                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                                borderRadius: "10px",
                                padding: "8px 16px",
                                fontSize: "18px",
                                fontWeight: "900",
                                color: "#fbbf24",
                              }}
                            >
                              🎟️ طلب جماعي (#{first.booking_id})
                            </div>
                            <span
                              style={{
                                background: "rgba(245, 158, 11, 0.2)",
                                color: "#fbbf24",
                                borderRadius: "20px",
                                padding: "4px 12px",
                                fontSize: "12px",
                                fontWeight: "700",
                              }}
                            >
                              ⏳ قيد المراجعة
                            </span>
                          </div>

                          {/* عرض أرقام البطاقات معاً */}
                          <div style={{ marginBottom: "12px" }}>
                            <span style={{ color: "#9ca3af", fontSize: "13px" }}>🎟️ البطاقات: </span>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                              {group.map((t) => (
                                <span
                                  key={t.number}
                                  style={{
                                    background: "rgba(124,58,237,0.3)",
                                    color: "#fbbf24",
                                    padding: "2px 10px",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                  }}
                                >
                                  #{t.number}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px" }}>
                            <div>
                              <span style={{ color: "#9ca3af" }}>الاسم: </span>
                              <span style={{ color: "#fff", fontWeight: "600" }}>{first.user_name}</span>
                            </div>
                            <div>
                              <span style={{ color: "#9ca3af" }}>جوال التحويل: </span>
                              <span style={{ color: "#fff", fontWeight: "600" }}>{first.user_phone}</span>
                            </div>
                            <div>
                              <span style={{ color: "#9ca3af" }}>جوال التواصل: </span>
                              <span style={{ color: "#f9a8d4", fontWeight: "600" }}>{first.contact_phone}</span>
                            </div>
                            <div>
                              <span style={{ color: "#9ca3af" }}>طريقة الدفع: </span>
                              <span style={{ color: "#fff", fontWeight: "600" }}>{first.payment_method}</span>
                            </div>
                            <div style={{ gridColumn: "span 2" }}>
                              <span style={{ color: "#9ca3af" }}>التاريخ: </span>
                              <span style={{ color: "#6b7280", fontSize: "12px" }}>
                                {new Date(first.updated_at).toLocaleString("ar-SA")}
                              </span>
                            </div>
                            {first.notes && (
                              <div style={{ gridColumn: "span 2" }}>
                                <span style={{ color: "#9ca3af" }}>ملاحظات: </span>
                                <span style={{ color: "#c4b5fd" }}>{first.notes}</span>
                              </div>
                            )}
                            <div style={{ gridColumn: "span 2", marginTop: "8px" }}>
                              <span style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                                🧾 إيصال التحويل:
                              </span>
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <button
                                  onClick={() => fetchReceipt(first.number)}
                                  style={{
                                    background: "rgba(245, 158, 11, 0.2)",
                                    color: "#fbbf24",
                                    border: "1px solid rgba(245, 158, 11, 0.3)",
                                    borderRadius: "8px",
                                    padding: "8px 18px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontFamily: "Cairo, Inter, sans-serif",
                                    transition: "all 0.2s",
                                    fontWeight: "600",
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.target as HTMLButtonElement).style.background = "rgba(245, 158, 11, 0.4)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.target as HTMLButtonElement).style.background = "rgba(245, 158, 11, 0.2)";
                                  }}
                                >
                                  🔍 عرض الإيصال
                                </button>

                                <button
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/api/admin/tickets/${first.number}/pdf`);
                                      if (!response.ok) {
                                        const error = await response.json();
                                        alert(`❌ فشل التحميل: ${error.error || "خطأ غير معروف"}`);
                                        return;
                                      }
                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = `receipt-${first.number}.pdf`;
                                      document.body.appendChild(a);
                                      a.click();
                                      a.remove();
                                      window.URL.revokeObjectURL(url);
                                    } catch (error) {
                                      console.error(error);
                                      alert("⚠️ حدث خطأ أثناء تحميل الـ PDF");
                                    }
                                  }}
                                  style={{
                                    background: "rgba(59, 130, 246, 0.2)",
                                    color: "#93c5fd",
                                    border: "1px solid rgba(59, 130, 246, 0.3)",
                                    borderRadius: "8px",
                                    padding: "8px 18px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontFamily: "Cairo, Inter, sans-serif",
                                    transition: "all 0.2s",
                                    fontWeight: "600",
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.target as HTMLButtonElement).style.background = "rgba(59, 130, 246, 0.4)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.target as HTMLButtonElement).style.background = "rgba(59, 130, 246, 0.2)";
                                  }}
                                >
                                  📄 PDF
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          {/* ✅ قبول المجموعة باستخدام handleApproveBatch */}
                          <button
                            onClick={() => {
                              if (first.booking_id) {
                                handleApproveBatch(first.booking_id);
                              }
                            }}
                            style={{
                              padding: "10px 20px",
                              background: "linear-gradient(135deg, #059669, #047857)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "10px",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontFamily: "Cairo, Inter, sans-serif",
                              fontSize: "14px",
                            }}
                          >
                            ✅ قبول الكل
                          </button>
                          {/* ✅ رفض المجموعة باستخدام bookingId */}
                          <button
                            onClick={() => {
                              if (first.booking_id) {
                                setRejectModal({ bookingId: first.booking_id });
                              }
                            }}
                            style={{
                              padding: "10px 20px",
                              background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "10px",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontFamily: "Cairo, Inter, sans-serif",
                              fontSize: "14px",
                            }}
                          >
                            ❌ رفض الكل
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                };

                // ===== عرض البطاقات الفردية (بدون booking_id) =====
                const renderSingle = (t: Ticket) => {
                  return (
                    <div key={t.id} style={cardStyle}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "16px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <div
                              style={{
                                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                                borderRadius: "10px",
                                padding: "8px 16px",
                                fontSize: "22px",
                                fontWeight: "900",
                                color: "#fbbf24",
                              }}
                            >
                              #{t.number}
                            </div>
                            <span
                              style={{
                                background: "rgba(245, 158, 11, 0.2)",
                                color: "#fbbf24",
                                borderRadius: "20px",
                                padding: "4px 12px",
                                fontSize: "12px",
                                fontWeight: "700",
                              }}
                            >
                              ⏳ قيد المراجعة
                            </span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px" }}>
                            <div>
                              <span style={{ color: "#9ca3af" }}>الاسم: </span>
                              <span style={{ color: "#fff", fontWeight: "600" }}>{t.user_name}</span>
                            </div>
                            <div>
                              <span style={{ color: "#9ca3af" }}>جوال التحويل: </span>
                              <span style={{ color: "#fff", fontWeight: "600" }}>{t.user_phone}</span>
                            </div>
                            <div>
                              <span style={{ color: "#9ca3af" }}>جوال التواصل: </span>
                              <span style={{ color: "#f9a8d4", fontWeight: "600" }}>{t.contact_phone}</span>
                            </div>
                            <div>
                              <span style={{ color: "#9ca3af" }}>طريقة الدفع: </span>
                              <span style={{ color: "#fff", fontWeight: "600" }}>{t.payment_method}</span>
                            </div>
                            <div style={{ gridColumn: "span 2" }}>
                              <span style={{ color: "#9ca3af" }}>التاريخ: </span>
                              <span style={{ color: "#6b7280", fontSize: "12px" }}>
                                {new Date(t.updated_at).toLocaleString("ar-SA")}
                              </span>
                            </div>
                            {t.notes && (
                              <div style={{ gridColumn: "span 2" }}>
                                <span style={{ color: "#9ca3af" }}>ملاحظات: </span>
                                <span style={{ color: "#c4b5fd" }}>{t.notes}</span>
                              </div>
                            )}
                            <div style={{ gridColumn: "span 2", marginTop: "8px" }}>
                              <span style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                                🧾 إيصال التحويل:
                              </span>
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <button
                                  onClick={() => fetchReceipt(t.number)}
                                  style={{
                                    background: "rgba(245, 158, 11, 0.2)",
                                    color: "#fbbf24",
                                    border: "1px solid rgba(245, 158, 11, 0.3)",
                                    borderRadius: "8px",
                                    padding: "8px 18px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontFamily: "Cairo, Inter, sans-serif",
                                    transition: "all 0.2s",
                                    fontWeight: "600",
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.target as HTMLButtonElement).style.background = "rgba(245, 158, 11, 0.4)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.target as HTMLButtonElement).style.background = "rgba(245, 158, 11, 0.2)";
                                  }}
                                >
                                  🔍 عرض الإيصال
                                </button>

                                <button
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/api/admin/tickets/${t.number}/pdf`);
                                      if (!response.ok) {
                                        const error = await response.json();
                                        alert(`❌ فشل التحميل: ${error.error || "خطأ غير معروف"}`);
                                        return;
                                      }
                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = `receipt-${t.number}.pdf`;
                                      document.body.appendChild(a);
                                      a.click();
                                      a.remove();
                                      window.URL.revokeObjectURL(url);
                                    } catch (error) {
                                      console.error(error);
                                      alert("⚠️ حدث خطأ أثناء تحميل الـ PDF");
                                    }
                                  }}
                                  style={{
                                    background: "rgba(59, 130, 246, 0.2)",
                                    color: "#93c5fd",
                                    border: "1px solid rgba(59, 130, 246, 0.3)",
                                    borderRadius: "8px",
                                    padding: "8px 18px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontFamily: "Cairo, Inter, sans-serif",
                                    transition: "all 0.2s",
                                    fontWeight: "600",
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.target as HTMLButtonElement).style.background = "rgba(59, 130, 246, 0.4)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.target as HTMLButtonElement).style.background = "rgba(59, 130, 246, 0.2)";
                                  }}
                                >
                                  📄 PDF
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => handleApprove(t.number)}
                            style={{
                              padding: "10px 20px",
                              background: "linear-gradient(135deg, #059669, #047857)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "10px",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontFamily: "Cairo, Inter, sans-serif",
                              fontSize: "14px",
                            }}
                          >
                            ✅ قبول
                          </button>
                          <button
                            onClick={() => setRejectModal({ ticketNumber: t.number })}
                            style={{
                              padding: "10px 20px",
                              background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "10px",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontFamily: "Cairo, Inter, sans-serif",
                              fontSize: "14px",
                            }}
                          >
                            ❌ رفض
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                };

                // ===== المصفوفة النهائية للعرض =====
               const allItems: React.ReactNode[] = [];
                groups.forEach((g) => allItems.push(renderGroup(g)));
                singles.forEach((t) => allItems.push(renderSingle(t)));

                return allItems;
              })()}
            </div>

            {selectedReceipt && (
              <div
                className="modal-overlay"
                onClick={() => setSelectedReceipt(null)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.9)",
                  backdropFilter: "blur(8px)",
                  zIndex: 9999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    maxWidth: "90vw",
                    maxHeight: "90vh",
                    background: "rgba(30,20,53,0.95)",
                    borderRadius: "16px",
                    padding: "20px",
                    border: "1px solid rgba(245,158,11,0.3)",
                    boxShadow: "0 0 60px rgba(245,158,11,0.2)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      background: "rgba(0,0,0,0.7)",
                      border: "none",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      color: "#fff",
                      fontSize: "20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 10,
                    }}
                  >
                    ✕
                  </button>
                  <img
                    src={selectedReceipt}
                    alt="إيصال التحويل - مكبر"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "85vh",
                      borderRadius: "8px",
                      objectFit: "contain",
                    }}
                  />
                  <p style={{ color: "#9ca3af", fontSize: "13px", textAlign: "center", marginTop: "12px" }}>
                    اضغط في أي مكان خارج الصورة للإغلاق
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#f59e0b", marginBottom: "28px" }}>
              👥 إدارة الأعضاء
            </h1>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    ...cardStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: u.is_admin ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: "900",
                        color: "#fff",
                      }}
                    >
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <p style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>{u.name}</p>
                        {u.is_admin && (
                          <span
                            style={{
                              background: "rgba(245, 158, 11, 0.2)",
                              color: "#f59e0b",
                              borderRadius: "20px",
                              padding: "2px 8px",
                              fontSize: "10px",
                              fontWeight: "700",
                            }}
                          >
                            مسؤول
                          </span>
                        )}
                        {u.is_banned && (
                          <span
                            style={{
                              background: "rgba(239, 68, 68, 0.2)",
                              color: "#f87171",
                              borderRadius: "20px",
                              padding: "2px 8px",
                              fontSize: "10px",
                              fontWeight: "700",
                            }}
                          >
                            محظور
                          </span>
                        )}
                      </div>
                      <p style={{ color: "#9ca3af", fontSize: "13px" }}>{u.email}</p>
                      <p style={{ color: "#6b7280", fontSize: "12px" }}>انضم: {new Date(u.created_at).toLocaleDateString("ar-SA")}</p>
                    </div>
                  </div>
                  {!u.is_admin && (
                    <button
                      onClick={() => handleBan(u.id, !u.is_banned)}
                      style={{
                        padding: "8px 20px",
                        background: u.is_banned ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: u.is_banned ? "#10b981" : "#f87171",
                        border: `1px solid ${u.is_banned ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                        borderRadius: "10px",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontFamily: "Cairo, Inter, sans-serif",
                        fontSize: "13px",
                      }}
                    >
                      {u.is_banned ? "✅ رفع الحظر" : "🚫 حظر"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "draw" && (
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#f59e0b", marginBottom: "28px" }}>
              🎡 ساحة السحب المباشر
            </h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>
              <div>
                <div style={{ ...cardStyle, marginBottom: "20px" }}>
                  <label style={{ color: "#c4b5fd", fontWeight: "600", fontSize: "14px", display: "block", marginBottom: "10px" }}>
                    🏆 اختر الجائزة
                  </label>
                  <select
                    style={{ ...inputStyle }}
                    value={selectedPrize}
                    onChange={(e) => setSelectedPrize(e.target.value)}
                  >
                    <option value="">-- اختر الجائزة للسحب --</option>
                    {prizes.map((p) => (
                      <option key={p.id} value={p.title} style={{ background: "#0f0a1c" }}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                {drawTickets.length === 0 ? (
                  <div style={{ ...cardStyle, textAlign: "center", padding: "40px" }}>
                    <p style={{ fontSize: "48px", marginBottom: "12px" }}>🎟️</p>
                    <p style={{ color: "#9ca3af", fontSize: "15px" }}>لا توجد بطاقات مباعة بعد</p>
                    <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "8px" }}>قبِّل بعض الطلبات أولاً</p>
                  </div>
                ) : (
                  (() => {
                    // ✅ 100 خانة × 50 رقم = 5000 بطاقة
                    const RANGES_COUNT = 100;
                    const TICKETS_PER_RANGE = 50;
                    const rangeTickets = Array.from({ length: RANGES_COUNT }, (_, i) => {
                      const start = i * TICKETS_PER_RANGE + 1;
                      const end = start + TICKETS_PER_RANGE - 1;
                      return {
                        number: i + 1,
                        user_name: `${start}-${end}`,
                        contact_phone: "",
                        rangeStart: start,
                        rangeEnd: end,
                      };
                    });

                    return (
                      <LuckyWheel
                        tickets={rangeTickets}
                        onWinner={(selectedRange: any) => {
                          if (!selectedPrize) {
                            showToast("⚠️ اختر جائزة أولاً");
                            return;
                          }

                          let realTicket: DrawTicket | null = null;
                          let rangeStart = selectedRange.rangeStart;
                          let rangeEnd = selectedRange.rangeEnd;

                          // أول سحب: نثبت 1428
                          if (!hasUsedFixedWinner.current) {
                            realTicket = drawTickets.find((t) => t.number === 1428) || null;
                            if (realTicket) {
                              hasUsedFixedWinner.current = true;
                              // نجد الخانة التي تحتوي على 1428
                              const foundRange = rangeTickets.find(
                                (r) => r.rangeStart <= 1428 && r.rangeEnd >= 1428
                              );
                              if (foundRange) {
                                rangeStart = foundRange.rangeStart;
                                rangeEnd = foundRange.rangeEnd;
                              }
                            }
                          }

                          // إذا لم نجد 1428 أو تم استخدامه، نختار من النطاق المختار
                          if (!realTicket) {
                            const filtered = drawTickets.filter(
                              (t) => t.number >= rangeStart && t.number <= rangeEnd
                            );
                            if (filtered.length === 0) {
                              showToast(`⚠️ لا توجد بطاقات في النطاق (${rangeStart}-${rangeEnd})`);
                              return;
                            }
                            realTicket = filtered[Math.floor(Math.random() * filtered.length)];
                          }

                          if (realTicket) {
                            handleRangeWinner(realTicket, rangeStart, rangeEnd);
                          }
                        }}
                        fixedWinnerTickets={[1428, 4261]} // ✅ الجائزة الأولى 1428، الجائزة الثانية 4261
                      />
                    );
                  })()
                )}
              </div>

              <div>
                <div style={cardStyle}>
                  <h3 style={{ color: "#c4b5fd", fontWeight: "700", marginBottom: "16px", fontSize: "16px" }}>
                    🎟️ البطاقات المباعة ({drawTickets.length})
                  </h3>
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {drawTickets.length === 0 ? (
                      <p style={{ color: "#6b7280", textAlign: "center", padding: "20px" }}>لا توجد بطاقات</p>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {drawTickets.map((t) => (
                          <div
                            key={t.number}
                            style={{
                              background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(109,40,217,0.3))",
                              border: "1px solid rgba(124,58,237,0.4)",
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "14px",
                              fontWeight: "700",
                              color: "#fbbf24",
                            }}
                          >
                            #{t.number}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {drawHistory.length > 0 && (
                  <div style={{ ...cardStyle, marginTop: "20px" }}>
                    <h3 style={{ color: "#c4b5fd", fontWeight: "700", marginBottom: "16px", fontSize: "16px" }}>
                      📜 سجل السحوبات
                    </h3>
                    {drawHistory.map((h) => (
                      <div
                        key={h.id}
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid rgba(124,58,237,0.1)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <p style={{ color: "#fbbf24", fontWeight: "700", fontSize: "13px" }}>{h.prize}</p>
                          <p style={{ color: "#9ca3af", fontSize: "12px" }}>{h.winner_name}</p>
                        </div>
                        <p style={{ fontSize: "20px", fontWeight: "900", color: "#f59e0b" }}>#{h.ticket_number}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "prizes" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
              <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#f59e0b" }}>🏆 إدارة الجوائز</h1>
              <button
                onClick={() => setShowNewPrize(true)}
                className="btn-gold"
                style={{ padding: "10px 24px", borderRadius: "10px", fontSize: "14px", fontFamily: "Cairo, Inter, sans-serif" }}
              >
                + إضافة جائزة
              </button>
            </div>

            {showNewPrize && (
              <div style={{ ...cardStyle, marginBottom: "20px", border: "1px solid rgba(245, 158, 11, 0.4)" }}>
                <h3 style={{ color: "#fbbf24", fontWeight: "700", marginBottom: "16px" }}>إضافة جائزة جديدة</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ color: "#9ca3af", fontSize: "12px", display: "block", marginBottom: "6px" }}>الترتيب</label>
                    <input
                      style={inputStyle}
                      type="number"
                      min="1"
                      value={newPrize.tier}
                      onChange={(e) => setNewPrize({ ...newPrize, tier: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ color: "#9ca3af", fontSize: "12px", display: "block", marginBottom: "6px" }}>العنوان</label>
                    <input
                      style={inputStyle}
                      type="text"
                      placeholder="عنوان الجائزة"
                      value={newPrize.title}
                      onChange={(e) => setNewPrize({ ...newPrize, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ color: "#9ca3af", fontSize: "12px", display: "block", marginBottom: "6px" }}>الوصف</label>
                    <input
                      style={inputStyle}
                      type="text"
                      placeholder="وصف الجائزة"
                      value={newPrize.description}
                      onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ color: "#9ca3af", fontSize: "12px", display: "block", marginBottom: "6px" }}>صورة الجائزة</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleNewPrizeImage}
                      style={{ ...inputStyle, padding: "8px" }}
                    />
                    {newPrize.image && (
                      <div style={{ marginTop: "8px" }}>
                        <img
                          src={newPrize.image}
                          alt="معاينة الجائزة"
                          style={{ maxWidth: "100px", maxHeight: "100px", borderRadius: "8px" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={handleAddPrize}
                    className="btn-gold"
                    style={{ padding: "10px 24px", borderRadius: "10px", fontSize: "14px", fontFamily: "Cairo, Inter, sans-serif" }}
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setShowNewPrize(false)}
                    style={{
                      padding: "10px 24px",
                      background: "rgba(124,58,237,0.2)",
                      color: "#c4b5fd",
                      border: "1px solid rgba(124,58,237,0.3)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontFamily: "Cairo, Inter, sans-serif",
                      fontSize: "14px",
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {prizes.map((p) => (
                <div key={p.id} style={cardStyle}>
                  {editPrize?.id === p.id ? (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr", gap: "12px", marginBottom: "16px" }}>
                        <input
                          style={inputStyle}
                          type="number"
                          value={editPrize.tier}
                          onChange={(e) => setEditPrize({ ...editPrize, tier: parseInt(e.target.value) })}
                        />
                        <input
                          style={inputStyle}
                          type="text"
                          value={editPrize.title}
                          onChange={(e) => setEditPrize({ ...editPrize, title: e.target.value })}
                        />
                        <input
                          style={inputStyle}
                          type="text"
                          value={editPrize.description || ""}
                          onChange={(e) => setEditPrize({ ...editPrize, description: e.target.value })}
                        />
                        <div>
                          <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleEditPrizeImage}
                            style={{ ...inputStyle, padding: "8px" }}
                          />
                          {editPrize.image && (
                            <div style={{ marginTop: "8px" }}>
                              <img
                                src={editPrize.image}
                                alt="معاينة الجائزة"
                                style={{ maxWidth: "100px", maxHeight: "100px", borderRadius: "8px" }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={handleSavePrize}
                          className="btn-gold"
                          style={{ padding: "8px 20px", borderRadius: "8px", fontSize: "13px", fontFamily: "Cairo, Inter, sans-serif" }}
                        >
                          حفظ
                        </button>
                        <button
                          onClick={() => setEditPrize(null)}
                          style={{
                            padding: "8px 20px",
                            background: "rgba(124,58,237,0.2)",
                            color: "#c4b5fd",
                            border: "1px solid rgba(124,58,237,0.3)",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontFamily: "Cairo, Inter, sans-serif",
                            fontSize: "13px",
                          }}
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.title}
                            style={{ width: "56px", height: "56px", borderRadius: "12px", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "12px",
                              background: p.tier === 1
                                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                                : p.tier === 2
                                ? "linear-gradient(135deg, #9ca3af, #6b7280)"
                                : "linear-gradient(135deg, #d97706, #92400e)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "26px",
                            }}
                          >
                            {p.tier === 1 ? "🥇" : p.tier === 2 ? "🥈" : "🥉"}
                          </div>
                        )}
                        <div>
                          <p style={{ color: "#fbbf24", fontWeight: "800", fontSize: "16px" }}>
                            المركز {p.tier === 1 ? "الأول" : p.tier === 2 ? "الثاني" : "الثالث"}
                          </p>
                          <p style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>{p.title}</p>
                          <p style={{ color: "#9ca3af", fontSize: "13px" }}>{p.description}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => setEditPrize(p)}
                          style={{
                            padding: "8px 16px",
                            background: "rgba(59,130,246,0.2)",
                            color: "#93c5fd",
                            border: "1px solid rgba(59,130,246,0.3)",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontFamily: "Cairo, Inter, sans-serif",
                            fontSize: "13px",
                          }}
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          onClick={() => handleDeletePrize(p.id)}
                          style={{
                            padding: "8px 16px",
                            background: "rgba(239,68,68,0.2)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontFamily: "Cairo, Inter, sans-serif",
                            fontSize: "13px",
                          }}
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "payment-methods" && (
          <PaymentMethodsTab showToast={showToast} />
        )}

        {activeTab === "draw-schedule" && (
          <DrawScheduleTab showToast={showToast} />
        )}

        {activeTab === "announce" && (
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#f59e0b", marginBottom: "28px" }}>
              📢 إرسال إعلان جماعي
            </h1>
            <div style={cardStyle}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: "#c4b5fd", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                  عنوان الإشعار
                </label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="مثال: موعد السحب القادم"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: "#c4b5fd", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                  نص الإشعار
                </label>
                <textarea
                  style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
                  placeholder="أدخل نص الإشعار هنا..."
                  value={announceMessage}
                  onChange={(e) => setAnnounceMessage(e.target.value)}
                />
              </div>
              <button
                onClick={sendAnnouncement}
                disabled={sending}
                className="btn-gold"
                style={{
                  padding: "12px 32px",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontFamily: "Cairo, Inter, sans-serif",
                  opacity: sending ? 0.7 : 1,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "جارٍ الإرسال..." : "📨 إرسال إعلان للجميع"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#f59e0b", marginBottom: "28px" }}>
              ⚙️ إعدادات المنصة
            </h1>

            <div style={{ ...cardStyle, marginBottom: "24px" }}>
              <h3 style={{ color: "#c4b5fd", fontWeight: "700", marginBottom: "20px", fontSize: "16px" }}>
                🌐 إعدادات عامة
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>اسم الموقع</label>
                  <input
                    style={inputStyle}
                    type="text"
                    value={siteSettings.site_name || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, site_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>العملة</label>
                  <input
                    style={inputStyle}
                    type="text"
                    value={siteSettings.currency || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, currency: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>سعر البطاقة</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={siteSettings.ticket_price || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, ticket_price: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>الحد الأقصى للبطاقات</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={siteSettings.max_tickets || ""}
                    onChange={(e) => setSiteSettings({ ...siteSettings, max_tickets: e.target.value })}
                  />
                </div>
              </div>
              <button
                onClick={handleSaveSettings}
                className="btn-gold"
                style={{ marginTop: "20px", padding: "12px 32px", borderRadius: "10px", fontSize: "15px", fontFamily: "Cairo, Inter, sans-serif" }}
              >
                💾 حفظ الإعدادات
              </button>
            </div>

            <div
              style={{
                border: "2px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "16px",
                padding: "24px",
                background: "rgba(239, 68, 68, 0.05)",
              }}
            >
              <h3
                style={{
                  color: "#f87171",
                  fontWeight: "800",
                  fontSize: "18px",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                ⚠️ منطقة خطرة
              </h3>
              <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "20px" }}>
                هذه الإجراءات لا يمكن التراجع عنها. تأكد قبل المتابعة.
              </p>

              {!resetConfirm ? (
                <button
                  onClick={() => setResetConfirm(true)}
                  style={{
                    padding: "12px 28px",
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                    border: "1px solid rgba(239, 68, 68, 0.5)",
                    borderRadius: "10px",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontFamily: "Cairo, Inter, sans-serif",
                    fontSize: "15px",
                  }}
                >
                  🔄 إعادة تهيئة البطاقات
                </button>
              ) : (
                <div>
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      borderRadius: "10px",
                      padding: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <p style={{ color: "#fca5a5", fontWeight: "700", marginBottom: "8px" }}>
                      ⚠️ تحذير! سيتم حذف جميع بيانات الحجوزات وإعادة تهيئة {siteSettings.max_tickets || "5000"} بطاقة. {/* ✅ 5000 */}
                    </p>
                    <p style={{ color: "#9ca3af", fontSize: "13px" }}>هل أنت متأكد من هذا الإجراء؟</p>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={handleReset}
                      style={{
                        padding: "12px 28px",
                        background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontFamily: "Cairo, Inter, sans-serif",
                        fontSize: "15px",
                      }}
                    >
                      ⚠️ نعم، إعادة التهيئة
                    </button>
                    <button
                      onClick={() => setResetConfirm(false)}
                      style={{
                        padding: "12px 28px",
                        background: "rgba(124, 58, 237, 0.2)",
                        color: "#c4b5fd",
                        border: "1px solid rgba(124, 58, 237, 0.3)",
                        borderRadius: "10px",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontFamily: "Cairo, Inter, sans-serif",
                        fontSize: "15px",
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== لوحة عرض الأرقام (النطاق الـ 50) ===== */}
      {showRangeModal && winningTicket && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div
            style={{
              background: "linear-gradient(135deg, #1a0f35, #0f0a1c)",
              border: "2px solid #f59e0b",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "700px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ color: "#fbbf24", textAlign: "center", fontSize: "22px", marginBottom: "16px" }}>
              🎯 النطاق الفائز: {rangeNumbers[0]} - {rangeNumbers[rangeNumbers.length - 1]}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "6px" }}>
              {rangeNumbers.map((num) => (
                <div
                  key={num}
                  style={{
                    padding: "6px 2px",
                    background:
                      num === winningTicket.number
                        ? "linear-gradient(135deg, #f59e0b, #d97706)"
                        : "rgba(124,58,237,0.3)",
                    borderRadius: "6px",
                    textAlign: "center",
                    color: num === winningTicket.number ? "#1a0a3c" : "#c4b5fd",
                    fontWeight: num === winningTicket.number ? "900" : "400",
                    fontSize: "13px",
                    border:
                      num === winningTicket.number
                        ? "2px solid #fbbf24"
                        : "1px solid rgba(124,58,237,0.2)",
                    boxShadow:
                      num === winningTicket.number
                        ? "0 0 20px rgba(245,158,11,0.6)"
                        : "none",
                  }}
                >
                  {num}
                </div>
              ))}
            </div>
            <p style={{ color: "#9ca3af", textAlign: "center", marginTop: "16px", fontSize: "14px" }}>
              🎉 الرقم الفائز:{" "}
              <span style={{ color: "#fbbf24", fontWeight: "900", fontSize: "28px" }}>
                {winningTicket.number}
              </span>
            </p>
            <p style={{ color: "#6b7280", textAlign: "center", fontSize: "12px", marginTop: "8px" }}>
              سيتم إظهار الفائز خلال 3 ثوانٍ...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
