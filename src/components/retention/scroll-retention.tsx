"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PREFIX = "yike_scroll:";

/** Restore scroll on back navigation for feed-style pages. */
export function ScrollRetention() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const key = `${PREFIX}${pathname}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      const y = Number(saved);
      if (!Number.isNaN(y)) {
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
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
