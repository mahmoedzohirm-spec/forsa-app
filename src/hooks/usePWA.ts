"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { requestPushPermission } from "@/lib/firebase";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// مفاتيح التخزين المحلي
const INSTALL_DISMISSED_KEY = "forsa_install_dismissed";
const NOTIF_DISMISSED_KEY = "forsa_notif_dismissed";
const NOTIF_GRANTED_KEY = "forsa_notif_granted";

export function usePWA() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // ========== 1. مراقبة حالة التثبيت + حدث التثبيت ==========
  useEffect(() => {
    if (typeof window === "undefined") return;

    // هل التطبيق مثبّت أصلاً؟ (standalone mode)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
      console.log("✅ beforeinstallprompt جاهز");
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
      console.log("✅ تم تثبيت التطبيق");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // ========== 2. تفعيل نافذة التثبيت ==========
  const promptInstall = useCallback(async (): Promise<boolean> => {
    const prompt = deferredPromptRef.current;
    if (!prompt) {
      console.warn("⚠️ ما في حدث تثبيت متاح (قد يكون التطبيق مثبّت أو المتصفح لا يدعم)");
      return false;
    }
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      console.log("📲 نتيجة التثبيت:", outcome);
      deferredPromptRef.current = null;
      setCanInstall(false);
      return outcome === "accepted";
    } catch (err) {
      console.error("خطأ في التثبيت:", err);
      return false;
    }
  }, []);

  // ========== 3. طلب الإذن + حفظ التوكن ==========
  const requestNotifications = useCallback(
    async (userId: number): Promise<boolean> => {
      try {
        const token = await requestPushPermission();
        if (!token) return false;

        const res = await fetch("/api/push/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, token }),
        });

        if (res.ok) {
          console.log("✅ تم حفظ التوكن في القاعدة");
          return true;
        }
        return false;
      } catch (error) {
        console.error("❌ فشل طلب الإشعارات:", error);
        return false;
      }
    },
    []
  );

  // ========== 4. بدء السيناريو بعد تسجيل الدخول ==========
  const startFlow = useCallback(
    (userId: number) => {
      if (typeof window === "undefined") return;

      // إذا الإشعارات مفعّلة مسبقاً → سجّل التوكن بشكل صامت وما تطلع نوافذ
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        requestNotifications(userId);
        return;
      }

      const installDismissed =
        localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
      const notifDismissed = localStorage.getItem(NOTIF_DISMISSED_KEY) === "1";

      const alreadyInstalled =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      // الخطوة 1: نافذة التثبيت (إذا ما كان مثبّت وما تم تجاهله سابقاً)
      if (!alreadyInstalled && !installDismissed) {
        setShowInstallModal(true);
        return;
      }

      // الخطوة 2: نافذة الإشعارات
      if (!notifDismissed) {
        setShowNotifModal(true);
      }
    },
    [requestNotifications]
  );

  // ========== 5. أفعال نافذة التثبيت ==========
  const acceptInstall = useCallback(async () => {
    const accepted = await promptInstall();
    setShowInstallModal(false);
    if (accepted) {
      localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    }
    // بعد ما يخلص → ننتقل لنافذة الإشعارات
    if (localStorage.getItem(NOTIF_DISMISSED_KEY) !== "1") {
      setTimeout(() => setShowNotifModal(true), 400);
    }
  }, [promptInstall]);

  const dismissInstall = useCallback(() => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    setShowInstallModal(false);
    // ننتقل لنافذة الإشعارات
    if (localStorage.getItem(NOTIF_DISMISSED_KEY) !== "1") {
      setTimeout(() => setShowNotifModal(true), 400);
    }
  }, []);

  // ========== 6. أفعال نافذة الإشعارات ==========
  const acceptNotifications = useCallback(
    async (userId: number) => {
      const ok = await requestNotifications(userId);
      setShowNotifModal(false);
      if (ok) {
        localStorage.setItem(NOTIF_GRANTED_KEY, "1");
      } else {
        localStorage.setItem(NOTIF_DISMISSED_KEY, "1");
      }
      return ok;
    },
    [requestNotifications]
  );

  const dismissNotifications = useCallback(() => {
    localStorage.setItem(NOTIF_DISMISSED_KEY, "1");
    setShowNotifModal(false);
  }, []);

  return {
    // حالة
    isInstalled,
    canInstall,
    showInstallModal,
    showNotifModal,
    // دوال
    startFlow,
    promptInstall,
    acceptInstall,
    dismissInstall,
    acceptNotifications,
    dismissNotifications,
  };
}
