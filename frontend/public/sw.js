const CACHE_NAME = "ak-textiles-shell-v1"; // bump this string on every deploy that
// changes what should be cached, so the activate handler below evicts the old cache

const SHELL_ASSETS = ["/login", "/manifest.webmanifest", "/icon-192x192.png", "/icon-512x512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting(); // activate the new SW immediately instead of waiting
  // for all open tabs of the old one to close
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim(); // start controlling already-open tabs right away
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Never intercept navigations (typing a URL / following a link / the
  // PWA's own start_url launch). A service worker cannot fulfill a
  // navigation with a redirected response, so leave these to the browser.
  if (event.request.mode === "navigate") return;

  const url = new URL(event.request.url);

  // Ignore non-http(s) requests (browser extension requests can leak into
  // a page's SW scope) — caches.put() throws on those schemes.
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Vite's build output is content-hashed under /assets/ and therefore
  // immutable per deploy — serve from cache first, only hit the network
  // the first time a given hash is requested.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
            return response;
          })
      )
    );
    return;
  }

  // Everything else (API calls, other static assets) stays network-first so
  // data screens stay fresh, and only falls back to the cache when offline.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
