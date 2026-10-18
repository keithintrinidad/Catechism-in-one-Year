/* Catechism in a Year – service worker.
   Bump VERSION whenever any file changes so installed copies update. */
const VERSION = "ccc-year-v3.3";
const ASSETS = [
  "./",
  "index.html",
  "app.webmanifest",
  "data/plan.js",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "fonts/eb-garamond-greek-400-normal.woff2",
  "fonts/eb-garamond-greek-ext-400-normal.woff2",
  "fonts/eb-garamond-latin-400-italic.woff2",
  "fonts/eb-garamond-latin-400-normal.woff2",
  "fonts/eb-garamond-latin-500-italic.woff2",
  "fonts/eb-garamond-latin-500-normal.woff2",
  "fonts/eb-garamond-latin-600-normal.woff2",
  "fonts/eb-garamond-latin-ext-400-italic.woff2",
  "fonts/eb-garamond-latin-ext-400-normal.woff2",
  "fonts/eb-garamond-latin-ext-500-normal.woff2",
  "fonts/frank-ruhl-libre-hebrew-400-normal.woff2"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  // Pages: open instantly from the saved copy, and fetch a fresh copy in the
  // background for next time. On a slow or absent connection the app never
  // waits for the network. Updates appear the next time the app is opened.
  if (req.mode === "navigate") {
    const fresh = fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); return caches.open(VERSION).then(c => c.put("index.html", copy)).then(() => res); }
        return res;
      })
      .catch(() => null);
    e.waitUntil(fresh);
    e.respondWith(
      caches.match("index.html")
        .then(hit => hit || fresh.then(res => res || caches.match("./")))
        .then(res => res || Response.error())
    );
    return;
  }

  // Everything else: cache first.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
