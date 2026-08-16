# Converting a Next.js App into a PWA

## How this document is meant to be used

This is a step-by-step recipe extracted from how **this** app (a Next.js 15
App Router project) was turned into an installable Progressive Web App. It's
written so you can follow the same steps in any other Next.js app. If your
other application isn't Next.js, Section 8 explains which parts are
framework-specific and which are universal web-platform APIs.

A PWA needs exactly three things to be installable and to work offline-ish:

1. A **web app manifest** — tells the browser/OS the app's name, icons, and
   how it should look when launched (full screen vs. browser chrome).
2. A **service worker** — a background script that can intercept network
   requests and serve cached responses, which is what makes "Add to Home
   Screen" actually behave like an app instead of a bookmark.
3. **HTTPS** — service workers refuse to register over plain HTTP (localhost
   is exempted for development).

Everything else (install button, iOS instructions, icons) is UX polish on
top of those three things.

---

## 1. Generate the icons

You need at minimum:

| File | Size | Purpose |
|---|---|---|
| `icon-192x192.png` | 192×192 | Android home screen icon |
| `icon-512x512.png` | 512×512 | Splash screen / high-res icon |
| `icon-maskable-512x512.png` | 512×512 | Android adaptive icon — must have the logo inside a safe zone (roughly the center 80%), since Android crops this to a circle/squircle/whatever shape the OS theme uses |

Put them in `public/` (Next.js) or your framework's static assets folder.
A maskable icon that isn't padded correctly gets your logo clipped on
Android — check it with a tool like https://maskable.app/editor before
shipping.

In this repo: `frontend/public/icon-192x192.png`,
`frontend/public/icon-512x512.png`, `frontend/public/icon-maskable-512x512.png`.

---

## 2. Add the web app manifest

Next.js App Router has a built-in convention for this: create
`app/manifest.ts` and export a function returning a `MetadataRoute.Manifest`
object. Next.js automatically serves it at `/manifest.webmanifest` and links
it in the page `<head>` — no manual `<link rel="manifest">` needed.

```ts
// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Your App Name - Full Description",
    short_name: "YourApp",
    description: "One-line description",
    start_url: "/",
    display: "standalone",       // hides browser chrome (address bar, tabs)
    background_color: "#ffffff", // splash screen background while loading
    theme_color: "#0f172a",      // OS status bar / task switcher color
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
```

**If you're not on Next.js**, just write this as a static
`public/manifest.webmanifest` JSON file and link it manually:

```html
<link rel="manifest" href="/manifest.webmanifest" />
```

**`display: "standalone"`** is the key field — it's what makes the launched
app hide the browser's URL bar and look like a native app instead of a
browser tab. Other options are `fullscreen` (also hides the status bar —
usually too aggressive), `minimal-ui`, and `browser` (no PWA effect at all).

---

## 3. Add iOS meta tags (Apple doesn't read the manifest fully)

Safari on iOS ignores most of the web manifest and needs its own tags. In
Next.js, add these via the `metadata`/`viewport` exports in your root
layout:

```ts
// app/layout.tsx
export const metadata: Metadata = {
  title: "Your App Name",
  description: "...",
  appleWebApp: {
    capable: true,           // renders <meta name="apple-mobile-web-app-capable" content="yes">
    statusBarStyle: "default",
    title: "Your App Name",  // home screen label under the icon
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};
```

