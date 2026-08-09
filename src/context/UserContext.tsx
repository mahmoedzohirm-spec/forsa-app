"use client";
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { User } from "@/types";

const UserContext = createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
} | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("forsaUser");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch { /* noop */ }
    }
  }, []);

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem("forsaUser", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("forsaUser");
    document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};