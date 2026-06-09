"use client";

import { useEffect } from "react";
import { isAndroidTwa, isStandaloneApp } from "@/lib/app-environment";

const SW_URL = "/sw.js?v=26";

async function clearServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((reg) => reg.unregister()));
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // TWA runs in Chrome Custom Tabs — a stale browser SW can break first load.
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