Outside of Next's metadata API, the raw HTML equivalent is:

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Your App Name" />
<link rel="apple-touch-icon" href="/icon-192x192.png" />
```

iOS has **no `beforeinstallprompt` event** and no programmatic install
API — the only way to install is the user manually tapping
Share → "Add to Home Screen" in Safari. Section 6 covers showing them
instructions for that.

---

## 4. Write the service worker

This is the part with real design decisions. Put a plain JS file at
`public/sw.js` (served at the site root so its scope covers the whole app —
service workers can only control paths at or below where they're served
from).

Strategy used in this app — **network-first with cache fallback**, plus a
**cache-first fast path for hashed build assets**:

```js
// public/sw.js
const CACHE_NAME = "app-shell-v1"; // bump this string on every deploy that
                                     // changes what should be cached, so the
                                     // activate handler below evicts the old cache

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
  // PWA's own start_url launch). If your app redirects "/" server-side
  // (e.g. to /login or /home based on auth state), a service worker
  // CANNOT return a redirected response to a navigation request — Chrome
  // throws a network error instead of rendering anything. Leaving
  // navigations alone avoids a blank-white-screen-on-reopen bug.
  if (event.request.mode === "navigate") return;

  const url = new URL(event.request.url);

  // Ignore non-http(s) requests (browser extension requests can leak into
  // a page's SW scope) — caches.put() throws on those schemes.
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Framework build assets are content-hashed (e.g. Next.js /_next/static/*)
  // and therefore immutable per deploy — serve from cache first, only hit
  // the network the first time a given hash is requested.
  if (url.pathname.startsWith("/_next/static/")) {
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

  // Everything else (API calls, pages) stays network-first so data screens
  // stay fresh, and only falls back to the cache when offline.
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
```

Adapt the two things that are app-specific:
- `SHELL_ASSETS` — whichever routes you want available offline immediately.
- The `/_next/static/` prefix — replace with your own bundler's hashed-asset
  path (Vite's `/assets/`, CRA's `/static/`, etc.), or drop that branch
  entirely if you don't need the optimization.

---

## 5. Register the service worker

Register it client-side, and **only in production**. Registering in dev
causes a much worse problem than it solves: your dev server's chunk hashes
change on almost every restart, and a stale cached chunk from a previous
session will make the app blank-screen on reload before your new code ever
runs.

```tsx
// lib/providers/service-worker-provider.tsx
"use client";
import { useEffect } from "react";

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return children;
}
```

Wrap the root layout with it:

```tsx
// app/layout.tsx
<body>
  <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
</body>
```

### Dev-mode cleanup script (important gotcha)

If anyone on the team ever ran a production build locally (`next build &&
next start`) even once, their browser now has a service worker + cache
registered for `localhost`. The next time they run `next dev`, that leftover
worker can serve stale 404-ing chunks and blank-screen every reload — and
by the time a React `useEffect` runs, it's too late, because the stale
worker already intercepted the page load.

Fix: unregister any service worker and clear caches with an **inline,
render-blocking `<script>` in `<head>`**, gated so it only runs when
`NODE_ENV !== "production"`:

```tsx
// app/layout.tsx, inside <head>
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){
  if (${JSON.stringify(process.env.NODE_ENV !== "production")} !== true) return;
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function(regs) {
    if (!regs.length) return;
    Promise.all(regs.map(function(r) { return r.unregister(); })).then(function() {
      if ('caches' in window) {
        caches.keys().then(function(keys) { keys.forEach(function(k) { caches.delete(k); }); });
      }
      if (!sessionStorage.getItem('dms-sw-cleared')) {
        sessionStorage.setItem('dms-sw-cleared', '1');
        location.reload();
      }
    });
  });
})();`,
  }}
/>
```

The `sessionStorage` guard prevents an infinite reload loop — it only forces
one reload per tab session.

Note: this script computes the dev/prod boolean at build time and inlines
it as a literal (`${JSON.stringify(...)}`), rather than branching the JSX
itself (`{isDev && <script>...}`). That's deliberate — the `<script>` tag
must render identically on the server and the client for hydration to
match; only the inlined `true`/`false` literal is allowed to differ per
environment.

---

## 6. Build the "Install this app" UI

The browser's native install prompt (`beforeinstallprompt`) is suppressible
and controllable — Chrome/Edge/Android fire it, but **iOS Safari never
fires it at all**. So you need two paths: a real install button for
Chromium browsers, and manual instructions for iOS.

**`useInstallPrompt` hook** — captures the deferred prompt event and exposes
a `promptInstall()` you can call from a button click (must be a direct user
gesture, not called from a `useEffect`):

```ts
// lib/hooks/useInstallPrompt.ts
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { MSStream?: unknown };
  return /iPad|iPhone|iPod/.test(nav.userAgent) && !nav.MSStream;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault(); // stop the browser's default mini-infobar
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return {
    installed,
    canInstall: !installed && deferredPrompt !== null,
    isIOS: !installed && isIOS(),
    promptInstall,
  };
}
```

**Banner component** — shows a dismissible top bar; on Chromium it triggers
the real prompt, on iOS it opens a modal with manual steps
(Share → Add to Home Screen → Add):

```tsx
// components/pwa/InstallAppBanner.tsx
"use client";
const DISMISSED_KEY = "app_install_dismissed";

export function InstallAppBanner() {
  const { canInstall, isIOS, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === "1");
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  if (dismissed || (!canInstall && !isIOS)) return null;

  return (
    <div className="banner">
      <p>Install the app</p>
      <button onClick={canInstall ? promptInstall : () => setShowIOSSteps(true)}>Install</button>
      <button onClick={() => { localStorage.setItem(DISMISSED_KEY, "1"); setDismissed(true); }}>×</button>
      {/* modal with iOS steps rendered when showIOSSteps is true */}
    </div>
  );
}
```

**Lazy-load it** — this banner renders `null` on most visits (already
installed, already dismissed, or unsupported platform), so don't ship its
code in the initial bundle:

```tsx
// components/pwa/InstallAppBannerLazy.tsx
"use client";
import dynamic from "next/dynamic";

