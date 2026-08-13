import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ✅ تسجيل الدخول (إرسال email و password مباشرة)
  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), // ✅ التعديل هنا
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.removeItem("forsaUser");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // ✅ تسجيل الخروج
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      localStorage.removeItem("forsaUser");
      document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } catch {
      // Ignore
    }
  }, []);

  return { user, setUser, login, logout, loading };
};
