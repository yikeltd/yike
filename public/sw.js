const SHELL_CACHE = "yike-shell-v34";
const IMAGE_CACHE = "yike-images-v7";
const LISTING_CACHE = "yike-listings-v6";
const CACHE_PREFIX = "yike-";

const SHELL = [
  "/offline",
  "/images/logo.webp",
  "/manifest.json",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icons/android-chrome-192.png",
];

const ACTIVE_CACHES = new Set([SHELL_CACHE, IMAGE_CACHE, LISTING_CACHE]);
const IMAGE_HOSTS = ["images.unsplash.com", "supabase.co"];

/** Document paths safe to keep for offline revisit (HTML shell). */
const WARM_DOCUMENT_PATHS = new Set([
  "/",
  "/offline",
  "/buy",
  "/rent",
  "/land",
  "/vehicles",
  "/search",
  "/saved",
  "/safety",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await Promise.allSettled(SHELL.map((url) => cache.add(url)));
      await self.skipWaiting();
    })
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

function shouldWarmDocument(pathname) {
  if (WARM_DOCUMENT_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/properties/")) return true;
  if (pathname.startsWith("/vehicles/")) return true;
  if (pathname.startsWith("/agents/")) return true;
  return false;
}

/** Prefer exact match, then same pathname (ignore search), then homepage. */
async function matchCachedDocument(request) {
  const url = new URL(request.url);
  const cachesToSearch = [LISTING_CACHE, SHELL_CACHE];

  for (const name of cachesToSearch) {
    const cache = await caches.open(name);
    const exact = await cache.match(request);
    if (exact) return exact;

    const byPath = await cache.match(url.pathname);
    if (byPath) return byPath;

    if (url.pathname === "/" || url.pathname === "") {
      const home = await cache.match("/");
      if (home) return home;
    }
  }

  // Last-chance: any matching entry across all caches
  const anyExact = await caches.match(request);
  if (anyExact) return anyExact;
  const anyPath = await caches.match(url.pathname);
  if (anyPath) return anyPath;
  if (url.pathname === "/" || url.pathname === "") {
    return (await caches.match("/")) || null;
  }
  return null;
}

async function cacheDocumentResponse(request, response) {
  if (!response || !response.ok) return;
  const url = new URL(request.url);
  if (!shouldWarmDocument(url.pathname)) return;

  try {
    const cache = await caches.open(LISTING_CACHE);
    await cache.put(request, response.clone());
    // Stable key without query — homepage warm cache for offline reopen
    if (url.search) {
      await cache.put(url.pathname, response.clone());
    } else if (url.pathname === "/") {
      await cache.put("/", response.clone());
    }
  } catch {
    /* quota / opaque — ignore */
  }
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
        if (res.ok) {
          await cache.put(data.url, res.clone());
          try {
            const u = new URL(data.url, self.location.origin);
            if (u.origin === self.location.origin) {
              await cache.put(u.pathname, res.clone());
            }
          } catch {
            /* ignore */
          }
        }
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

  // Next build assets are content-hashed — never serve a stale match.
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Document navigations: network-first, warm-cache fallback, /offline last
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(event.request, { cache: "no-store" });
          await cacheDocumentResponse(event.request, res);
          return res;
        } catch {
          const cached = await matchCachedDocument(event.request);
          if (cached) return cached;

          return (
            (await caches.match("/offline")) ||
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })()
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
