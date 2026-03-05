const CACHE_NAME = "financereels-v1";
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;

  // Skip non-GET and API requests
  if (request.method !== "GET" || request.url.includes("/api/")) return;

  e.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for same-origin
        if (response.ok && request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ||
            new Response(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FinanceReels - Offline</title></head><body style="background:#000;color:#fff;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center"><div><div style="font-size:48px;margin-bottom:16px">📡</div><h2>You\'re offline</h2><p style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:8px">FinanceReels requires a connection.<br/>Please check your network and try again.</p></div></body></html>',
              { headers: { "Content-Type": "text/html" } }
            )
        )
      )
  );
});
