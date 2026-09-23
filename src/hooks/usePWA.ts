"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// مفاتيح التخزين المحلي
const INSTALL_DISMISSED_KEY = "forsa_install_dismissed";
const NOTIF_DISMISSED_KEY = "forsa_notif_dismissed";
const NOTIF_GRANTED_KEY = "forsa_notif_granted";

// تحويل VAPID Public Key من Base64 إلى Uint8Array (مطلوب لـ Web Push)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePWA() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // ========== 1. تسجيل Service Worker + مراقبة التثبيت ==========
  useEffect(() => {
    if (typeof window === "undefined") return;

    // سجل الـ SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => console.log("✅ SW registered:", reg.scope))
        .catch((err) => console.error("❌ SW registration failed:", err));
    }

    // هل التطبيق مثبّت؟
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
      console.warn("⚠️ ما في حدث تثبيت متاح");
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

  // ========== 3. طلب الإذن + حفظ الاشتراك (Web Push + VAPID) ==========
  const requestNotifications = useCallback(
    async (userId: number): Promise<boolean> => {
      try {
        // تحقق من دعم المتصفح
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          console.warn("⚠️ المتصفح ما يدعم Push");
          return false;
        }

        // اطلب الإذن
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("⚠️ المستخدم رفض الإشعارات");
          return false;
        }

        // انتظر SW يكون جاهز
        const registration = await navigator.serviceWorker.ready;

        // تحقق إذا في اشتراك موجود
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // أنشئ اشتراك جديد
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidKey) {
            console.error("❌ NEXT_PUBLIC_VAPID_PUBLIC_KEY غير موجود");
            return false;
          }

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
        }

        console.log("✅ Subscription endpoint:", subscription.endpoint);

        // أرسل للخادم
        const res = await fetch("/api/push/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, subscription }),
        });

        if (!res.ok) {
          console.error("❌ فشل حفظ الاشتراك");
          return false;
        }

        console.log("✅ تم حفظ الاشتراك في القاعدة");
        return true;
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

      // إذا الإشعارات مفعّلة مسبقاً → سجّل بهدوء بدون نوافذ
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

      // الخطوة 1: نافذة التثبيت
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
    // ننتقل لنافذة الإشعارات
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
    isInstalled,
    canInstall,
    showInstallModal,
    showNotifModal,
    startFlow,
    promptInstall,
    acceptInstall,
    dismissInstall,
    acceptNotifications,
    dismissNotifications,
  };
}
