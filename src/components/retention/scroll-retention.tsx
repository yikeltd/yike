"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const PREFIX = "yike_scroll:";

/**
 * Restore scroll only on browser Back/Forward (popstate).
 * Never restore on Link taps — that jumped users to the footer/mid-feed.
 */
export function ScrollRetention() {
  const pathname = usePathname();
  const restoreOnPopRef = useRef(false);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    function onPopState() {
      restoreOnPopRef.current = true;
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const key = `${PREFIX}${pathname}`;
    const shouldRestore = restoreOnPopRef.current;
    restoreOnPopRef.current = false;

    if (shouldRestore) {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const y = Number(saved);
        if (!Number.isNaN(y) && y > 0) {
          requestAnimationFrame(() => window.scrollTo(0, y));
        }
      }
    } else {
      // Forward navigation (bottom nav, header links): land at top.
      requestAnimationFrame(() => window.scrollTo(0, 0));
    }

    function onScroll() {
      sessionStorage.setItem(key, String(window.scrollY));
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      sessionStorage.setItem(key, String(window.scrollY));
    };
  }, [pathname]);

  return null;
}
