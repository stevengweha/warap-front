const CACHE_NAME = "warap-cache-v1";
const urlsToCache = ["/", "/favicon.png", "/index.html"];

self.addEventListener("install", event => {
  self.skipWaiting(); // active immédiatement
});

self.addEventListener("activate", event => {
  clients.claim(); // prend le contrôle de la page
});

self.addEventListener("fetch", () => {
  // Ne rien faire ici → laisse le cache HTTP faire le boulot
});
