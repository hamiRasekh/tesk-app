const CACHE_NAME = "aveno-v2";
const APP_SHELL = [
  "/manifest.webmanifest",
  "/icon.png",
  "/logo.png",
  "/home.png",
  "/project.png",
  "/calender.png",
  "/profile.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api-proxy") || url.pathname.startsWith("/auth");
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data?.type) return;

  if (data.type === "FOCUS_CLEAR") {
    self.registration.getNotifications().then((list) => {
      list.forEach((n) => {
        if (n.tag?.startsWith("aveno-focus")) n.close();
      });
    });
    return;
  }

  if (data.type === "FOCUS_ACTIVE" || data.type === "FOCUS_ESTIMATE") {
    self.registration
      .showNotification(data.title, {
        body: data.body,
        icon: "/icon.png",
        badge: "/icon.png",
        tag: data.tag,
        requireInteraction: data.type === "FOCUS_ESTIMATE",
        data: { url: "/dashboard" }
      })
      .catch(() => {});
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isApiRequest(url)) {
    event.respondWith(
      fetch(event.request).catch(() =>
        Response.json({ detail: "offline" }, { status: 503, headers: { "Content-Type": "application/json" } })
      )
    );
    return;
  }

  const isDocument = event.request.mode === "navigate" || event.request.destination === "document";

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (isDocument) {
          const fallback = await caches.match("/login");
          if (fallback) return fallback;
        }
        return Response.error();
      })
  );
});
