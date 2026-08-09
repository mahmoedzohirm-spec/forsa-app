"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@/hooks/useUser";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

export default function NotificationBell() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // دالة جلب الإشعارات (بدون useCallback عشان التبعيات)
  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          console.warn("Unauthorized, user might not be logged in");
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // تحديد إشعار كمقروء
  const markAsRead = async (id: number) => {
    if (!user) return;
    try {
      await fetch(`/api/notifications/${id}/read?userId=${user.id}`, {
        method: "PUT",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // تحديد الكل كمقروء
  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await fetch(`/api/notifications/mark-all-read?userId=${user.id}`, {
        method: "PUT",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // تحميل الإشعارات عند تغيير المستخدم
  useEffect(() => {
    if (user) {
      fetchNotifications();
      intervalRef.current = setInterval(fetchNotifications, 30000);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "50%",
          transition: "background 0.2s",
          color: unreadCount > 0 ? "#fbbf24" : "#9ca3af",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ width: "24px", height: "24px" }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#ef4444",
              color: "#fff",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              fontSize: "11px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "380px",
            maxHeight: "450px",
            background: "rgba(15, 10, 28, 0.98)",
            border: "1px solid rgba(124, 58, 237, 0.3)",
            borderRadius: "12px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
            overflow: "hidden",
            zIndex: 999,
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: "1px solid rgba(124, 58, 237, 0.2)",
            }}
          >
            <span style={{ color: "#fff", fontWeight: "700", fontSize: "16px" }}>
              🔔 الإشعارات
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fbbf24",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", maxHeight: "380px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
                <p style={{ marginTop: "8px" }}>جارٍ التحميل...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}>
                <span style={{ fontSize: "48px" }}>🔕</span>
                <p style={{ marginTop: "12px" }}>لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(124, 58, 237, 0.08)",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    background: n.is_read ? "transparent" : "rgba(245, 158, 11, 0.05)",
                    borderRight: n.is_read ? "3px solid transparent" : "3px solid #f59e0b",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = n.is_read ? "transparent" : "rgba(245, 158, 11, 0.05)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>
                      {n.type === "approval" && "✅"}
                      {n.type === "rejection" && "❌"}
                      {n.type === "winner" && "🎉"}
                      {n.type === "draw_announcement" && "📢"}
                      {n.type === "status_change" && "🔄"}
                      {!["approval", "rejection", "winner", "draw_announcement", "status_change"].includes(n.type) && "📌"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "#fff", fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
                        {n.title}
                      </p>
                      <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: 1.5 }}>{n.message}</p>
                      <p style={{ color: "#6b7280", fontSize: "11px", marginTop: "4px" }}>
                        {new Date(n.created_at).toLocaleString("ar-SA")}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#f59e0b",
                          flexShrink: 0,
                          marginTop: "6px",
                        }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}