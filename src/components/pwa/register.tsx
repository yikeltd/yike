"use client";

import { useEffect } from "react";
import { isStandaloneApp } from "@/lib/app-environment";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const hotReloadServiceWorker = !isStandaloneApp();
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hotReloadServiceWorker) return;
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js?v=18")
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