export const InstallAppBannerLazy = dynamic(
  () => import("@/components/pwa/InstallAppBanner").then((m) => m.InstallAppBanner),
  { ssr: false }
);
```

Mount it once near the root, above your main content:

```tsx
<ServiceWorkerProvider>
  <InstallAppBannerLazy />
  {children}
</ServiceWorkerProvider>
```

---

## 7. Watch out for these traps

- **Redirects + navigation requests**: if your app does a server-side
  redirect from `/` (e.g. to `/login` or `/home` depending on auth), never
  let the service worker's `fetch` handler intercept `event.request.mode
  === "navigate"`. Chrome refuses to let a service worker fulfill a
  navigation with a `response.redirected` response — it throws a network
  error and you get a blank white screen on every relaunch after the first
  install. This bit us in exactly this app (see the comment in `sw.js`
  above) — leave navigations to the browser's normal handling and only
  intercept static assets/API calls.
- **HTTPS required in production.** `localhost` is exempted for dev, but
  any real deployment must be served over HTTPS or the service worker
  registration silently fails.
- **Cache versioning.** Bump `CACHE_NAME` (e.g. `v1` → `v2`) on any deploy
  where cached responses should be invalidated — the `activate` handler
  deletes any cache key that doesn't match the current name.
- **Install prompt requires a user gesture.** Calling
  `deferredPrompt.prompt()` from anywhere other than a click handler will
  be ignored by the browser.
- **Maskable icon safe zone.** If the logo touches the edges of the
  512×512 maskable icon, Android's circular/squircle mask will clip it.
- **Scope.** A service worker registered at `/sw.js` controls the entire
  origin. If you only want it to control a subpath, serve it from that
  subpath instead (you can't widen scope with a header for a worker served
  from a subdirectory).

---

## 8. Framework-agnostic checklist

If your other app isn't Next.js, the underlying steps are identical — only
the "how do I serve this file" mechanics change:

1. Icons in your static assets folder (192, 512, maskable 512).
2. A `manifest.webmanifest` (or `.json`) file, served statically, linked via
   `<link rel="manifest">` in `<head>`.
3. Apple meta tags in `<head>` for iOS support (Section 3).
4. A `sw.js` file at your site root, served statically.
5. Client-side JS that calls `navigator.serviceWorker.register("/sw.js")`
   after the page loads, gated to production only.
6. `beforeinstallprompt` handling + iOS manual-steps fallback for the
   install button (Section 6) — purely a UX nicety, the app is already
   installable via the browser's own menu without it.
7. Serve everything over HTTPS in production.

None of steps 2–5 depend on React, Next.js, or any specific framework —
they're plain Web Platform APIs (`Cache`, `ServiceWorkerRegistration`,
`fetch` event interception) that work the same in any stack (Vue, plain
HTML, Django templates, etc.).

---

## Reference: files in this repo

| File | Purpose |
|---|---|
| `frontend/app/manifest.ts` | Web app manifest (Next.js metadata route) |
| `frontend/public/sw.js` | Service worker |
| `frontend/public/icon-192x192.png`, `icon-512x512.png`, `icon-maskable-512x512.png` | Icons |
| `frontend/app/layout.tsx` | iOS meta tags, dev-mode SW cleanup script, provider mounting |
| `frontend/lib/providers/service-worker-provider.tsx` | Production-only SW registration |
| `frontend/lib/hooks/useInstallPrompt.ts` | `beforeinstallprompt` capture + iOS detection |
| `frontend/components/pwa/InstallAppBanner.tsx` | Install UI (Chromium button + iOS instructions modal) |
| `frontend/components/pwa/InstallAppBannerLazy.tsx` | Lazy-loaded wrapper for the banner |
