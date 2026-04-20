import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";

// Remove precache entries from old service worker versions
cleanupOutdatedCaches();

// Precache all build assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Take control of all open clients immediately on activation
clientsClaim();

// When prompted via SKIP_WAITING message, activate the new SW right away
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// NetworkFirst for page navigations (5 s timeout, then serve from cache)
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "pages",
      networkTimeoutSeconds: 5,
    })
  )
);

// StaleWhileRevalidate for all other same-origin GET requests (JS, CSS, images…)
registerRoute(
  ({ url }) => url.origin === self.location.origin,
  new StaleWhileRevalidate({ cacheName: "assets" })
);

/* ── PUSH NOTIFICATIONS ─────────────────────────────────────────────────── */

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "New Notification" };
  event.waitUntil(self.registration.showNotification(data.title, data.options));
});

self.addEventListener("notificationclick", (event) => {
  const url = event.notification.data?.url || "/";
  event.notification.close();
  event.waitUntil(clients.openWindow(url));
});
