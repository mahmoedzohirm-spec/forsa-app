import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ جلب المستخدم من الـ API (جديد) – يُستخدم لجلب المستخدم من التوكن
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          // نقوم بتحديث localStorage للحفاظ على التوافق مع الكود القديم
          localStorage.setItem("forsaUser", JSON.stringify(data.user));
          setLoading(false);
          return;
        }
      }
      // إذا لم يكن هناك توكن أو فشل، نستخدم localStorage كاحتياطي
      const saved = localStorage.getItem("forsaUser");
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          // Ignore
        }
      }
    } catch {
      // في حالة خطأ في الـ API، نستخدم localStorage
      const saved = localStorage.getItem("forsaUser");
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          // Ignore
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ استخدام fetchUser عند تحميل الصفحة بدلاً من localStorage فقط
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ✅ تسجيل الدخول (يخزن في localStorage + يرسل طلب للـ API)
  const login = useCallback((u: User) => {
    setUser(u);
    localStorage.setItem("forsaUser", JSON.stringify(u));
  }, []);

  // ✅ تسجيل الخروج (يمسح localStorage + الكوكيز + يرسل طلب للـ API)
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("forsaUser");
    document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // مسح التوكن من الكوكي عبر API
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }, []);

  return { user, setUser, login, logout, fetchUser, loading };
};
