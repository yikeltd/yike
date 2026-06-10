"use client";

import { useEffect, useState } from "react";
import { isStandaloneApp } from "@/lib/app-environment";

/** Hydration-safe installed PWA / Android TWA detection. */
export function useStandaloneApp() {
  const [standalone, setStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => setStandalone(isStandaloneApp());
    update();

    const modes = ["standalone", "fullscreen", "minimal-ui"] as const;
    const media = modes.map((mode) => window.matchMedia(`(display-mode: ${mode})`));
    media.forEach((mq) => mq.addEventListener("change", update));

    return () => media.forEach((mq) => mq.removeEventListener("change", update));
  }, []);

  return { standalone, mounted, isApp: mounted && standalone };
}
