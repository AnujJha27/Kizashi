const CACHE = "kizashi-shell-v11";
const SHELL = ["/offline", "/journey", "/learn", "/practice", "/practice/kana", "/practice/diagnostic", "/immersion", "/review", "/mistakes", "/library", "/progress", "/profile", "/studio", "/icon.svg", "/world/neighborhood.webp", "/world/station.webp", "/world/shopping-street.webp", "/world/riverside.webp", "/world/garden.webp", "/world/market.webp", "/world/assessment.webp", "/world/wide-station.webp", "/world/today.webp", "/world/today-station.webp", "/world/today-shopping-street.webp", "/world/today-riverside.webp", "/world/today-garden.webp", "/world/today-market.webp", "/world/today-assessment.webp", "/world/today-wide-station.webp", "/world/lesson-wide.webp", "/learning-assets/listening/cafe-service.webp", "/learning-assets/listening/classroom.webp", "/learning-assets/listening/home-arrival.webp", "/learning-assets/listening/station-help.webp", "/learning-assets/reading/clinic-reception.webp", "/learning-assets/reading/local-bus-stop.webp", "/learning-assets/reading/local-museum.webp", "/learning-assets/reading/home-notice.webp", "/learning-assets/reading/neighborhood-post-office.webp", "/learning-assets/reading/cafe-counter.webp", "/learning-assets/reading/classroom-notice.webp", "/learning-assets/reading/station-schedule.webp"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => undefined)))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.destination === "audio") {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok || response.type === "opaque") {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => Response.error())));
    return;
  }
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/api/content/review-package" && url.searchParams.get("audience") === "learner") {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request).then((response) => response || Response.error())));
    return;
  }
  if (event.request.destination === "document") {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request).then((response) => response || caches.match("/offline"))));
    return;
  }
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/") || event.request.headers.has("RSC")) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then((response) => response || caches.match("/offline"))));
});
