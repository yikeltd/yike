const SHELL_CACHE = "yike-shell-v21";
const IMAGE_CACHE = "yike-images-v4";
const LISTING_CACHE = "yike-listings-v2";
const CACHE_PREFIX = "yike-";

const SHELL = [
  "/",
  "/offline",
  "/browse",
  "/saved",
  "/search",
  "/images/logo-sm.webp",
  "/manifest.json",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icons/android-chrome-192.png",
];

const ACTIVE_CACHES = new Set([SHELL_CACHE, IMAGE_CACHE, LISTING_CACHE]);
const IMAGE_HOSTS = ["images.unsplash.com", "supabase.co"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k.startsWith(CACHE_PREFIX) &&
                !ACTIVE_CACHES.has(k)
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isListingImage(url) {
  return IMAGE_HOSTS.some((host) => url.hostname.includes(host));
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type !== "CACHE_URL" || !data.url) return;

  event.waitUntil(
    caches.open(LISTING_CACHE).then(async (cache) => {
      try {
        const res = await fetch(data.url);
        if (res.ok) await cache.put(data.url, res);
      } catch {
        /* offline — ignore */
      }
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (isListingImage(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const network = fetch(event.request)
          .then((res) => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    const dynamicPaths = ["/search", "/browse", "/agent", "/properties/"];
    const preferNetwork = dynamicPaths.some((p) => url.pathname.startsWith(p));
    event.respondWith(
      fetch(event.request, preferNetwork ? { cache: "no-store" } : undefined)
        .then((res) => {
          if (res.ok && !preferNetwork) {
            const clone = res.clone();
            const cacheName = url.pathname.startsWith("/properties/")
              ? LISTING_CACHE
              : SHELL_CACHE;
            caches.open(cacheName).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(async () => {
          const listing = await caches.match(event.request, {
            cacheName: LISTING_CACHE,
          });
          if (listing) return listing;
          const shell = await caches.match(event.request, {
            cacheName: SHELL_CACHE,
          });
          if (shell) return shell;
          return caches.match("/offline");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((res) => {
          if (res.ok && url.pathname.startsWith("/images")) {
            const clone = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
