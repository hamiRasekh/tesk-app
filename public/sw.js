const CACHE_NAME = "aveno-v5";
const APP_SHELL = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icon.png",
  "/logo.png",
  "/home.png",
  "/project.png",
  "/calender.png",
  "/profile.png"
];

const DASHBOARD_FALLBACKS = [
  "/dashboard",
  "/dashboard/projects",
  "/dashboard/calendar",
  "/dashboard/profile",
  "/login"
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

function isDocumentRequest(request) {
  return request.mode === "navigate" || request.destination === "document";
}

function isNextAsset(url) {
  return url.pathname.startsWith("/_next/");
}

async function offlineHtmlResponse() {
  const cached = await caches.match("/offline.html");
  if (cached) return cached;
  return new Response(
    "<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Aveno</title></head><body style='margin:0;min-height:100vh;display:grid;place-items:center;background:#0d0b14;color:#cfbdff;font-family:system-ui,sans-serif;text-align:center;padding:24px'><div><h1>اینترنت قطع است</h1><p style=color:#cbc3d9>داده‌های ذخیره‌شده روی دستگاه در دسترس هستند.</p><a href=/dashboard style=color:#cfbdff>ادامه</a></div></body></html>",
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

async function documentFallback(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const path = new URL(request.url).pathname;
  if (path.startsWith("/dashboard")) {
    for (const route of DASHBOARD_FALLBACKS) {
      const hit = await caches.match(route);
      if (hit) return hit;
    }
  }

  for (const route of DASHBOARD_FALLBACKS) {
    const hit = await caches.match(route);
    if (hit) return hit;
  }

  return offlineHtmlResponse();
}

async function networkFirstDocument(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  } catch {
    return documentFallback(request);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || network || (isNextAsset(new URL(request.url)) ? caches.match(request) : null);
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

  if (isDocumentRequest(event.request)) {
    event.respondWith(networkFirstDocument(event.request));
    return;
  }

  if (isNextAsset(url)) {
    event.respondWith(
      (async () => {
        const result = await staleWhileRevalidate(event.request);
        if (result) return result;
        try {
          return await fetch(event.request);
        } catch {
          return caches.match(event.request).then((r) => r || offlineHtmlResponse());
        }
      })()
    );
    return;
  }

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
        return cached || offlineHtmlResponse();
      })
  );
});
