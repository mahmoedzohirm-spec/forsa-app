import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";
import { requestPushPermission } from "@/lib/firebase"; 

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ دالة تسجيل Push Token
  const registerPushToken = useCallback(async (userId: number) => {
    try {
      // ✅ نطلب الإذن ونسجل التوكن
      const token = await requestPushPermission();
      if (token) {
        const res = await fetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, token }),
        });
        if (res.ok) {
          console.log('✅ Push token registered successfully for user:', userId);
        } else {
          console.error('❌ Failed to register push token:', await res.text());
        }
      } else {
        console.warn('⚠️ No push token received (permission denied or error)');
      }
    } catch (error) {
      console.error('❌ Error registering push token:', error);
    }
  }, []);

  useEffect(() => {
    // محاولة قراءة من localStorage أولاً
    const saved = localStorage.getItem("forsaUser");
    if (saved) {
      try {
        const userData = JSON.parse(saved);
        setUser(userData);
        setLoading(false);
        // ✅ إذا كان المستخدم موجوداً وليس مسؤولاً، سجل التوكن
        if (userData?.id && !userData.is_admin) {
          registerPushToken(userData.id);
        }
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
        localStorage.setItem("forsaUser", JSON.stringify(userData));
        setLoading(false);
        // ✅ إذا كان المستخدم موجوداً وليس مسؤولاً، سجل التوكن
        if (userData?.id && !userData.is_admin) {
          registerPushToken(userData.id);
        }
        return;
      } catch {
        // Ignore
      }
    }

    setLoading(false);
  }, [registerPushToken]);

  const login = useCallback((u: User) => {
    setUser(u);
    localStorage.setItem("forsaUser", JSON.stringify(u));
    // حفظ في كوكي user للمزامنة مع جوجل
    document.cookie = `user=${encodeURIComponent(JSON.stringify(u))}; path=/; max-age=${60 * 60 * 24 * 7}`;
    
    // ✅ تسجيل Push Token بعد تسجيل الدخول (إذا كان مستخدم عادي)
    if (u?.id && !u.is_admin) {
      registerPushToken(u.id);
    }
  }, [registerPushToken]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("forsaUser");
    document.cookie = 'user=; Max-Age=0; path=/';
  }, []);

  return { user, setUser, login, logout, loading };
};
