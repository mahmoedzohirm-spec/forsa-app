import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // محاولة قراءة من localStorage أولاً
    const saved = localStorage.getItem("forsaUser");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
        setLoading(false);
        return;
      } catch {
        // Ignore
      }
    }

    // إذا لم يكن في localStorage، حاول قراءة من كوكي user (لتسجيل الدخول بجوجل)
    const cookieUser = document.cookie
      .split('; ')
      .find(row => row.startsWith('user='))
      ?.split('=')[1];
    if (cookieUser) {
      try {
        const decoded = decodeURIComponent(cookieUser);
        const userData = JSON.parse(decoded);
        setUser(userData);
        localStorage.setItem("forsaUser", JSON.stringify(userData)); // حفظه في localStorage لاحقاً
        setLoading(false);
        return;
      } catch {
        // Ignore
      }
    }

    setLoading(false);
  }, []);

  const login = useCallback((u: User) => {
    setUser(u);
    localStorage.setItem("forsaUser", JSON.stringify(u));
    // أيضاً حفظ في كوكي user للمزامنة مع جوجل
    document.cookie = `user=${encodeURIComponent(JSON.stringify(u))}; path=/; max-age=${60 * 60 * 24 * 7}`;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("forsaUser");
    document.cookie = 'user=; Max-Age=0; path=/';
  }, []);

  return { user, setUser, login, logout, loading };
};
