"use client";

import { useEffect } from "react";
import { isAndroidTwa, isStandaloneApp } from "@/lib/app-environment";

const SW_URL = "/sw.js?v=32";
const CACHE_RESET_KEY = "yike-cache-reset-v32";

async function clearServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((reg) => reg.unregister()));
}

async function purgeOldShellCaches(): Promise<void> {
  if (!("caches" in window)) return;
  try {
    if (window.localStorage.getItem(CACHE_RESET_KEY) === "done") return;
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(
          (key) =>
            /^yike-(shell|listings)-v\d+$/.test(key) &&
            key !== "yike-shell-v32" &&
            key !== "yike-listings-v4"
        )
        .map((key) => caches.delete(key))
    );
    window.localStorage.setItem(CACHE_RESET_KEY, "done");
  } catch {
    /* best effort */
  }
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void purgeOldShellCaches();

    // Stale browser SW inside Android wrapper can break first load.
    if (isAndroidTwa()) {
      void clearServiceWorkers();
      return;
    }

    const hotReloadServiceWorker = !isStandaloneApp();
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hotReloadServiceWorker) return;
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register(SW_URL)
      .then((reg) => {
        if (!hotReloadServiceWorker) return;

        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => {});
  }, []);

  return null;
}
