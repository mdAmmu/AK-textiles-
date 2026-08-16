export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (import.meta.env.PROD) {
    navigator.serviceWorker.register("/sw.js");
    return;
  }

  // Dev-mode cleanup: if a production build was ever run locally
  // (`vite build && vite preview`), the browser has a service worker +
  // cache registered for localhost. If `vite dev` then serves a page,
  // that leftover worker can serve stale chunks and blank-screen every
  // reload. Unregister and clear caches, once per tab session.
  navigator.serviceWorker.getRegistrations().then((regs) => {
    if (!regs.length) return;
    Promise.all(regs.map((r) => r.unregister())).then(() => {
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      if (!sessionStorage.getItem("ak-sw-cleared")) {
        sessionStorage.setItem("ak-sw-cleared", "1");
        location.reload();
      }
    });
  });
}
