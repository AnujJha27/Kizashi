const CACHE = "kizashi-shell-v5";
const SHELL = ["/offline", "/journey", "/learn", "/practice", "/practice/kana", "/practice/diagnostic", "/immersion", "/review", "/mistakes", "/library", "/progress", "/profile", "/studio", "/icon.svg", "/journey-hero.png", "/site-atmosphere.png"];

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
