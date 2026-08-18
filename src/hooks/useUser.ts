import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("forsaUser");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        // Ignore
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((u: User) => {
    setUser(u);
    localStorage.setItem("forsaUser", JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("forsaUser");
    // حذف الكوكي
    document.cookie = 'token=; Max-Age=0; path=/';
  }, []);

  return { user, setUser, login, logout, loading };
};
