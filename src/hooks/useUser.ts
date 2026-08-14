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
          setLoading(false);
          return;
        }
      }
      const saved = localStorage.getItem("forsaUser");
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          // Ignore
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback((u: User) => {
    setUser(u);
    localStorage.setItem("forsaUser", JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("forsaUser");
    document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }, []);

  return { user, setUser, login, logout, loading };
};
