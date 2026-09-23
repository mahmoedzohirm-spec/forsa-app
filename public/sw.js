// public/sw.js
// Service Worker: Caching أساسي + Push Notifications

const CACHE_NAME = "forsa-v1";
const PRECACHE_URLS = ["/", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png"];

// ============ Install ============
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
});

// ============ Activate ============
self.addEventListener("activate", (event) => {
  console.log("[SW] Activated");
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// ============ Fetch (Network first with cache fallback) ============
self.addEventListener("fetch", (event) => {
  // ما نتدخل في طلبات API
  if (event.request.url.includes("/api/")) return;
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ============ Push Notifications ============
self.addEventListener("push", (event) => {
  console.log("[SW] Push received");

  if (!event.data) {
    console.warn("[SW] No data in push event");
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "فرصة العمر", body: event.data.text() };
  }

  const title = data.title || "فرصة العمر";
  const options = {
    body: data.body || "لديك إشعار جديد",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
    tag: data.tag || "forsa-notification",
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ============ Notification Click ============
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
