/** Ask the service worker to cache a page for offline revisit. */
export function cachePageForOffline(path: string) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const url = path.startsWith("http")
    ? path
    : `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;

  const post = (sw: ServiceWorker) => {
    sw.postMessage({ type: "CACHE_URL", url });
  };

  if (navigator.serviceWorker.controller) {
    post(navigator.serviceWorker.controller);
    return;
  }

  navigator.serviceWorker.ready.then((reg) => {
    if (reg.active) post(reg.active);
  });
}
