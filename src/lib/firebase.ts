import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import type { MessagePayload } from "firebase/messaging";

// إعدادات Firebase من .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// تهيئة Firebase (تجنب التهيئة المتكررة)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

/**
 * طلب إذن الإشعارات والحصول على Token
 */
export const requestPushPermission = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn("Messaging is not available (server-side)");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push permission denied.");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY!,
    });

    console.log("✅ Push token:", token);
    return token;
  } catch (error) {
    console.error("❌ Error getting push token:", error);
    return null;
  }
};

/**
 * الاستماع للإشعارات الواردة عندما يكون التطبيق مفتوحاً
 */
export const onPushMessage = (callback: (payload: MessagePayload) => void) => {
  if (!messaging) return;
  onMessage(messaging, (payload: MessagePayload) => {
    console.log("📨 Message received (foreground):", payload);
    callback(payload);
  });
};

export { messaging };