import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("forsaUser");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        // Ignore
      }
    }
  }, []);

  const login = useCallback((u: User) => {
    setUser(u);
    localStorage.setItem("forsaUser", JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("forsaUser");
    document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }, []);

  return { user, setUser, login, logout };
};
