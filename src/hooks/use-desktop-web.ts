"use client";

import { useEffect, useState } from "react";
import { isStandaloneApp } from "@/lib/app-environment";

/** True on lg+ viewport in a normal browser tab — not installed PWA/TWA. */
export function useDesktopWeb() {
  const [desktopWeb, setDesktopWeb] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktopWeb(mq.matches && !isStandaloneApp());
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return desktopWeb;
}
