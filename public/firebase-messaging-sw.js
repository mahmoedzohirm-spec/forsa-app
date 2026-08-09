// استيراد Firebase SDK لـ Service Worker
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// تهيئة Firebase باستخدام نفس الإعدادات
firebase.initializeApp({
  apiKey: "AIzaSyCcEKE4rkB-ofZoZOVUHDjkREOQuWzGu6w",
  authDomain: "forsa-push.firebaseapp.com",
  projectId: "forsa-push",
  storageBucket: "forsa-push.firebasestorage.app",
  messagingSenderId: "1074712679136",
  appId: "1:1074712679136:web:00649923cf4d9e8a5f7685",
});

const messaging = firebase.messaging();

// معالجة الإشعارات في الخلفية (عندما يكون التطبيق مغلقاً)
messaging.onBackgroundMessage((payload) => {
  console.log("Received background message: ", payload);

  const notificationTitle = payload.notification?.title || "إشعار جديد";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    data: payload.data || {},
    vibrate: [200, 100, 200],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// تخصيص النقر على الإشعار (فتح التطبيق)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow("/");
    })
  );
});