const CACHE_NAME = "v1"; // Increment version when logic changes
const ASSETS = ["/", "/icon-512.png", "/styles.css"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) return;
  if (request.method !== "GET") return;

  // Determine if it's a page navigation/HTML request
  const isHTML = request.mode === "navigate" || (url.origin === location.origin && (url.pathname.endsWith(".html") || !url.pathname.includes(".")));

  if (isHTML) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// --- STRATEGIES ---

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    // Try network first
    const fresh = await fetch(request);
    // If successful, update cache and return
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    // If network fails (offline), return from cache
    const cached = await cache.match(request);
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((fresh) => {
      if (fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    })
    .catch(() => cached); // Return cached if fetch fails

  return cached || fetchPromise;
}

/* NOTIFICATIONS */
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "New Notification" };
  event.waitUntil(self.registration.showNotification(data.title, data.options));
});

self.addEventListener("notificationclick", (event) => {
  const url = event.notification.data?.url || "/";
  event.notification.close();
  event.waitUntil(clients.openWindow(url));
});
