const CACHE_NAME = "v1";
const ASSETS = ["/", "/icon-512.png"];

// ✅ Install and pre-cache known assets
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_NAME)));
  self.skipWaiting();
});

// ✅ Activate immediately on update
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// ✅ Fetch handler
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(staleWhileRevalidate(e.request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((fresh) => {
    cache.put(request, fresh.clone());
    reloadOnUpdate(request, cached, fresh);
    return fresh;
  });

  return cached || fetchPromise;
}

async function reloadOnUpdate(request, cached, fresh) {
  const url = new URL(request.url);
  const isHTML = url.origin === location.origin && (url.pathname === "/" || !url.pathname.includes(".") || url.pathname.endsWith(".html"));

  if (fresh.ok && isHTML && cached) {
    const newText = await fresh.clone().text();
    const oldText = await cached.clone().text();

    if (newText !== oldText) {
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clientsList) client.navigate(client.url);
    }
  }
}

/* NOTIFICATIONS */
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(self.registration.showNotification(data.title, data.options));
});

self.addEventListener("notificationclick", (event) => {
  const url = event.notification.data?.url || "/";
  event.notification.close();
  event.waitUntil(clients.openWindow(url));
});
